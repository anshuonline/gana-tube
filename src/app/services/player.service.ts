import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { YouTubeSearchResult } from './youtube-api.service';
import { AlgorithmService } from './algorithm.service';
import { YoutubeApiService } from './youtube-api.service';
import { RoomService } from './room.service';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { SyncService, SyncState } from './sync.service';
import { ToastService } from './toast.service';
import { SpinService } from './spin.service';
import { AnalyticsService } from './analytics.service';

import { OfflineService } from './offline.service';

export interface Track extends YouTubeSearchResult {}

export type PlayerState = 'unstarted' | 'loading' | 'playing' | 'paused' | 'ended';

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
  public syncService = inject(SyncService);
  private spinService = inject(SpinService);
  public offlineService = inject(OfflineService);
  private trackStartTime: number = 0;
  private isFetchingMore = false;
  private isRemoteUpdate = false;
  private location = inject(Location);
  private ngZone = inject(NgZone);

  // When true, this instance of the player is just a remote control for another device
  public isRemoteControl = signal<boolean>(false);

  // Video mode — shows the active player's video in a floating window (rooms, admin only)
  public isVideoMode = signal<boolean>(false);

  toggleVideoMode(): void {
    this.isVideoMode.update(v => !v);
  }

  constructor() {
    this.setupSocketListeners();
    this.setupDeviceSyncListeners();
    this.setupNetworkWatcher();

    // Listen Together Sync Worker
    setInterval(() => {
      // Only sync if user is in a room and is the admin
      if (this.roomService.currentRoomInfo() && this.roomService.isAdmin()) {
        const pState = this.playerState();
        if (pState === 'playing' || pState === 'paused') {
          const isPlaying = pState === 'playing';
          let t = 0;
          try {
            if (this.isPlayingOffline()) {
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
  }

  private setupNetworkWatcher(): void {
    if (typeof navigator === 'undefined') return;
    const conn = (navigator as any).connection;
    if (!conn) return;
    this.resolveAutoQuality();
    conn.addEventListener('change', () => this.resolveAutoQuality());
  }

  private resolveAutoQuality(): void {
    if (typeof navigator === 'undefined') return;
    const conn = (navigator as any).connection;
    if (!conn) return;
    const type = conn.effectiveType || '4g';
    const downlink = typeof conn.downlink === 'number' ? conn.downlink : 10;
    let q: 'Data Saver' | 'Standard' | 'High' | 'Max' = 'High';
    if (type === 'slow-2g' || type === '2g') {
      q = 'Data Saver';
    } else if (type === '3g') {
      q = 'Standard';
    } else if (downlink >= 10) {
      q = 'Max';
    }
    this.effectiveQuality.set(q);
  }

  private setupDeviceSyncListeners() {
    this.syncService.onRemoteStateReceived = (state: SyncState) => {
      // If we are acting as a remote control, update our UI state to match
      if (this.isRemoteControl()) {
        this.isRemoteUpdate = true;
        this.playerState.set(state.isPlaying ? 'playing' : 'paused');
        this.currentTime.set(state.currentTime);
        if (state.queue && state.currentIndex !== undefined) {
          this.queue.set(state.queue);
          this.currentIndex.set(state.currentIndex);
        }
        
        // Pause local ytPlayer to ensure no audio plays
        if (this.ytPlayer && this.ytPlayer.getPlayerState() === 1) { // 1 = playing
           this.ytPlayer.pauseVideo();
        }
        
        this.isRemoteUpdate = false;
      }
    };

    this.syncService.onTakeoverRequested = (deviceId: string) => {
      // Someone else took over, we become a remote control
      if (this.syncService.deviceId !== deviceId) {
        this.isRemoteControl.set(true);
        if (this.ytPlayer) {
          this.ytPlayer.pauseVideo();
        }
        this.playerState.set('paused');
      }
    };
  }

  // Helper to broadcast state to SyncService
  public broadcastToSync(forceRemote: boolean = false) {
    if (this.isRemoteUpdate || this.isRemoteControl()) return;
    
    this.syncService.broadcastState({
      isPlaying: this.playerState() === 'playing',
      currentTime: this.currentTime(),
      currentTrackId: this.currentTrack()?.videoId,
      queue: this.queue(),
      currentIndex: this.currentIndex()
    }, forceRemote);
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

  // Audio Quality (Default to 'Standard' / Low for fast buffering and instant playback)
  musicQuality = signal<'Auto' | 'Data Saver' | 'Standard' | 'High' | 'Max'>(
    (() => {
      const valid = ['Auto', 'Data Saver', 'Standard', 'High', 'Max'] as const;
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('gt_music_quality') : null;
      return valid.includes(saved as any) ? (saved as 'Auto' | 'Data Saver' | 'Standard' | 'High' | 'Max') : 'Standard';
    })()
  );

  // Network-resolved quality used when musicQuality is 'Auto'
  private effectiveQuality = signal<'Data Saver' | 'Standard' | 'High' | 'Max'>('Standard');
  resolvedQuality = computed<'Data Saver' | 'Standard' | 'High' | 'Max'>(() => {
    const q = this.musicQuality();
    return q === 'Auto' ? this.effectiveQuality() : (q as 'Data Saver' | 'Standard' | 'High' | 'Max');
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

  setYtPlayer(player: any): void {
    this.ytPlayer = player;
    // Restore volume
    this.ytPlayer.setVolume(this.volume());
    if (this.isMuted()) {
      this.ytPlayer.mute();
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
        if (!this.ytPlayer) return;
        this.isRemoteUpdate = true;
        
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

  playTrack(track: Track): void { if (this.isInRoom() && !this.roomService.isAdmin() && !this.isRemoteUpdate) { this.toastService.show("You cannot play music directly while listening in a room.", 'error'); return; }
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
    this.triggerEngagement();
    this.isShuffled.set(false);
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.queue.set(tracks);
    this.currentIndex.set(startIndex);
    this.playerState.set('loading');

    if (!this.isRemoteUpdate && this.roomService.currentRoomInfo()) {
      this.roomService.adminQueueUpdate(tracks, this.currentIndex());
    }
    this.isRemoteUpdate = false;
    
    if (tracks[startIndex]) {
      const first = tracks[startIndex];
      if (typeof localStorage !== 'undefined' && first && first.videoId) {
        try {
          if (first.title && !first.title.includes('Playing from link') && !first.title.includes('Loading Track')) {
            localStorage.setItem('gt_last_track', JSON.stringify(first));
          }
        } catch (e) {}
      }
      this.location.replaceState('/play?v=' + tracks[startIndex].videoId);
      this.loadInPlayer(tracks[startIndex].videoId);
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
    if (this.isPlayingOffline()) {
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
    if (this.isPlayingOffline()) {
      this.htmlAudio?.pause();
      this.broadcastPlaybackSync(false);
      return;
    }
    if (!this.ytPlayer) return;
    this.ytPlayer.pauseVideo();
    this.broadcastPlaybackSync(false);
  }
  
  private broadcastPlaybackSync(isPlaying: boolean) {
    this.broadcastToSync(true); // Broadcast for personal device sync
    if (!this.isRemoteUpdate && this.roomService.currentRoomInfo()) {
      if (isPlaying) {
        this.roomService.adminResume(this.ytPlayer ? this.ytPlayer.getCurrentTime() : 0);
      } else {
        this.roomService.adminPause(this.ytPlayer ? this.ytPlayer.getCurrentTime() : 0);
      }
    }
  }

  next(): void {
    this.triggerEngagement();
    const q = this.queue();
    if (!q.length) return;
    let nextIdx = this.currentIndex() + 1;
    if (this.isShuffled()) {
      nextIdx = Math.floor(Math.random() * q.length);
    } else if (nextIdx >= q.length) {
      if (this.repeatMode() === 'all' || this.isPlaylistContext()) {
        nextIdx = 0;
      } else if (this.isAutoplayEnabled()) {
        this.handleTrackEnd();
        return;
      } else {
        return;
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
    if (prevIdx < 0) prevIdx = this.repeatMode() === 'all' ? q.length - 1 : 0;
    this.currentIndex.set(prevIdx);
    this.playerState.set('loading');
    this.loadInPlayer(q[prevIdx].videoId);
  }

  playFromQueue(index: number): void {
    this.triggerEngagement();
    const q = this.queue();
    if (index >= 0 && index < q.length) {
      this.currentIndex.set(index);
      this.playerState.set('loading');
      this.loadInPlayer(q[index].videoId);
    }
  }

  addToQueue(track: Track): void { if (this.isInRoom() && !this.roomService.isAdmin() && !this.isRemoteUpdate) { this.toastService.show("You cannot add music directly while listening in a room.", 'error'); return; }
    const q = this.queue();
    this.queue.set([...q, track]);
    if (q.length === 0) {
      this.playTrack(track);
    }
  }

  addNext(track: Track): void {
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
        if (this.isPlayingOffline() && this.htmlAudio) {
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
    this.broadcastToSync(true);
    
    if (this.isPlayingOffline() && this.htmlAudio) {
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
    this.volume.set(value);
    
    if (this.isPlayingOffline() && this.htmlAudio) {
      this.htmlAudio.volume = value / 100;
      if (value > 0 && this.isMuted()) {
        this.isMuted.set(false);
        this.htmlAudio.muted = false;
      }
    }
    
    if (this.ytPlayer) {
      this.ytPlayer.setVolume(value);
      if (value > 0 && this.isMuted()) {
        this.isMuted.set(false);
        this.ytPlayer.unMute();
      }
    }
  }

  setMusicQuality(quality: 'Auto' | 'Data Saver' | 'Standard' | 'High' | 'Max'): void {
    this.musicQuality.set(quality);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_music_quality', quality);
    }
    // Change quality of currently playing video
    if (this.ytPlayer && this.ytPlayer.setPlaybackQuality) {
      const q = quality === 'Auto' ? this.effectiveQuality() : quality;
      const qMap = {
        'Data Saver': 'small',
        'Standard': 'medium',
        'High': 'hd720',
        'Max': 'hd2160'
      };
      this.ytPlayer.setPlaybackQuality(qMap[q]);
    }
  }

  toggleMute(): void {
    const muted = !this.isMuted();
    this.isMuted.set(muted);
    
    if (this.isPlayingOffline() && this.htmlAudio) {
      this.htmlAudio.muted = muted;
    }
    
    if (!this.ytPlayer) return;
    if (muted) {
      this.ytPlayer.mute();
    } else {
      this.ytPlayer.unMute();
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
    this.htmlAudio.addEventListener('timeupdate', () => {
      this.currentTime.set(this.htmlAudio!.currentTime);
    });
    this.htmlAudio.addEventListener('ended', () => {
      this.playerState.set('ended');
      this.currentTime.set(0);
      this.handleTrackEnd();
    });
    this.htmlAudio.addEventListener('play', () => {
      this.playerState.set('playing');
      this.duration.set(this.htmlAudio!.duration || 0);
    });
    this.htmlAudio.addEventListener('pause', () => {
      this.playerState.set('paused');
    });
    this.htmlAudio.addEventListener('loadedmetadata', () => {
      this.duration.set(this.htmlAudio!.duration || 0);
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
    
    if (current) {
      if (typeof localStorage !== 'undefined' && current.videoId) {
        try {
          if (current.title && !current.title.includes('Playing from link') && !current.title.includes('Loading Track')) {
            localStorage.setItem('gt_last_track', JSON.stringify(current));
          }
        } catch (e) {}
      }
      this.analyticsService.recordPlay(current);
      // Proactively fetch more tracks if we are near the end of the queue
      const q = this.queue();
      if (this.isAutoplayEnabled() && !this.isPlaylistContext() && this.repeatMode() !== 'all' && this.currentIndex() >= q.length - 2) {
        this.fetchMoreAutoplayTracks(current);
      }
    }

    if (this.offlineService.isDownloaded(videoId)) {
      this.isPlayingOffline.set(true);
      if (this.ytPlayer && typeof this.ytPlayer.stopVideo === 'function') {
        this.ytPlayer.stopVideo(); // Stop youtube player
      }
      
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
      this.isPlayingOffline.set(false);
      this.htmlAudio!.pause();
      this.htmlAudio!.src = '';
      this.loadInYtPlayer(videoId);
    }

    if (current) {
      const user = this.authService.currentUser();
      if (user && user.email) {
        this.userService.addRecentPlay(user.email, current, this.userService.preferredLanguages());
      }
    }

    if (!isRemote && current && this.roomService.currentRoomInfo()) {
      this.roomService.adminPlayTrack(current);
      // also sync queue when song auto-changes
      this.roomService.adminQueueUpdate(this.queue(), this.currentIndex());
    }
  }

  private loadInYtPlayer(videoId: string): void {
    if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
      this.ytPlayer.loadVideoById(videoId);
    }
  }

  private fetchMoreAutoplayTracks(current: Track, playNextOnSuccess: boolean = false): void {
    if (this.isFetchingMore) return;
    this.isFetchingMore = true;
    
    const query = `${current.channelTitle} ${current.title} similar hit songs`;
    this.youtubeApi.searchMusic(query, 20).subscribe({
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
    this.triggerEngagement();

    if (this.sleepAtEndOfTrack()) {
      this.cancelSleepTimer();
      // Sleep at end of track triggered, stop playback
      return;
    }

    if (this.repeatMode() === 'one') {
      this.seekTo(0);
      this.ytPlayer?.playVideo();
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

        if (this.ytPlayer && !this.isRemoteControl()) {
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
            this.broadcastToSync(); // Send to sync service (will be throttled)
          
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
      } else if (this.isRemoteControl() && this.playerState() === 'playing') {
        // Increment locally by delta if acting as remote, to keep UI moving
        this.ngZone.run(() => {
          this.currentTime.update(t => t + deltaSeconds);
        });
      }
    }, 500);
  });
}
  
  private toastService = inject(ToastService);

  private awardSpinChance(): void {
    const user = this.authService.currentUser();
    if (user && user.email) {
      // Assuming apiUrl is the same as environment or hardcoded
      const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost/manageads/wheel-api.php' 
        : 'https://manageads.ganatube.in/wheel-api.php';
        
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



