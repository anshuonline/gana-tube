import { Injectable, signal, computed, inject } from '@angular/core';
import { YouTubeSearchResult } from './youtube-api.service';
import { AlgorithmService } from './algorithm.service';
import { YoutubeApiService } from './youtube-api.service';

export interface Track extends YouTubeSearchResult {}

export type PlayerState = 'unstarted' | 'loading' | 'playing' | 'paused' | 'ended';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private algorithmService = inject(AlgorithmService);
  private youtubeApi = inject(YoutubeApiService);
  private trackStartTime: number = 0;
  private isFetchingMore = false;

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
    if (tracks[startIndex]) {
      this.loadInPlayer(tracks[startIndex].videoId);
    }
    this.fetchMoreTracksIfNeeded();
  }

  togglePlayPause(): void {
    if (!this.ytPlayer) return;
    if (this.playerState() === 'playing') {
      this.ytPlayer.pauseVideo();
    } else {
      this.ytPlayer.playVideo();
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
    }
  }

  private fetchMoreTracksIfNeeded(): void {
    const q = this.queue();
    const idx = this.currentIndex();
    // Fetch more if we have 3 or fewer tracks left to play, and not repeating all
    if (idx >= q.length - 3 && !this.isFetchingMore && this.repeatMode() !== 'all') {
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
      
      this.youtubeApi.searchMusic(randomQuery, 10).subscribe({
        next: (songs) => {
          if (songs && songs.length > 0) {
            // Filter out songs already in the queue to avoid immediate duplicates
            const currentVideoIds = new Set(this.queue().map(t => t.videoId));
            const newSongs = songs.filter(s => !currentVideoIds.has(s.videoId));
            
            if (newSongs.length > 0) {
              this.queue.set([...this.queue(), ...newSongs]);
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
      // Auto-generate queue if we reach the end
      if (this.currentIndex() === q.length - 1) {
        const current = this.currentTrack();
        if (current) {
          this.algorithmService.getAutoplayQueue(current).subscribe(newTracks => {
            if (newTracks && newTracks.length > 0) {
              this.queue.set([...q, ...newTracks]);
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
