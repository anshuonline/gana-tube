import { Injectable, signal, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { YouTubeSearchResult } from './youtube-api.service';
import { AlgorithmService } from './algorithm.service';
import { YoutubeApiService } from './youtube-api.service';
import { RoomService } from './room.service';
import { UserService } from './user.service';
import { AuthService } from './auth.service';

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
  private authService = inject(AuthService);
  private trackStartTime: number = 0;
  private isFetchingMore = false;
  private isRemoteUpdate = false;
  private location = inject(Location);

  constructor() {
    this.setupSocketListeners();
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
  isPlaylistContext = signal<boolean>(false);

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
    const socket = this.roomService.getSocket();
    if (!socket) return;
    
    socket.on('room_state', (state: any) => {
      this.isRemoteUpdate = true;
      if (state.queue && state.queue.length > 0) {
        this.queue.set(state.queue);
        // Find current index based on currentTrack
        if (state.currentTrack) {
          const idx = state.queue.findIndex((t: any) => t.videoId === state.currentTrack.videoId);
          this.currentIndex.set(idx >= 0 ? idx : 0);
          this.playTrack(state.currentTrack);
          
          if (state.currentTime > 0) {
            if (this.ytPlayer) {
              setTimeout(() => {
                if (this.ytPlayer) this.ytPlayer.seekTo(state.currentTime, true);
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
      if (!this.ytPlayer) return;
      this.isRemoteUpdate = true;
      
      // Sync time if there's a big drift (> 2 seconds)
      const current = this.ytPlayer.getCurrentTime();
      if (currentTime !== undefined && Math.abs(current - currentTime) > 2) {
        this.ytPlayer.seekTo(currentTime, true);
      }
      
      if (isPlaying) {
        this.ytPlayer.playVideo();
      } else {
        this.ytPlayer.pauseVideo();
      }
      
      // Reset immediately since native calls don't trigger wrapper functions
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
    this.fetchMoreTracksIfNeeded();
  }

  setQueue(tracks: Track[], startIndex = 0): void {
    this.triggerEngagement();
    this.isShuffled.set(false);
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
      this.location.replaceState('/play?v=' + tracks[startIndex].videoId);
      this.loadInPlayer(tracks[startIndex].videoId);
    }
    this.fetchMoreTracksIfNeeded();
  }

  togglePlayPause(): void {
    if (!this.ytPlayer) return;
    if (this.playerState() === 'playing') {
      this.ytPlayer.pauseVideo();
      this.broadcastPlaybackSync(false);
    } else {
      this.ytPlayer.playVideo();
      this.broadcastPlaybackSync(true);
    }
  }
  
  private broadcastPlaybackSync(isPlaying: boolean) {
    if (!this.isRemoteUpdate && this.roomService.currentRoom()) {
      this.roomService.getSocket().emit('sync_playback', {
        roomId: this.roomService.currentRoom(),
        isPlaying,
        currentTime: this.ytPlayer ? this.ytPlayer.getCurrentTime() : 0
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
      if (this.repeatMode() === 'all' || this.isPlaylistContext()) nextIdx = 0;
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

  addToQueue(track: Track): void {
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
        if (this.ytPlayer) this.ytPlayer.stopVideo();
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
    if (this.ytPlayer) {
      this.ytPlayer.seekTo(seconds, true);
      
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
    if (this.ytPlayer) {
      this.ytPlayer.setVolume(value);
      if (value > 0 && this.isMuted()) {
        this.isMuted.set(false);
        this.ytPlayer.unMute();
      }
    }
  }

  toggleMute(): void {
    if (!this.ytPlayer) return;
    const muted = !this.isMuted();
    this.isMuted.set(muted);
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

  onPlayerStateChange(event: any): void {
    // YT.PlayerState: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
    switch (event.data) {
      case 1: // playing
        if (this.trackStartTime === 0) {
          this.trackStartTime = Date.now();
        }
        this.playerState.set('playing');
        this.duration.set(this.ytPlayer?.getDuration() || 0);
        this.startProgressTracking();
        break;
      case 2: // paused
        this.playerState.set('paused');
        this.stopProgressTracking();
        break;
      case 0: // ended
        this.playerState.set('ended');
        this.stopProgressTracking();
        this.currentTime.set(0);
        this.handleTrackEnd();
        break;
      case 3: // buffering
        this.playerState.set('loading');
        break;
    }
  }

  private loadInPlayer(videoId: string): void {
    if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
      this.ytPlayer.loadVideoById(videoId);
      
      const current = this.currentTrack();
      
      // Add to recent plays (History) whenever a new track loads
      if (current) {
        const user = this.authService.currentUser();
        if (user && user.email) {
          this.userService.addRecentPlay(user.email, current, this.userService.preferredLanguages());
        }
      }

      if (!this.isRemoteUpdate && current && this.roomService.currentRoom()) {
        this.roomService.getSocket().emit('play_track', { 
          roomId: this.roomService.currentRoom(), 
          track: current
        });
        // also sync queue when song auto-changes
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
    // Fetch more if we have 3 or fewer tracks left to play, and not repeating all, and NOT in playlist context
    if (idx >= q.length - 3 && !this.isFetchingMore && this.repeatMode() !== 'all' && !this.isPlaylistContext()) {
      this.isFetchingMore = true;
      const lang = this.currentLanguage();
      
      // Use the current language to find trending/popular songs for the infinite loop
      // If we had a direct "getRelatedVideos" API, we would use that, but since we are
      // using searchMusic, we will use a diverse language-specific query.
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
      
      // If we have a current track, use its title and artist to get highly relevant continuous music
      if (current) {
        query = `${current.channelTitle} ${current.title} similar hit songs`;
      }
      
      this.youtubeApi.searchMusic(query, 25).subscribe({
        next: (songs) => {
          if (songs && songs.length > 0) {
            // Filter out songs already in the queue to avoid immediate duplicates
            const currentVideoIds = new Set(this.queue().map(t => t.videoId));
            const newSongs = songs.filter(s => !currentVideoIds.has(s.videoId));
            
            if (newSongs.length > 0) {
              this.queue.set([...this.queue(), ...newSongs]);
            } else {
              // If all were duplicates, just append them anyway to keep the loop going!
              // But shuffle them slightly so it doesn't feel repetitive
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
      this.ytPlayer?.playVideo();
    } else {
      const q = this.queue();
      // Auto-generate queue if we reach the end and not in playlist context
      if (this.currentIndex() === q.length - 1 && !this.isPlaylistContext() && this.repeatMode() !== 'all') {
        const current = this.currentTrack();
        if (current) {
          this.algorithmService.getAutoplayQueue(current).subscribe(newTracks => {
            if (newTracks && newTracks.length > 0) {
              const currentVideoIds = new Set(this.queue().map(t => t.videoId));
              let uniqueNew = newTracks.filter(s => !currentVideoIds.has(s.videoId));
              
              if (uniqueNew.length === 0) {
                // If we ran out of unique tracks, just loop the related tracks infinitely
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

  private startProgressTracking(): void {
    this.stopProgressTracking();
    this.progressInterval = setInterval(() => {
      if (this.ytPlayer) {
        this.currentTime.set(this.ytPlayer.getCurrentTime() || 0);
        this.duration.set(this.ytPlayer.getDuration() || 0);
      }
    }, 500);
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}
