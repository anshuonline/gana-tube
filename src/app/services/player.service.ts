import { environment } from '../../environments/environment';
import { Injectable, signal, computed, inject } from '@angular/core';
import { YouTubeSearchResult } from './youtube-api.service';
import { AlgorithmService } from './algorithm.service';
import { YoutubeApiService } from './youtube-api.service';
import { RoomService } from './room.service';

export interface Track extends YouTubeSearchResult {}

export type PlayerState = 'unstarted' | 'loading' | 'playing' | 'paused' | 'ended';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private algorithmService = inject(AlgorithmService);
  private youtubeApi = inject(YoutubeApiService);
  private roomService = inject(RoomService);
  private trackStartTime: number = 0;
  private isFetchingMore = false;
  private isRemoteUpdate = false;
  private audio: HTMLAudioElement | null = null;

  constructor() {
    this.setupSocketListeners();
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupAudioListeners();
      this.setupMediaSession();
    }
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
  currentLanguage = signal<string>('Hindi');

  // Computed signal for the current track
  currentTrack = computed(() => {
    const idx = this.currentIndex();
    const q = this.queue();
    return idx >= 0 && idx < q.length ? q[idx] : null;
  });

  isPlaying = computed(() => {
    return this.playerState() === 'playing';
  });

  private setupAudioListeners(): void {
    if (!this.audio) return;
    this.audio.addEventListener('play', () => {
      this.playerState.set('playing');
      if (this.trackStartTime === 0) this.trackStartTime = Date.now();
      this.updateMediaSessionState();
    });
    this.audio.addEventListener('pause', () => {
      this.playerState.set('paused');
      this.updateMediaSessionState();
    });
    this.audio.addEventListener('ended', () => {
      this.playerState.set('ended');
      this.currentTime.set(0);
      this.handleTrackEnd();
    });
    this.audio.addEventListener('waiting', () => {
      this.playerState.set('loading');
    });
    this.audio.addEventListener('playing', () => {
      this.playerState.set('playing');
    });
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) this.currentTime.set(this.audio.currentTime);
    });
    this.audio.addEventListener('durationchange', () => {
      if (this.audio) this.duration.set(this.audio.duration || 0);
    });
  }

  private setupMediaSession(): void {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
           this.seekTo(details.seekTime);
        }
      });
    }
  }

  private updateMediaSessionMetadata(track: Track): void {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      // @ts-ignore
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.channelTitle,
        album: 'GanaTube',
        artwork: [
          { src: track.thumbnailHigh, sizes: '600x600', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '120x120', type: 'image/jpeg' }
        ]
      });
    }
  }

  private updateMediaSessionState(): void {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && this.audio) {
      navigator.mediaSession.playbackState = this.playerState() === 'playing' ? 'playing' : 'paused';
    }
  }
  
  private setupSocketListeners() {
    const socket = this.roomService.getSocket();
    if (!socket) return;
    
    socket.on('room_state', (state: any) => {
      this.isRemoteUpdate = true;
      if (state.queue && state.queue.length > 0) {
        this.queue.set(state.queue);
        if (state.currentTrack) {
          const idx = state.queue.findIndex((t: any) => t.videoId === state.currentTrack.videoId);
          this.currentIndex.set(idx >= 0 ? idx : 0);
          this.playTrack(state.currentTrack);
          
          if (state.currentTime > 0) {
            if (this.audio) {
              setTimeout(() => {
                if (this.audio) this.audio.currentTime = state.currentTime;
              }, 1000);
            } else {
              (this as any)._pendingSeekTime = state.currentTime;
            }
          }
        }
      }
      this.isRemoteUpdate = false;
    });

    socket.on('track_changed', (track: Track) => {
      this.isRemoteUpdate = true;
      this.playTrack(track);
    });

    socket.on('playback_synced', ({ isPlaying, currentTime }) => {
      if (!this.audio) return;
      this.isRemoteUpdate = true;
      if (currentTime !== undefined && Math.abs(this.audio.currentTime - currentTime) > 2) {
        this.audio.currentTime = currentTime;
      }
      if (isPlaying) {
        this.audio.play().catch(e => console.warn('Play prevented', e));
      } else {
        this.audio.pause();
      }
      this.isRemoteUpdate = false;
    });

    socket.on('queue_synced', ({ queue, currentIndex }) => {
      this.isRemoteUpdate = true;
      this.queue.set(queue);
      this.currentIndex.set(currentIndex);
      this.isRemoteUpdate = false;
    });
  }

  playTrack(track: Track): void {
    this.triggerEngagement();
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
    this.loadInPlayer(track.videoId);
    this.fetchMoreTracksIfNeeded();
  }

  setQueue(tracks: Track[], startIndex = 0): void {
    this.triggerEngagement();
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.queue.set(tracks);
    this.currentIndex.set(startIndex);
    this.playerState.set('loading');
    
    if (!this.isRemoteUpdate && this.roomService.currentRoom()) {
      this.roomService.getSocket().emit('sync_queue', {
        roomId: this.roomService.currentRoom(),
        queue: tracks,
        currentIndex: startIndex
      });
    }
    this.isRemoteUpdate = false;
    
    if (tracks[startIndex]) {
      this.loadInPlayer(tracks[startIndex].videoId);
    }
    this.fetchMoreTracksIfNeeded();
  }

  togglePlayPause(): void {
    if (!this.audio) return;
    if (this.playerState() === 'playing') {
      this.audio.pause();
      this.broadcastPlaybackSync(false);
    } else {
      this.audio.play().catch(e => console.warn('Play prevented', e));
      this.broadcastPlaybackSync(true);
    }
  }
  
  private broadcastPlaybackSync(isPlaying: boolean) {
    if (!this.isRemoteUpdate && this.roomService.currentRoom()) {
      this.roomService.getSocket().emit('sync_playback', {
        roomId: this.roomService.currentRoom(),
        isPlaying,
        currentTime: this.audio ? this.audio.currentTime : 0
      });
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
      if (this.repeatMode() === 'all') nextIdx = 0;
      else return;
    }
    this.currentIndex.set(nextIdx);
    this.playerState.set('loading');
    this.loadInPlayer(q[nextIdx].videoId);
    this.fetchMoreTracksIfNeeded();
  }

  previous(): void {
    this.triggerEngagement();
    const q = this.queue();
    if (!q.length) return;
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
        if (this.audio) { this.audio.pause(); this.audio.src = ""; }
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
    if (this.audio) {
      this.audio.currentTime = seconds;
      if (!this.isRemoteUpdate && this.roomService.currentRoom()) {
        this.roomService.getSocket().emit('sync_playback', {
          roomId: this.roomService.currentRoom(),
          isPlaying: this.playerState() === 'playing',
          currentTime: seconds
        });
      }
    }
  }

  setVolume(value: number): void {
    this.volume.set(value);
    if (this.audio) {
      this.audio.volume = value / 100;
      if (value > 0 && this.isMuted()) {
        this.isMuted.set(false);
        this.audio.muted = false;
      }
    }
  }

  toggleMute(): void {
    if (!this.audio) return;
    const muted = !this.isMuted();
    this.isMuted.set(muted);
    this.audio.muted = muted;
  }

  toggleShuffle(): void {
    this.isShuffled.set(!this.isShuffled());
  }

  toggleRepeat(): void {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'all', 'one'];
    const curr = modes.indexOf(this.repeatMode());
    this.repeatMode.set(modes[(curr + 1) % modes.length]);
  }

  private loadInPlayer(videoId: string): void {
    if (this.audio) {
      const backendUrl = (environment as any).backendUrl || 'http://localhost:3000/api';
      // Use our new streaming endpoint
      this.audio.src = `${backendUrl.replace('/api', '')}/api/stream/${videoId}`;
      this.audio.load();
      this.audio.play().catch(e => console.warn('Autoplay prevented', e));
      
      const current = this.currentTrack();
      if (current) this.updateMediaSessionMetadata(current);
      
      if (!this.isRemoteUpdate && current && this.roomService.currentRoom()) {
        this.roomService.getSocket().emit('play_track', { 
          roomId: this.roomService.currentRoom(), 
          track: current
        });
        this.roomService.getSocket().emit('sync_queue', {
          roomId: this.roomService.currentRoom(),
          queue: this.queue(),
          currentIndex: this.currentIndex()
        });
      }
    }
    this.isRemoteUpdate = false;
  }

  private fetchMoreTracksIfNeeded(): void {
    const q = this.queue();
    const idx = this.currentIndex();
    if (idx >= q.length - 3 && !this.isFetchingMore && this.repeatMode() !== 'all') {
      this.isFetchingMore = true;
      const lang = this.currentLanguage();
      
      const queryOptions = [
        `trending ${lang} songs`,
        `latest ${lang} hits`,
        `best ${lang} music`,
        `popular ${lang} songs`,
        `new release ${lang}`
      ];
      const randomQuery = queryOptions[Math.floor(Math.random() * queryOptions.length)];
      
      const current = this.currentTrack();
      let query = randomQuery;
      
      if (current) {
        query = `${current.channelTitle} ${current.title} similar hit songs`;
      }
      
      this.youtubeApi.searchMusic(query, 25).subscribe({
        next: (songs) => {
          if (songs && songs.length > 0) {
            const currentVideoIds = new Set(this.queue().map(t => t.videoId));
            const newSongs = songs.filter(s => !currentVideoIds.has(s.videoId));
            
            if (newSongs.length > 0) {
              this.queue.set([...this.queue(), ...newSongs]);
            } else {
              this.queue.set([...this.queue(), ...songs.sort(() => 0.5 - Math.random())]);
            }
          }
          this.isFetchingMore = false;
        },
        error: (err) => {
          console.error('Failed to fetch more tracks for queue', err);
          this.isFetchingMore = false;
        }
      });
    }
  }

  private handleTrackEnd(): void {
    this.triggerEngagement();
    if (this.repeatMode() === 'one') {
      this.seekTo(0);
      this.audio?.play();
    } else {
      const q = this.queue();
      if (this.currentIndex() === q.length - 1) {
        const current = this.currentTrack();
        if (current) {
          this.algorithmService.getAutoplayQueue(current).subscribe(newTracks => {
            if (newTracks && newTracks.length > 0) {
              const currentVideoIds = new Set(this.queue().map(t => t.videoId));
              let uniqueNew = newTracks.filter(s => !currentVideoIds.has(s.videoId));
              
              if (uniqueNew.length === 0) {
                uniqueNew = newTracks;
              }
              this.queue.set([...q, ...uniqueNew]);
            }
            this.next();
          });
        }
      } else {
        this.next();
      }
    }
  }

  private triggerEngagement(): void {
    const current = this.currentTrack();
    if (current && this.trackStartTime > 0) {
      const listenDuration = (Date.now() - this.trackStartTime) / 1000;
      this.algorithmService.trackEngagement(current, listenDuration, this.duration() || 240);
      this.trackStartTime = 0; // reset
    }
  }
}
