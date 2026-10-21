import { Injectable, signal, computed, inject, NgZone, effect } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout, take } from 'rxjs';
import { YouTubeSearchResult } from './youtube-api.service';
import { AlgorithmService } from './algorithm.service';
import { YoutubeApiService } from './youtube-api.service';
import { RoomService } from './room.service';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { SpinService } from './spin.service';
import { AnalyticsService } from './analytics.service';

import { OfflineService } from './offline.service';
import { ContentFilterService } from './content-filter.service';
import { JingleService } from './jingle.service';

export interface Track extends YouTubeSearchResult {}

export type PlayerState = 'unstarted' | 'loading' | 'playing' | 'paused' | 'ended';

// ── JioSaavn match verification ──────────────────────────────────────────────
// A JioSaavn stream is resolved by TEXT search (title/artist), so the returned
// recording must be re-verified against the requested track BEFORE it plays.
// Rule: title AND artist dono match hone chahiye — multiple artists me se EK
// bhi artist poora match ho gaya to confirmed. Fail => wrong recording =>
// the exact YouTube videoId plays instead (tackles wrong playbacks).

function normalizeVerifyText(str: unknown): string {
  return String(str || '')
    .toLowerCase()
    .replace(/\((?:from|feat|ft\.?|with|lyrical|video|audio|official|slowed|reverb|sped|nightcore|lofi|lo-fi|remix)[^)]*\)/g, ' ')
    .replace(/\[(?:from|feat|ft\.?|lyrical|video|audio|official|slowed|reverb|sped|nightcore|lofi|lo-fi|remix)[^\]]*\]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function verifyDice(a: unknown, b: unknown): number {
  const s1 = normalizeVerifyText(a);
  const s2 = normalizeVerifyText(b);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1 : 0;
  const grams = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.slice(i, i + 2);
    grams.set(bg, (grams.get(bg) || 0) + 1);
  }
  let hits = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.slice(i, i + 2);
    const count = grams.get(bg) || 0;
    if (count > 0) {
      grams.set(bg, count - 1);
      hits += 1;
    }
  }
  return (2 * hits) / (s1.length - 1 + s2.length - 1);
}

function verifyArtistOverlap(target: unknown, candidate: unknown): number {
  const splitArtists = (s: unknown) => String(s || '').split(/,|&|\bfeat\.?\b|\bft\.?\b/i);
  const tTokens = new Set(splitArtists(target).flatMap(p => normalizeVerifyText(p).split(' ')).filter(Boolean));
  const cTokens = new Set(splitArtists(candidate).flatMap(p => normalizeVerifyText(p).split(' ')).filter(Boolean));
  if (tTokens.size === 0 || cTokens.size === 0) return 0.5;
  let matched = 0;
  cTokens.forEach(tok => { if (tTokens.has(tok)) matched += 1; });
  const denom = Math.min(tTokens.size, cTokens.size, 4);
  return denom > 0 ? Math.min(1, matched / denom) : 0;
}

function isKnownArtist(name: unknown): boolean {
  const s = String(name || '').trim();
  return Boolean(s) && s.toLowerCase() !== 'unknown artist';
}

// Artist rule: multiple artists me se EK bhi poora artist match => confirmed.
// "Arijit Singh, Pritam" vs "Pritam, Badshah" passes; "Anuv Jain" vs
// "Rahul Sharma" fails (wrong recording => exact YouTube video plays).
function verifyArtistNames(target: unknown, candidate: unknown): boolean {
  const splitNames = (s: unknown) => String(s || '')
    .split(/,|&|\bfeat\.?\b|\bft\.?\b/i)
    .map(part => normalizeVerifyText(part))
    .filter(Boolean);
  const tNames = splitNames(target);
  const cNames = splitNames(candidate);
  for (const t of tNames) {
    for (const c of cNames) {
      if (t === c) return true;
      // "Sanam Puri" vs "Sanam" — chhota naam bade ke andar poora aa jaye
      if (t.length >= 4 && c.length >= 4 && (t.includes(c) || c.includes(t))) return true;
    }
  }
  // Stylised duo credits: "Sachet Tandon" vs "Sachet-Parampara"
  return verifyArtistOverlap(target, candidate) >= 0.5;
}

// Final gate before a JioSaavn stream is allowed to play.
interface SaavnMatchCandidate { title?: string; artist?: string; duration?: number; streamUrl?: string }

function verifySaavnMatch(track: { title?: string; channelTitle?: string; duration?: number } | null, match: SaavnMatchCandidate | null): boolean {
  if (!track?.title || !match?.title) return false;
  let titleScore = verifyDice(track.title, match.title);

  // Repeated/hook titles: "O Maahi" vs "O Maahi O Maahi" score low on Dice
  // but are the same song — token containment rescues them
  const st = new Set(normalizeVerifyText(track.title).split(' ').filter(Boolean));
  const mt = new Set(normalizeVerifyText(match.title).split(' ').filter(Boolean));
  if (st.size && mt.size && titleScore < 0.85) {
    const smaller = st.size <= mt.size ? st : mt;
    const larger = st.size <= mt.size ? mt : st;
    let hits = 0;
    smaller.forEach(tok => { if (larger.has(tok)) hits += 1; });
    if (hits === smaller.size) titleScore = 0.85;
  }
  if (titleScore < 0.75) return false;

  // Artist validation — koi bhi artist match nahi => wrong recording.
  // NOTE: title+duration fingerprint alone is NOT enough — same-title
  // songs by other artists with near-identical durations exist.
  if (isKnownArtist(track.channelTitle) && isKnownArtist(match.artist)) {
    if (!verifyArtistNames(track.channelTitle, match.artist)) return false;
  }

  // Duration sanity — same title/artist but wildly different length is
  // likely a jukebox/extended/cover version. Also reject jukebox-length
  // recordings and tiny snippets outright (anti-spam: >12min / <45s).
  const trackDur = Math.round(track.duration || 0);
  const matchDur = Math.round(match.duration || 0);
  if (matchDur > 0) {
    if (matchDur > 720 || matchDur < 45) return false;
    if (trackDur > 0 && matchDur > 0 && Math.abs(trackDur - matchDur) > 15 && titleScore < 0.9) {
      return false;
    }
  }
  return true;
}

// Deep-link placeholder titles — Saavn se inka search karna hi bekaar hai
function isPlaceholderTrack(title: string | undefined): boolean {
  if (!title) return true;
  return title.includes('Loading Track') || title.includes('Playing Track') || title.includes('Playing from link');
}

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private algorithmService = inject(AlgorithmService);
  private youtubeApi = inject(YoutubeApiService);
  private roomService = inject(RoomService);
  private userService = inject(UserService);
  private analyticsService = inject(AnalyticsService);
  private authService = inject(AuthService);
  private spinService = inject(SpinService);
  public offlineService = inject(OfflineService);
  private contentFilter = inject(ContentFilterService);
  public jingleService = inject(JingleService);
  private trackStartTime: number = 0;
  // Qualified play tracking (prevents instant skips from artificially inflating plays and play time)
  private currentPlayTrackedId: string | null = null;
  private currentPlayDurationListened: number = 0;
  public isFetchingMore = false;
  private lastNonZeroVolume: number = 80;
  private isRemoteUpdate = false;
  private location = inject(Location);
  private ngZone = inject(NgZone);

  // Video mode — shows the active player's video in a floating window (rooms, admin only)
  public isVideoMode = signal<boolean>(false);

  toggleVideoMode(): void {
    this.isVideoMode.update(v => !v);
  }

  constructor() {
    this.setupSocketListeners();
    this.setupNetworkWatcher();
    this.setupMediaSession();

    // Listen Together Sync Worker
    setInterval(() => {
      // Only sync if user is in a room and is the admin
      if (this.roomService.currentRoomInfo() && this.roomService.isAdmin()) {
        const pState = this.playerState();
        if (pState === 'playing' || pState === 'paused') {
          const isPlaying = pState === 'playing';
          let t = 0;
          try {
            if (this.isPlayingOffline() || this.isPlayingSaavn()) {
              t = this.htmlAudio?.currentTime || 0;
            } else if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
              t = this.ytPlayer.getCurrentTime() || 0;
            }
            
            const socket = this.roomService.getSocket();
            if (socket) {
              socket.emit('room:playback_sync', { isPlaying, currentTime: t });
            }
          } catch (e) {
            console.warn('Sync worker error:', e);
          }
        }
      }
    }, 2000);

    this.setupInactivityTracker();
  }

  // ── MediaSession: lock-screen & notification controls ────────────
  // Works for every engine (Saavn audio / offline audio / YouTube IFrame).
  // With the Saavn HTML5 audio engine this gives real lock-screen
  // play/pause/next/previous on Android & iOS.
  private setupMediaSession(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = (navigator as any).mediaSession;

    // Track metadata
    effect(() => {
      const track = this.currentTrack();
      if (!track || typeof (window as any).MediaMetadata === 'undefined') return;
      try {
        const art = track.thumbnailHigh || track.thumbnail || '';
        ms.metadata = new (window as any).MediaMetadata({
          title: track.title || 'GanaTube',
          artist: track.channelTitle || '',
          album: 'GanaTube',
          artwork: art ? [
            { src: art, sizes: '96x96', type: 'image/jpeg' },
            { src: art, sizes: '256x256', type: 'image/jpeg' },
            { src: art, sizes: '512x512', type: 'image/jpeg' }
          ] : []
        });
      } catch (e) {}
    });

    // Playback state
    effect(() => {
      try {
        ms.playbackState = this.isPlaying() ? 'playing' : 'paused';
      } catch (e) {}
    });

    // Action handlers (wired once)
    try {
      ms.setActionHandler('play', () => {
        if (!this.isPlaying()) this.ngZone.run(() => this.togglePlayPause());
      });
      ms.setActionHandler('pause', () => {
        if (this.isPlaying()) this.ngZone.run(() => this.togglePlayPause());
      });
      ms.setActionHandler('previoustrack', () => this.ngZone.run(() => this.previous()));
      ms.setActionHandler('nexttrack', () => this.ngZone.run(() => this.next()));
      ms.setActionHandler('seekto', (details: any) => {
        if (details && typeof details.seekTime === 'number') {
          this.ngZone.run(() => this.seekTo(details.seekTime));
        }
      });
      ms.setActionHandler('stop', () => this.ngZone.run(() => this.pause()));
    } catch (e) {}
  }

  private updateMediaSessionPosition(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const d = this.duration();
    const t = this.currentTime();
    if (d <= 0) return;
    try {
      (navigator as any).mediaSession.setPositionState({
        duration: d,
        playbackRate: (this.isPlayingOffline() || this.isPlayingSaavn()) ? (this.htmlAudio?.playbackRate || 1) : 1,
        position: Math.min(t, d)
      });
    } catch (e) {}
  }

  private setupNetworkWatcher(): void {
    if (typeof navigator === 'undefined') return;
    const conn = (navigator as any).connection;
    if (!conn) return;
    this.resolveAutoQuality();
    conn.addEventListener('change', () => this.resolveAutoQuality());
  }

  private resolveAutoQuality(): void {
    // Deprecated since Auto mode is removed
  }

  // Signals for state management
  queue = signal<Track[]>([]);
  currentIndex = signal<number>(-1);
  playerState = signal<PlayerState>('unstarted');
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  volume = signal<number>(80);
  isMuted = signal<boolean>(false);
  isShuffled = signal<boolean>(false);
  repeatMode = signal<'none' | 'one' | 'all'>('none');
  isAutoplayEnabled = signal<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('gt_autoplay') !== 'false' : true
  );
  currentLanguage = signal<string>('Hindi');
  isPlaylistContext = signal<boolean>(false);
  isCrossfadeEnabled = signal<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('gt_crossfade') === 'true' : false
  );
  crossfadeDuration = signal<number>(
    typeof localStorage !== 'undefined' ? Math.min(10, Math.max(1, parseInt(localStorage.getItem('gt_crossfade_duration') || '5', 10) || 5)) : 5
  );

  // Playback Speed State (1x to 5x)
  playbackSpeed = signal<number>(
    typeof localStorage !== 'undefined' ? Math.max(1, Math.min(5, parseFloat(localStorage.getItem('gt_playback_speed') || '1') || 1)) : 1
  );

  /** Tracks how many songs have been initiated/played in the current session */
  songsPlayedCount = signal<number>(0);

  // Audio Quality (Default to 'Standard')
  musicQuality = signal<'Low' | 'Standard' | 'Best'>(
    (() => {
      const valid = ['Low', 'Standard', 'Best'] as const;
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('gt_music_quality') : null;
      return valid.includes(saved as any) ? (saved as 'Low' | 'Standard' | 'Best') : 'Standard';
    })()
  );

  resolvedQuality = computed<'Low' | 'Standard' | 'Best'>(() => {
    return this.musicQuality();
  });

  // Computed signal for the current track
  currentTrack = computed(() => {
    const idx = this.currentIndex();
    const q = this.queue();
    return idx >= 0 && idx < q.length ? q[idx] : null;
  });

  isPlaying = computed(() => {
    return this.playerState() === 'playing';
  });

  // YouTube Player reference (set by the YT player component)
  private ytPlayer: any = null;
  private progressInterval: any = null;

  // HTML5 Audio for Offline Playback
  private htmlAudio: HTMLAudioElement | null = null;
  private isPlayingOffline = signal<boolean>(false);
  private currentOfflineBlobUrl: string | null = null;

  // ── JioSaavn streaming engine ────────────────────────────────────
  // Primary playback path: a direct Saavn CDN stream played through the shared
  // HTML5 <audio> element (true background playback + lock-screen controls).
  // YouTube IFrame stays as the fallback when no confident match is found.
  isPlayingSaavn = signal<boolean>(false);
  private saavnCache = new Map<string, { streamUrl: string; duration: number }>();
  private saavnToken = 0; // races: async stream resolution vs user skip
  private htmlAudioLoadToken = -1; // which generation the audio src belongs to

  // Sleep Timer State
  showSleepModal = signal<boolean>(false);
  sleepTimerActive = signal<boolean>(false);
  sleepTimeRemaining = signal<number>(0);
  sleepAtEndOfTrack = signal<boolean>(false);
  private sleepTimerInterval: any = null;

  toggleSleepModal(): void {
    this.showSleepModal.set(!this.showSleepModal());
  }

  setSleepTimer(minutes: number, closeModal: boolean = true): void {
    this.cancelSleepTimer();
    this.sleepTimeRemaining.set(minutes * 60);
    this.sleepTimerActive.set(true);
    
    if (closeModal) {
      this.showSleepModal.set(false);
    }

    this.sleepTimerInterval = setInterval(() => {
      const current = this.sleepTimeRemaining();
      if (current <= 1) {
        this.cancelSleepTimer();
        if (this.playerState() === 'playing') {
          this.togglePlayPause();
        }
      } else {
        this.sleepTimeRemaining.set(current - 1);
      }
    }, 1000);
  }

  setSleepAtEndOfTrack(): void {
    this.cancelSleepTimer();
    this.sleepAtEndOfTrack.set(true);
    this.sleepTimerActive.set(true);
    this.showSleepModal.set(false);
  }

  cancelSleepTimer(): void {
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    this.sleepTimerActive.set(false);
    this.sleepAtEndOfTrack.set(false);
    this.sleepTimeRemaining.set(0);
  }

  formatSleepTimeRemaining(): string {
    const totalSeconds = this.sleepTimeRemaining();
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Inactivity Auto-Stop State (Auto-pause if no screen interaction occurs for X minutes)
  isInactivityTimerEnabled = signal<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('gt_inactivity_enabled') !== 'false' : true
  );
  inactivityMinutes = signal<number>(
    typeof localStorage !== 'undefined' ? Math.max(1, Math.min(360, parseInt(localStorage.getItem('gt_inactivity_minutes') || '60', 10) || 60)) : 60
  );
  private lastUserInteractionTime: number = Date.now();
  private inactivityTriggered: boolean = false;

  recordUserActivity(): void {
    this.lastUserInteractionTime = Date.now();
    this.inactivityTriggered = false;
  }

  toggleInactivityTimer(): void {
    this.setInactivityTimerEnabled(!this.isInactivityTimerEnabled());
  }

  setInactivityTimerEnabled(enabled: boolean): void {
    this.isInactivityTimerEnabled.set(enabled);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_inactivity_enabled', String(enabled));
    }
    this.recordUserActivity();
    if (enabled) {
      this.toastService.show(`Auto-stop on inactivity enabled (${this.inactivityMinutes()}m)`, 'info');
    } else {
      this.toastService.show('Auto-stop on inactivity disabled', 'info');
    }
  }

  setInactivityMinutes(mins: number): void {
    const clamped = Math.max(1, Math.min(360, Math.round(mins)));
    this.inactivityMinutes.set(clamped);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_inactivity_minutes', String(clamped));
    }
    this.recordUserActivity();
    this.toastService.show(`Inactivity timer set to ${clamped} min${clamped > 1 ? 's' : ''}`, 'info');
  }

  private setupInactivityTracker(): void {
    if (typeof window === 'undefined') return;

    this.lastUserInteractionTime = Date.now();

    const events = ['touchstart', 'touchmove', 'touchend', 'pointerdown', 'mousedown', 'mousemove', 'keydown', 'scroll', 'click'];
    let lastThrottle = 0;
    const handleInteraction = () => {
      const now = Date.now();
      if (now - lastThrottle > 2000) {
        lastThrottle = now;
        this.lastUserInteractionTime = now;
        this.inactivityTriggered = false;
      }
    };

    this.ngZone.runOutsideAngular(() => {
      events.forEach(evt => {
        window.addEventListener(evt, handleInteraction, { passive: true });
      });

      // Check inactivity periodically every 30 seconds (100% client-side, zero server calls, battery-friendly)
      setInterval(() => {
        if (this.playerState() === 'playing' && this.isInactivityTimerEnabled() && !this.inactivityTriggered) {
          const elapsedMs = Date.now() - this.lastUserInteractionTime;
          const targetLimitMs = this.inactivityMinutes() * 60 * 1000;

          if (elapsedMs >= targetLimitMs) {
            this.inactivityTriggered = true;
            this.ngZone.run(() => {
              this.pause();
              const mins = this.inactivityMinutes();
              const timeLabel = mins >= 60 && mins % 60 === 0 
                ? `${mins / 60} hour${mins / 60 > 1 ? 's' : ''}` 
                : `${mins} minute${mins > 1 ? 's' : ''}`;
              this.toastService.show(`Playback paused after ${timeLabel} of inactivity`, 'info', 5000);
            });
          }
        }
      }, 30000);
    });
  }

  setYtPlayer(player: any): void {
    this.ytPlayer = player;
    // Restore volume
    this.ytPlayer.setVolume(this.volume());
    if (this.isMuted()) {
      this.ytPlayer.mute();
    }
    
    // Restore playback speed
    if (typeof this.ytPlayer.setPlaybackRate === 'function') {
      try {
        this.ytPlayer.setPlaybackRate(this.playbackSpeed());
      } catch (_) {}
    }
    
    // If a track was selected before ytPlayer was initialized, load it now
    const current = this.currentTrack();
    if (current) {
      this.loadInPlayer(current.videoId);
      
      // If we have a pending seek (from room_state), apply it
      if ((this as any)._pendingSeekTime > 0) {
        setTimeout(() => {
          this.seekTo((this as any)._pendingSeekTime);
          (this as any)._pendingSeekTime = 0;
        }, 500);
      }
    }
  }

  setPlaybackSpeed(speed: number): void {
    const clamped = Math.max(1, Math.min(5, Math.round(speed * 100) / 100));
    this.playbackSpeed.set(clamped);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_playback_speed', clamped.toString());
    }
    if (this.ytPlayer && typeof this.ytPlayer.setPlaybackRate === 'function') {
      try {
        this.ytPlayer.setPlaybackRate(clamped);
      } catch (e) {
        console.warn('Failed to set YT playback rate:', e);
      }
    }
    if (this.htmlAudio) {
      try {
        this.htmlAudio.playbackRate = clamped;
      } catch (_) {}
    }
  }
  
  private setupSocketListeners() {
    // Wait until room service initializes its socket
    setTimeout(() => {
      const socket = this.roomService.getSocket();
      if (!socket) return;
      
      socket.on('room:state', (state: any) => {
        // If the local user is the ADMIN and already has music running, adopt the
        // room as-is and sync the room to the admin's current playback instead of
        // wiping local state (queue/cover would otherwise go blank).
        const isAdmin = this.roomService.isAdmin();
        const localTrack = this.currentTrack();
        const localActive = !!localTrack && (this.playerState() === 'playing' || this.playerState() === 'loading');
        if (isAdmin && localActive) {
          this.roomService.adminQueueUpdate(this.queue(), this.currentIndex());
          this.roomService.adminPlayTrack(localTrack);
          return;
        }

        this.isRemoteUpdate = true;
        
        if (state.queue) {
          this.queue.set(state.queue);
        }
        
          if (state.currentTrack) {
            const q = this.queue();
            const idx = q.findIndex((t: any) => t.videoId === state.currentTrack.videoId);
            
            if (idx >= 0) {
              this.currentIndex.set(idx);
            } else {
              // If not in queue, add it
              this.queue.set([...q, state.currentTrack]);
              this.currentIndex.set(q.length);
            }
            
            if ((this as any)._lastLoadedVideoId !== state.currentTrack.videoId) {
              this.location.replaceState('/play?v=' + state.currentTrack.videoId);
              this.loadInPlayer(state.currentTrack.videoId);
              (this as any)._lastLoadedVideoId = state.currentTrack.videoId;
            }
          
          if (state.currentTime > 0) {
            if (this.ytPlayer) {
              setTimeout(() => {
                if (this.ytPlayer) this.ytPlayer.seekTo(state.currentTime, true);
              }, 1000);
            } else {
              (this as any)._pendingSeekTime = state.currentTime;
            }
          }
          
          if (state.isPlaying && this.ytPlayer) {
             setTimeout(() => {
               if (this.ytPlayer) this.ytPlayer.playVideo();
             }, 1000);
          }
        }
        
        this.isRemoteUpdate = false;
      });

      socket.on('room:track_changed', ({ track }) => {
        // Ignore room events if we are no longer in a room
        if (!this.roomService.currentRoomInfo()) return;
        // If the same track is already loaded (echo of our own play), don't reload
        // the player — just make sure it keeps playing.
        const current = this.currentTrack();
        if (current && current.videoId === track.videoId) {
          this.isRemoteUpdate = true;
          if (this.ytPlayer && this.playerState() !== 'playing' && this.playerState() !== 'loading') {
            this.ytPlayer.playVideo();
          }
          this.isRemoteUpdate = false;
          return;
        }
        this.isRemoteUpdate = true;
        this.playTrack(track);
      });

      socket.on('room:playback_sync', ({ isPlaying, currentTime }) => {
        // Ignore room events if we are no longer in a room
        if (!this.roomService.currentRoomInfo()) return;
        this.isRemoteUpdate = true;

        if (this.isPlayingOffline() || this.isPlayingSaavn()) {
          const audio = this.htmlAudio;
          if (audio) {
            if (currentTime !== undefined && Math.abs(audio.currentTime - currentTime) > 2) {
              audio.currentTime = currentTime;
            }
            if (isPlaying) {
              audio.play().catch(() => {});
            } else {
              audio.pause();
            }
          }
          this.isRemoteUpdate = false;
          return;
        }

        if (!this.ytPlayer) return;
        
        const current = this.ytPlayer.getCurrentTime();
        if (currentTime !== undefined && Math.abs(current - currentTime) > 2) {
          this.ytPlayer.seekTo(currentTime, true);
        }
        
        if (isPlaying) {
          this.ytPlayer.playVideo();
        } else {
          this.ytPlayer.pauseVideo();
        }
        
        this.isRemoteUpdate = false;
      });

      socket.on('room:queue_updated', ({ queue, currentIndex }) => {
        // Ignore room events if we are no longer in a room
        if (!this.roomService.currentRoomInfo()) return;
        this.isRemoteUpdate = true;
        this.queue.set(queue);
        if (currentIndex !== undefined) this.currentIndex.set(currentIndex);
        this.isRemoteUpdate = false;
      });
    }, 1000);
  }

  // Determine if user is in a room
  isInRoom = computed(() => !!this.roomService.currentRoomInfo());

  playTrack(track: Track): void {
    if (this.isInRoom() && !this.roomService.isAdmin() && !this.isRemoteUpdate) {
      this.toastService.show("You cannot play music directly while listening in a room.", 'error');
      return;
    }
    if (this.contentFilter.isBlocked(track)) {
      this.toastService.show("This song has been blocked and cannot be played.", 'error');
      return;
    }
    this.triggerEngagement();
    this.isShuffled.set(false);
    this.isPlaylistContext.set(false);
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const q = this.queue();
    const existingIdx = q.findIndex((t) => t.videoId === track.videoId);
    if (existingIdx >= 0) {
      this.currentIndex.set(existingIdx);
    } else {
      this.queue.set([...q, track]);
      this.currentIndex.set(q.length);
    }
    this.playerState.set('loading');
    this.songsPlayedCount.update(c => c + 1);
    this.location.replaceState('/play?v=' + track.videoId);
    this.loadInPlayer(track.videoId);

    if (typeof localStorage !== 'undefined' && track && track.videoId) {
      try {
        if (track.title && !track.title.includes('Playing from link') && !track.title.includes('Loading Track')) {
          localStorage.setItem('gt_last_track', JSON.stringify(track));
        }
      } catch (e) {}
    }

    if (!this.isRemoteUpdate && this.roomService.currentRoomInfo()) {
      this.roomService.adminQueueUpdate(this.queue(), this.currentIndex());
      this.roomService.adminPlayTrack(track);
    }
    this.isRemoteUpdate = false;
  }

  updateTrackInfo(videoId: string, title: string, channelTitle: string): void {
    const q = this.queue();
    const idx = q.findIndex(t => t.videoId === videoId);
    if (idx >= 0) {
      const updated = [...q];
      updated[idx] = { ...updated[idx], title, channelTitle };
      this.queue.set(updated);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('gt_last_track', JSON.stringify(updated[idx]));
        } catch (e) {}
      }
    }
  }

  setQueue(tracks: Track[], startIndex = 0): void {
    if (this.isInRoom() && !this.roomService.isAdmin() && !this.isRemoteUpdate) {
      this.toastService.show('You cannot play music directly while listening in a room.', 'error');
      return;
    }
    const filteredTracks = this.contentFilter.filterTracks(tracks);
    if (!filteredTracks.length) {
      this.toastService.show('No playable songs in this list.', 'error');
      return;
    }
    const safeStartIndex = Math.min(Math.max(0, startIndex), filteredTracks.length - 1);
    this.triggerEngagement();
    this.isShuffled.set(false);
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.queue.set(filteredTracks);
    this.currentIndex.set(safeStartIndex);
    this.playerState.set('loading');

    if (!this.isRemoteUpdate && this.roomService.currentRoomInfo()) {
      this.roomService.adminQueueUpdate(filteredTracks, this.currentIndex());
    }
    this.isRemoteUpdate = false;
    
    if (filteredTracks[safeStartIndex]) {
      const first = filteredTracks[safeStartIndex];
      if (typeof localStorage !== 'undefined' && first && first.videoId) {
        try {
          if (first.title && !first.title.includes('Playing from link') && !first.title.includes('Loading Track')) {
            localStorage.setItem('gt_last_track', JSON.stringify(first));
          }
        } catch (e) {}
      }
      this.location.replaceState('/play?v=' + filteredTracks[safeStartIndex].videoId);
      this.loadInPlayer(filteredTracks[safeStartIndex].videoId);
    }
  }

  updateQueueOrder(newQueue: Track[], newCurrentIndex: number): void {
    if (this.isInRoom() && !this.roomService.isAdmin() && !this.isRemoteUpdate) {
      this.toastService.show('You cannot modify queue order while listening in a room.', 'error');
      return;
    }
    this.queue.set(newQueue);
    this.currentIndex.set(newCurrentIndex);
    
    if (!this.isRemoteUpdate && this.roomService.currentRoomInfo()) {
      this.roomService.adminQueueUpdate(newQueue, this.currentIndex());
    }
  }

  togglePlayPause(): void {
    if (this.jingleService.isJinglePlaying()) {
      if (this.playerState() === 'playing') {
        this.jingleService.pauseJingle();
        this.playerState.set('paused');
      } else {
        this.jingleService.resumeJingle();
        this.playerState.set('playing');
      }
      return;
    }

    if (this.isPlayingOffline() || this.isPlayingSaavn()) {
      if (this.playerState() === 'playing') {
        this.pause();
      } else {
        this.htmlAudio?.play();
        this.broadcastPlaybackSync(true);
      }
      return;
    }
    
    if (!this.ytPlayer) return;
    if (this.playerState() === 'playing') {
      this.pause();
    } else {
      this.ytPlayer.playVideo();
      this.broadcastPlaybackSync(true);
    }
  }

  pause(): void {
    if (this.jingleService.isJinglePlaying()) {
      this.jingleService.pauseJingle();
      this.playerState.set('paused');
      return;
    }

    if (this.isPlayingOffline() || this.isPlayingSaavn()) {
      this.htmlAudio?.pause();
      this.broadcastPlaybackSync(false);
      return;
    }
    if (!this.ytPlayer) return;
    this.ytPlayer.pauseVideo();
    this.broadcastPlaybackSync(false);
  }
  
  private broadcastPlaybackSync(isPlaying: boolean) {
    if (!this.isRemoteUpdate && this.roomService.currentRoomInfo()) {
      const pos = (this.isPlayingOffline() || this.isPlayingSaavn())
        ? (this.htmlAudio?.currentTime || 0)
        : (this.ytPlayer ? this.ytPlayer.getCurrentTime() : 0);
      if (isPlaying) {
        this.roomService.adminResume(pos);
      } else {
        this.roomService.adminPause(pos);
      }
    }
  }

  next(): void {
    this.triggerEngagement();
    const q = this.queue();
    if (!q.length) return;
    let nextIdx = this.currentIndex() + 1;
    if (this.isShuffled()) {
      let attempts = 0;
      do {
        nextIdx = Math.floor(Math.random() * q.length);
        attempts++;
      } while (attempts < 10 && this.contentFilter.isBlocked(q[nextIdx]));
    } else {
      while (nextIdx < q.length && this.contentFilter.isBlocked(q[nextIdx])) {
        nextIdx++;
      }
      if (nextIdx >= q.length) {
        if (this.repeatMode() === 'all' || this.isPlaylistContext()) {
          nextIdx = 0;
          while (nextIdx < q.length && this.contentFilter.isBlocked(q[nextIdx])) {
            nextIdx++;
          }
          if (nextIdx >= q.length) return;
        } else if (this.isAutoplayEnabled()) {
          this.handleTrackEnd();
          return;
        } else {
          return;
        }
      }
    }
    this.currentIndex.set(nextIdx);
    this.playerState.set('loading');
    this.loadInPlayer(q[nextIdx].videoId);
  }

  previous(): void {
    this.triggerEngagement();
    const q = this.queue();
    if (!q.length) return;
    // If > 3s into song, restart; otherwise go to previous
    if (this.currentTime() > 3) {
      this.seekTo(0);
      return;
    }
    let prevIdx = this.currentIndex() - 1;
    while (prevIdx >= 0 && this.contentFilter.isBlocked(q[prevIdx])) {
      prevIdx--;
    }
    if (prevIdx < 0) {
      prevIdx = this.repeatMode() === 'all' ? q.length - 1 : 0;
      while (prevIdx >= 0 && this.contentFilter.isBlocked(q[prevIdx])) {
        prevIdx--;
      }
    }
    if (prevIdx < 0) return;
    this.currentIndex.set(prevIdx);
    this.playerState.set('loading');
    this.loadInPlayer(q[prevIdx].videoId);
  }

  playFromQueue(index: number): void {
    this.triggerEngagement();
    const q = this.queue();
    if (index >= 0 && index < q.length) {
      if (this.contentFilter.isBlocked(q[index])) {
        this.toastService.show("This song has been blocked.", 'error');
        return;
      }
      this.currentIndex.set(index);
      this.playerState.set('loading');
      this.loadInPlayer(q[index].videoId);
    }
  }

  addToQueue(track: Track): void {
    if (this.isInRoom() && !this.roomService.isAdmin() && !this.isRemoteUpdate) {
      this.toastService.show("You cannot add music directly while listening in a room.", 'error');
      return;
    }
    if (this.contentFilter.isBlocked(track)) {
      this.toastService.show("This song is blocked and cannot be added to queue.", 'error');
      return;
    }
    const q = this.queue();
    this.queue.set([...q, track]);
    if (q.length === 0) {
      this.playTrack(track);
    }
  }

  addNext(track: Track): void {
    if (this.contentFilter.isBlocked(track)) {
      this.toastService.show("This song is blocked and cannot be added to queue.", 'error');
      return;
    }
    const q = this.queue();
    const curr = this.currentIndex();
    if (q.length === 0) {
      this.playTrack(track);
    } else {
      const newQueue = [...q];
      newQueue.splice(curr + 1, 0, track);
      this.queue.set(newQueue);
    }
  }

  removeFromQueue(index: number): void {
    const q = this.queue();
    const currIdx = this.currentIndex();
    if (index < 0 || index >= q.length) return;

    const newQueue = q.filter((_, i) => i !== index);
    this.queue.set(newQueue);

    if (currIdx === index) {
        this.triggerEngagement();
        if (newQueue.length === 0) {
          this.currentIndex.set(-1);
          this.playerState.set('unstarted');
          if ((this.isPlayingOffline() || this.isPlayingSaavn()) && this.htmlAudio) {
            this.htmlAudio.pause();
            this.htmlAudio.src = '';
          } else if (this.ytPlayer) {
            this.ytPlayer.stopVideo();
          }
        } else {
        const nextIdx = index >= newQueue.length ? newQueue.length - 1 : index;
        this.currentIndex.set(nextIdx);
        this.loadInPlayer(newQueue[nextIdx].videoId);
      }
    } else if (currIdx > index) {
      this.currentIndex.set(currIdx - 1);
    }
  }

  seekTo(seconds: number): void {
    // Pin the UI at the seek position while the player buffers the new
    // position — otherwise getCurrentTime() still reports the old time and
    // the progress bar appears to jump back.
    this.seekTargetTime = seconds;
    this.seekTargetSetAt = Date.now();
    this.currentTime.set(seconds);
    
    if ((this.isPlayingOffline() || this.isPlayingSaavn()) && this.htmlAudio) {
      this.htmlAudio.currentTime = seconds;
      if (!this.isRemoteUpdate && this.roomService.currentRoomInfo()) {
        this.roomService.adminSeek(seconds);
      }
      return;
    }
    
    if (this.ytPlayer) {
      this.ytPlayer.seekTo(seconds, true);
      
      if (!this.isRemoteUpdate && this.roomService.currentRoomInfo()) {
        this.roomService.adminSeek(seconds);
      }
    }
  }

  setVolume(value: number): void {
    if (value > 0) {
      this.lastNonZeroVolume = value;
      if (this.isMuted()) {
        this.isMuted.set(false);
      }
    }
    this.volume.set(value);
    
    if ((this.isPlayingOffline() || this.isPlayingSaavn()) && this.htmlAudio) {
      this.htmlAudio.volume = value / 100;
      if (value > 0) {
        this.htmlAudio.muted = false;
      }
    }
    
    if (this.ytPlayer) {
      this.ytPlayer.setVolume(value);
      if (value > 0 && typeof this.ytPlayer.unMute === 'function') {
        this.ytPlayer.unMute();
      }
    }

    this.jingleService.setVolume(value, this.isMuted());
  }

  setMusicQuality(quality: 'Low' | 'Standard' | 'Best'): void {
    this.musicQuality.set(quality);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_music_quality', quality);
    }
    // Next Saavn resolutions pick up the new bitrate
    this.saavnCache.clear();
    // Change quality of currently playing video
    if (this.ytPlayer && this.ytPlayer.setPlaybackQuality) {
      const qMap = {
        'Low': 'small',
        'Standard': 'medium',
        'Best': 'hd720'
      };
      this.ytPlayer.setPlaybackQuality(qMap[quality]);
    }
  }

  toggleMute(): void {
    if (this.isMuted() || this.volume() === 0) {
      // Unmute: restore previous non-zero volume (or default 50)
      const restoreVol = this.lastNonZeroVolume > 0 ? this.lastNonZeroVolume : 50;
      this.isMuted.set(false);
      this.setVolume(restoreVol);
      if (this.isPlayingOffline() && this.htmlAudio) {
        this.htmlAudio.muted = false;
      }
      if (this.ytPlayer && typeof this.ytPlayer.unMute === 'function') {
        this.ytPlayer.unMute();
      }
    } else {
      // Mute: save current volume and mute
      if (this.volume() > 0) {
        this.lastNonZeroVolume = this.volume();
      }
      this.isMuted.set(true);
      if ((this.isPlayingOffline() || this.isPlayingSaavn()) && this.htmlAudio) {
        this.htmlAudio.muted = true;
      }
      if (this.ytPlayer && typeof this.ytPlayer.mute === 'function') {
        this.ytPlayer.mute();
      }
    }
  }

  toggleShuffle(): void {
    this.isShuffled.set(!this.isShuffled());
  }

  toggleRepeat(): void {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'all', 'one'];
    const curr = modes.indexOf(this.repeatMode());
    this.repeatMode.set(modes[(curr + 1) % modes.length]);
  }

  toggleAutoplay(): void {
    const newVal = !this.isAutoplayEnabled();
    this.isAutoplayEnabled.set(newVal);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_autoplay', newVal.toString());
    }
  }

  toggleCrossfade(): void {
    const newVal = !this.isCrossfadeEnabled();
    this.isCrossfadeEnabled.set(newVal);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_crossfade', newVal ? 'true' : 'false');
    }
  }

  setCrossfadeDuration(seconds: number): void {
    const val = Math.min(10, Math.max(1, Math.round(seconds)));
    this.crossfadeDuration.set(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_crossfade_duration', val.toString());
    }
  }

  onPlayerStateChange(event: any): void {
    // Engine supervisor: if the IFrame sounds while Saavn/Offline owns
    // playback, silence it instantly — never let both engines play together
    if (this.isPlayingSaavn() || this.isPlayingOffline()) {
      if (event.data === 1) {
        try { this.ytPlayer?.stopVideo(); } catch (e) {}
      }
      return;
    }
    // YT.PlayerState: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
    switch (event.data) {
      case 1: // playing
        if (this.trackStartTime === 0) {
          this.trackStartTime = Date.now();
        }
        this.clearLoadTimeout();
        this.clearStuckLoadingTimer();
        this.playerState.set('playing');
        this.duration.set(this.ytPlayer?.getDuration() || 0);

        // Fix sudden blast of volume at the beginning of a crossfade
        try {
          if (this.isCrossfadeEnabled() && this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function' && (this.ytPlayer.getCurrentTime() || 0) < 1) {
            if (typeof this.ytPlayer.setVolume === 'function') {
              this.ytPlayer.setVolume(0);
              (this as any)._lastSetVolume = 0;
            }
          }
        } catch (e) {
          console.error('Error setting initial crossfade volume', e);
        }

        this.startProgressTracking();
        break;
      case 2: // paused
        this.clearLoadTimeout();
        this.clearStuckLoadingTimer();
        this.playerState.set('paused');
        this.stopProgressTracking();
        break;
      case 0: // ended
        this.clearLoadTimeout();
        this.clearStuckLoadingTimer();
        this.playerState.set('ended');
        this.stopProgressTracking();
        this.currentTime.set(0);
        this.handleTrackEnd();
        break;
      case 3: // buffering
        this.playerState.set('loading');
        this.startStuckLoadingTimer();
        break;
      case 5: // cued — video loaded but browser blocked autoplay after reload
        this.clearLoadTimeout();
        this.clearStuckLoadingTimer();
        if (this.currentTrack()) {
          this.playerState.set('paused');
        }
        break;
    }
  }

  private loadStuckTimer: any = null;

  private startStuckLoadingTimer(): void {
    this.clearStuckLoadingTimer();
    this.loadStuckTimer = setTimeout(() => {
      if (this.playerState() !== 'loading') return;
      let isActuallyPlaying = false;
      try {
        isActuallyPlaying = !!this.ytPlayer && typeof this.ytPlayer.getPlayerState === 'function' && this.ytPlayer.getPlayerState() === 1;
      } catch (e) {
        isActuallyPlaying = false;
      }
      if (!isActuallyPlaying) {
        this.playerState.set('paused');
      }
    }, 8000);
  }

  private clearStuckLoadingTimer(): void {
    if (this.loadStuckTimer) {
      clearTimeout(this.loadStuckTimer);
      this.loadStuckTimer = null;
    }
  }

  private initHtmlAudio(): void {
    if (this.htmlAudio) return;
    this.htmlAudio = new Audio();
    let lastAudioTime = 0;
    this.htmlAudio.addEventListener('timeupdate', () => {
      const cur = this.htmlAudio!.currentTime;
      const delta = Math.max(0, Math.min(2, cur - lastAudioTime));
      lastAudioTime = cur;
      this.currentTime.set(cur);
      if (this.playerState() === 'playing') {
        this.checkAndRecordQualifiedPlay(delta);
      }
    });
    this.htmlAudio.addEventListener('ended', () => {
      const current = this.currentTrack();
      if (current && this.currentPlayTrackedId !== current.videoId) {
        this.currentPlayTrackedId = current.videoId;
        this.recordQualifiedPlay(current);
      }
      this.playerState.set('ended');
      this.currentTime.set(0);
      this.handleTrackEnd();
    });
    this.htmlAudio.addEventListener('play', () => {
      // Engine supervisor: audio started without an owning engine — kill it
      // (prevents a stale Saavn stream sounding under the YT IFrame)
      if (!this.isPlayingSaavn() && !this.isPlayingOffline()) {
        try { this.htmlAudio?.pause(); } catch (e) {}
        return;
      }
      this.playerState.set('playing');
      this.duration.set(this.htmlAudio!.duration || 0);
      try {
        this.htmlAudio!.playbackRate = this.playbackSpeed();
      } catch (_) {}
      this.startProgressTracking();
    });
    this.htmlAudio.addEventListener('pause', () => {
      this.playerState.set('paused');
      this.stopProgressTracking();
    });
    this.htmlAudio.addEventListener('loadedmetadata', () => {
      this.duration.set(this.htmlAudio!.duration || 0);
      // Wrong-recording guard: verify the stream that ACTUALLY started. If
      // its real duration is wildly different from the requested track's
      // duration, JioSaavn resolved the wrong audio — reject it and play
      // the exact YouTube videoId instead.
      if (this.isPlayingSaavn() && this.htmlAudioLoadToken === this.saavnToken) {
        const track = this.currentTrack();
        const trackDur = Math.round(track?.duration || 0);
        const streamDur = this.htmlAudio!.duration;
        if (trackDur > 0 && streamDur && isFinite(streamDur)) {
          if (Math.abs(streamDur - trackDur) > Math.max(15, trackDur * 0.2)) {
            console.warn('Saavn stream duration mismatch — rejecting wrong recording, falling back to YouTube');
            this.isPlayingSaavn.set(false);
            this.playerState.set('loading');
            try { this.htmlAudio!.pause(); this.htmlAudio!.removeAttribute('src'); } catch (e) {}
            if (track) this.loadInYtPlayer(track.videoId, this.saavnToken);
          }
        }
      }
    });
    this.htmlAudio.addEventListener('error', () => {
      // Saavn stream failed mid-playback — fall back to the YouTube engine.
      // Stale guard: an error from an OLD stream must never clobber newer playback
      if (this.isPlayingSaavn() && this.htmlAudioLoadToken === this.saavnToken) {
        console.warn('Saavn stream error — falling back to YouTube');
        this.isPlayingSaavn.set(false);
        const current = this.currentTrack();
        this.playerState.set('loading');
        if (current) this.loadInYtPlayer(current.videoId);
      }
    });
  }

  private loadTimeoutTimer: any = null;

  private startLoadTimeout(): void {
    this.clearLoadTimeout();
    this.loadTimeoutTimer = setTimeout(() => {
      if (this.playerState() === 'loading') {
        this.toastService.show('Taking longer than usual to load...', 'info', 4000);
      }
    }, 4000);
  }

  private clearLoadTimeout(): void {
    if (this.loadTimeoutTimer) {
      clearTimeout(this.loadTimeoutTimer);
      this.loadTimeoutTimer = null;
    }
  }

  private async loadInPlayer(videoId: string): Promise<void> { const isRemote = this.isRemoteUpdate;
    this.location.replaceState('/play?v=' + videoId);
    const current = this.currentTrack();
    this.initHtmlAudio();
    this.startLoadTimeout();
    const saavnToken = ++this.saavnToken;
    
    // Reset qualified play session for incoming track
    this.currentPlayTrackedId = null;
    this.currentPlayDurationListened = 0;

    // ── Promotional Jingle Interstitial (randomly max 4 times in 24h, never mid-song, only before song start/change) ──
    this.jingleService.stopJingle();
    if (!isRemote && !this.isInRoom() && this.jingleService.shouldTriggerJingle()) {
      try {
        await this.jingleService.playJingle(this.volume(), this.isMuted());
      } catch (e) {
        console.warn('Jingle playback skipped:', e);
      }
    }
    // If user skipped or selected another track while jingle was playing, bail out
    if (saavnToken !== this.saavnToken) return;

    if (current) {
      if (typeof localStorage !== 'undefined' && current.videoId) {
        try {
          if (current.title && !current.title.includes('Playing from link') && !current.title.includes('Loading Track')) {
            localStorage.setItem('gt_last_track', JSON.stringify(current));
          }
        } catch (e) {}
      }
      // Proactively fetch more tracks if we are near the end of the queue
      const q = this.queue();
      if (this.isAutoplayEnabled() && !this.isPlaylistContext() && this.repeatMode() !== 'all' && this.currentIndex() >= q.length - 2) {
        this.fetchMoreAutoplayTracks(current);
      }
    }

    // 1. Offline downloads always win (user explicitly saved them)
    if (this.offlineService.isDownloaded(videoId)) {
      this.isPlayingSaavn.set(false);
      this.isPlayingOffline.set(true);
      this.htmlAudioLoadToken = saavnToken;
      try { this.ytPlayer?.stopAll?.(); } catch (e) {} // Stop the whole YT pool
      
      const blobUrl = await this.offlineService.getTrackBlobUrl(videoId);
      if (blobUrl) {
        if (this.currentOfflineBlobUrl) URL.revokeObjectURL(this.currentOfflineBlobUrl);
        this.currentOfflineBlobUrl = blobUrl;
        this.htmlAudio!.src = blobUrl;
        this.htmlAudio!.volume = this.volume() / 100;
        this.htmlAudio!.muted = this.isMuted();
        
        try {
          await this.htmlAudio!.play();
        } catch(e) {
          console.error('Failed to play offline audio', e);
        }
      } else {
        // Fallback to youtube if blob loading failed
        this.isPlayingOffline.set(false);
        this.loadInYtPlayer(videoId);
      }
    } else {
      // 2. JioSaavn stream (background-play engine), 3. YouTube IFrame fallback
      this.isPlayingOffline.set(false);
      this.htmlAudio!.pause();
      this.htmlAudio!.src = '';
      // Kill the WHOLE YT pool immediately — the previous song must never
      // keep sounding during the Saavn resolution window (0.5-4.5s)
      try { this.ytPlayer?.stopAll?.(); } catch (e) {}

      const match = await this.resolveSaavnStream(current);
      // A newer load request superseded this one while resolving
      if (saavnToken !== this.saavnToken) return;

      if (match?.streamUrl) {
        this.isPlayingSaavn.set(true);
        this.htmlAudioLoadToken = saavnToken;
        try { this.ytPlayer?.stopAll?.(); } catch (e) {}
        this.htmlAudio!.volume = this.volume() / 100;
        this.htmlAudio!.muted = this.isMuted();
        this.htmlAudio!.src = match.streamUrl;
        try {
          await this.htmlAudio!.play();
        } catch (e) {
          console.warn('Saavn audio play failed, falling back to YouTube:', e);
          this.isPlayingSaavn.set(false);
          this.loadInYtPlayer(videoId, saavnToken);
        }
      } else {
        this.isPlayingSaavn.set(false);
        this.loadInYtPlayer(videoId, saavnToken);
      }
    }

    if (!isRemote && current && this.roomService.currentRoomInfo()) {
      this.roomService.adminPlayTrack(current);
      // also sync queue when song auto-changes
      this.roomService.adminQueueUpdate(this.queue(), this.currentIndex());
    }
  }

  // Resolve a JioSaavn stream URL for the track (session cache + timeout).
  // Saavn-first validation: title + artist verify — pass => Saavn play
  // (background playback), fail => IMMEDIATELY exact YouTube videoId.
  private async resolveSaavnStream(track: Track | null): Promise<{ streamUrl: string; duration: number } | null> {
    if (!track?.videoId || !track?.title) return null;
    // Placeholder deep-link tracks ("Loading Track...") — searching Saavn
    // for these always returns garbage; skip straight to YouTube
    if (isPlaceholderTrack(track.title)) return null;
    const cached = this.saavnCache.get(track.videoId);
    if (cached) return cached;

    const bitrateMap = { 'Low': 96, 'Standard': 160, 'Best': 320 } as const;
    const bitrate = bitrateMap[this.resolvedQuality()] || 320;

    try {
      const saavnSongId = track.videoId.startsWith('gt_')
        ? track.videoId.replace('gt_', '')
        : (track.videoId.startsWith('saavn_') ? track.videoId.replace('saavn_', '') : '');
      const params = new URLSearchParams({
        title: String(track.title || '').slice(0, 120),
        artist: String(track.channelTitle || '').slice(0, 120),
        album: '',
        duration: String(Math.round(Number(track.duration) || 0)),
        bitrate: String(bitrate)
      });
      if (saavnSongId) {
        params.set('songId', saavnSongId);
      }
      const res: any = await firstValueFrom(
        this.http.get(`/api/saavn/match?${params.toString()}`, { responseType: 'json' })
          .pipe(timeout(4500))
      );
      const match = res?.match;
      if (match?.streamUrl) {
        const isDirectSaavn = track.source === 'saavn' || track.source === 'gt' || track.videoId.startsWith('gt_') || track.videoId.startsWith('saavn_');
        if (!isDirectSaavn && !verifySaavnMatch(track, match)) {
          console.info('[Player] Stream validation failed (title/artist mismatch) — playing exact YouTube video instead');
          return null;
        }
        const entry = { streamUrl: match.streamUrl, duration: match.duration || 0 };
        this.saavnCache.set(track.videoId, entry);
        if (this.saavnCache.size > 120) {
          const oldest = this.saavnCache.keys().next().value;
          if (oldest) this.saavnCache.delete(oldest);
        }
        return entry;
      }
    } catch (e) {
      // no match / timeout — caller falls back to YouTube
    }
    return null;
  }

  private loadInYtPlayer(videoId: string, genToken?: number): void {
    // Engine supervisor: stale loads (superseded by a newer track) stand down,
    // and claiming YT always silences the Saavn/offline audio engines
    if (genToken !== undefined && genToken !== this.saavnToken) return;

    // If videoId is a gt_ or saavn_ pseudo-id, search YouTube for the song to resolve a playable videoId
    if (videoId && (videoId.startsWith('gt_') || videoId.startsWith('saavn_'))) {
      const current = this.currentTrack();
      const query = `${current?.title || ''} ${current?.channelTitle || ''}`.trim();
      if (query) {
        this.youtubeApi.searchMusic(query, 1).pipe(take(1)).subscribe({
          next: (results) => {
            if (genToken !== undefined && genToken !== this.saavnToken) return;
            if (results && results.length > 0 && results[0].videoId) {
              this.loadInYtPlayer(results[0].videoId, genToken);
            }
          },
          error: () => {}
        });
        return;
      }
    }

    this.isPlayingSaavn.set(false);
    this.isPlayingOffline.set(false);
    try { this.htmlAudio?.pause(); } catch (e) {}
    // Full pool reset before claiming YT — no stale cued player may sound
    try { this.ytPlayer?.stopAll?.(); } catch (e) {}
    if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
      this.ytPlayer.loadVideoById(videoId);
    }
  }

  public fetchMoreAutoplayTracks(current: Track, playNextOnSuccess: boolean = false): void {
    if (this.isFetchingMore || !current || !current.videoId) return;
    this.isFetchingMore = true;
    
    this.youtubeApi.getRadioTracks(current.videoId, `${current.channelTitle} ${current.title}`).subscribe({
      next: (newTracks) => {
        if (newTracks && newTracks.length > 0) {
          const q = this.queue();
          const currentVideoIds = new Set(q.map(t => t.videoId));
          let uniqueNew = newTracks.filter(s => !currentVideoIds.has(s.videoId));
          
          if (uniqueNew.length === 0) {
            // If we ran out of unique tracks, just loop the related tracks infinitely
            uniqueNew = newTracks.sort(() => 0.5 - Math.random());
          }
          this.queue.set([...q, ...uniqueNew]);
          
          if (playNextOnSuccess) {
            // Now advance index and play
            const nextIdx = this.currentIndex() + 1;
            if (nextIdx < this.queue().length) {
              this.currentIndex.set(nextIdx);
              this.playerState.set('loading');
              this.loadInPlayer(this.queue()[nextIdx].videoId);
            }
          }
        }
        this.isFetchingMore = false;
      },
      error: (err) => {
        console.error('Autoplay generation failed', err);
        this.isFetchingMore = false;
      }
    });
  }

  private handleTrackEnd(): void {
    const current = this.currentTrack();
    if (current && this.currentPlayTrackedId !== current.videoId) {
      this.currentPlayTrackedId = current.videoId;
      this.recordQualifiedPlay(current);
    }
    this.triggerEngagement();

    if (this.sleepAtEndOfTrack()) {
      this.cancelSleepTimer();
      // Sleep at end of track triggered, stop playback
      return;
    }

    if (this.repeatMode() === 'one') {
      this.seekTo(0);
      if (!this.isPlayingSaavn() && !this.isPlayingOffline()) {
        this.ytPlayer?.playVideo();
      } else {
        this.htmlAudio?.play().catch(() => {});
      }
    } else {
      const q = this.queue();
      // Auto-generate queue if we reach the end and not in playlist context
      if (this.currentIndex() >= q.length - 1 && !this.isPlaylistContext() && this.repeatMode() !== 'all' && this.isAutoplayEnabled()) {
        const current = this.currentTrack();
        if (current) {
          this.fetchMoreAutoplayTracks(current, true);
        } else {
          this.isFetchingMore = false;
        }
      } else {
        // Safe to call next manually since it won't trigger handleTrackEnd
        this.currentIndex.set(this.currentIndex() + 1);
        if (this.currentIndex() < this.queue().length) {
          this.playerState.set('loading');
          this.loadInPlayer(this.queue()[this.currentIndex()].videoId);
        } else {
          this.currentIndex.set(0); // fallback
        }
      }
    }
  }

  private http = inject(HttpClient);
  listeningSeconds = signal<number>(0);

  private triggerEngagement(): void {
    const current = this.currentTrack();
    if (current && this.trackStartTime > 0) {
      const listenDuration = (Date.now() - this.trackStartTime) / 1000;
      this.algorithmService.trackEngagement(current, listenDuration, this.duration() || 240);
      this.trackStartTime = 0; // reset
    }
  }

  /**
   * Evaluates active playback time to ensure a play is only recorded if
   * the user actually listens to the song for at least 20 seconds (or 50% if short).
   * Prevents rapid track skipping (Next-Next) from inflating play counts or daily listening hours.
   */
  private checkAndRecordQualifiedPlay(deltaSeconds: number = 0): void {
    const current = this.currentTrack();
    if (!current || !current.videoId) return;
    if (this.currentPlayTrackedId === current.videoId) return;

    this.currentPlayDurationListened += deltaSeconds;

    const dur = this.duration();
    const threshold = (dur > 0 && dur < 20) ? Math.max(5, dur * 0.5) : 20;

    if (this.currentPlayDurationListened >= threshold) {
      this.currentPlayTrackedId = current.videoId;
      this.recordQualifiedPlay(current);
    }
  }

  private recordQualifiedPlay(current: Track): void {
    this.analyticsService.recordPlay(current);
    const user = this.authService.currentUser();
    if (user && user.email) {
      this.userService.addRecentPlay(user.email, current, this.userService.preferredLanguages());
    } else {
      this.userService.recordGuestPlay();
    }
  }

  private lastTickTime = 0;

  // Seek pinning — keeps the displayed time at the seek target while buffering
  private seekTargetTime = 0;
  private seekTargetSetAt = 0;

  // Buffered portion of the current track (0-100), like YouTube's preload bar
  public bufferedPercent = signal<number>(0);

  private startProgressTracking(): void {
    this.stopProgressTracking();
    this.lastTickTime = Date.now();
    this.ngZone.runOutsideAngular(() => {
      this.progressInterval = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = (now - this.lastTickTime) / 1000;
        this.lastTickTime = now;

        // Saavn/Offline audio engines: currentTime comes from audio timeupdate
        // events — only listening-time accumulation runs here
        if (this.isPlayingSaavn() || this.isPlayingOffline()) {
          this.ngZone.run(() => {
            this.updateMediaSessionPosition();
            if (this.playerState() === 'playing' && this.spinService.spinsLeft() <= 0) {
              this.listeningSeconds.update(v => v + deltaSeconds);
              if (this.listeningSeconds() >= 120) {
                this.listeningSeconds.set(0);
                this.awardSpinChance();
              }
            }
          });
          return;
        }

        if (this.ytPlayer) {
          this.ngZone.run(() => {
            try {
              const cTime = typeof this.ytPlayer.getCurrentTime === 'function' ? this.ytPlayer.getCurrentTime() || 0 : 0;
              const dur = typeof this.ytPlayer.getDuration === 'function' ? this.ytPlayer.getDuration() || 0 : 0;
              const loaded = typeof this.ytPlayer.getVideoLoadedFraction === 'function' ? (this.ytPlayer.getVideoLoadedFraction() || 0) : 0;

              // While seeking, hold the UI at the seek target until the player
              // catches up (buffering an unbuffered position reports the old time)
              let displayTime = cTime;
              if (this.seekTargetTime > 0) {
                const elapsed = Date.now() - this.seekTargetSetAt;
                if (elapsed < 5000 && Math.abs(cTime - this.seekTargetTime) > 1.5) {
                  displayTime = this.seekTargetTime;
                } else {
                  this.seekTargetTime = 0;
                }
              }

              this.currentTime.set(displayTime);
              this.duration.set(dur);
              this.bufferedPercent.set(Math.round(loaded * 100));
            } catch (e) {
              console.error('Error reading time', e);
            }
          });
          
          try {
            const cTime = typeof this.ytPlayer.getCurrentTime === 'function' ? this.ytPlayer.getCurrentTime() || 0 : 0;
            const dur = typeof this.ytPlayer.getDuration === 'function' ? this.ytPlayer.getDuration() || 0 : 0;
          
          // Fake crossfade logic (fade in/out volume)
          if (this.isCrossfadeEnabled() && dur > this.crossfadeDuration() * 2 && typeof this.ytPlayer.setVolume === 'function') {
            const fade = this.crossfadeDuration();
            const timeLeft = dur - cTime;
            let targetVol = this.volume();

            if (timeLeft <= fade && timeLeft > 0) {
              const fadeRatio = Math.max(0, timeLeft / fade);
              targetVol = Math.round(this.volume() * fadeRatio);
            } else if (cTime <= fade) {
              const fadeRatio = Math.min(1, cTime / fade);
              targetVol = Math.round(this.volume() * fadeRatio);
            } else {
              targetVol = Math.round(this.volume());
            }

            if ((this as any)._lastSetVolume !== targetVol) {
              this.ytPlayer.setVolume(targetVol);
              (this as any)._lastSetVolume = targetVol;
            }
          }
          
          // Track qualified song play (at least 20 seconds of actual playback, or track end)
          if (this.playerState() === 'playing') {
            this.checkAndRecordQualifiedPlay(deltaSeconds);
          }

          // Track listening time for spin wheel (120 seconds = 1 chance)
          // ONLY if user has exhausted all daily spins (spinsLeft <= 0)
          if (this.playerState() === 'playing' && this.spinService.spinsLeft() <= 0) {
            this.listeningSeconds.update(v => v + deltaSeconds);
            if (this.listeningSeconds() >= 120) {
              this.listeningSeconds.set(0); // reset
              this.awardSpinChance();
            }
          }
        } catch (e) {
          console.error('Error in progress tracking interval', e);
        }
      }
    }, 500);
  });
}
  
  private toastService = inject(ToastService);

  private awardSpinChance(): void {
    const user = this.authService.currentUser();
    if (user && user.email) {
      const backendUrl = 'https://manageads.ganatube.in/wheel-api.php';
        
      this.http.post<any>(`${backendUrl}?action=add_chance`, { email: user.email })
        .subscribe({
          next: (res) => {
            if (res.status === 'success') {
              this.spinService.spinsLeft.set(res.spins_left);
              this.toastService.show('🎉 You earned a free Spin chance!', 'success');
            }
          },
          error: (err) => console.error('Failed to add chance', err)
        });
    }
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}



