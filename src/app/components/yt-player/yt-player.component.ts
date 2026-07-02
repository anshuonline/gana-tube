import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../services/player.service';

declare var YT: any;

@Component({
  selector: 'app-yt-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="yt-player-container">
      <div id="yt-player-element-0"></div>
      <div id="yt-player-element-1"></div>
      <div id="yt-player-element-2"></div>
      <div id="yt-player-element-3"></div>
    </div>
  `,
  styles: [
    `
      .yt-player-container {
        position: fixed;
        bottom: -9999px;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        pointer-events: none;
        opacity: 0;
      }
    `,
  ],
})
export class YtPlayerComponent implements OnInit, OnDestroy, AfterViewInit {
  private playerService = inject(PlayerService);
  private players: any[] = [null, null, null, null];
  private cuedVideoIds: string[] = ['', '', '', ''];
  private activePlayerIndex = 0;
  private playersReadyCount = 0;
  private totalPlayers = 4;

  constructor() {
    // Watch queue and currentIndex to trigger preloading
    effect(() => {
      const q = this.playerService.queue();
      const idx = this.playerService.currentIndex();
      if (this.playersReadyCount === this.totalPlayers && q.length > 0 && idx >= 0) {
        this.schedulePreloading(q, idx);
      }
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initYouTubePlayers();
  }

  ngOnDestroy(): void {
    this.players.forEach(p => {
      if (p && typeof p.destroy === 'function') p.destroy();
    });
  }

  private initYouTubePlayers(): void {
    const initAll = () => {
      for (let i = 0; i < this.totalPlayers; i++) {
        this.players[i] = new YT.Player(`yt-player-element-${i}`, {
          height: '1',
          width: '1',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              this.playersReadyCount++;
              event.target.mute(); // Mute all initially
              if (this.playersReadyCount === this.totalPlayers) {
                this.setupPlayerProxy();
              }
            },
            onStateChange: (event: any) => {
              // Only forward events from the active player
              if (i === this.activePlayerIndex) {
                this.playerService.onPlayerStateChange(event);
              }
            },
            onError: (event: any) => {
              if (i === this.activePlayerIndex) {
                console.warn('YT Player error on active player:', event.data);
              }
            },
          },
        });
      }
    };

    if (typeof YT !== 'undefined' && YT.Player) {
      initAll();
    } else {
      (window as any)['onYouTubeIframeAPIReady'] = initAll;
    }
  }

  private setupPlayerProxy(): void {
    const proxy = {
      setVolume: (vol: number) => this.players[this.activePlayerIndex]?.setVolume(vol),
      mute: () => this.players[this.activePlayerIndex]?.mute(),
      unMute: () => this.players[this.activePlayerIndex]?.unMute(),
      playVideo: () => this.players[this.activePlayerIndex]?.playVideo(),
      pauseVideo: () => this.players[this.activePlayerIndex]?.pauseVideo(),
      seekTo: (sec: number, allow: boolean) => this.players[this.activePlayerIndex]?.seekTo(sec, allow),
      getPlayerState: () => this.players[this.activePlayerIndex]?.getPlayerState(),
      getCurrentTime: () => this.players[this.activePlayerIndex]?.getCurrentTime(),
      getDuration: () => this.players[this.activePlayerIndex]?.getDuration(),
      loadVideoById: (videoId: string) => this.handleLoadVideo(videoId)
    };
    
    // Unmute the active player initially based on service state
    if (!this.playerService.isMuted()) {
      this.players[this.activePlayerIndex].unMute();
    }
    
    this.playerService.setYtPlayer(proxy);
  }

  private handleLoadVideo(videoId: string): void {
    // Stop all other players just in case
    for (let i = 0; i < this.totalPlayers; i++) {
      if (i !== this.activePlayerIndex) {
        if (typeof this.players[i].stopVideo === 'function') {
          this.players[i].stopVideo();
        }
      }
    }

    // Check if the video is already cued in one of the background players
    let foundIndex = -1;
    for (let i = 0; i < this.totalPlayers; i++) {
      if (this.cuedVideoIds[i] === videoId) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1 && foundIndex !== this.activePlayerIndex) {
      // It's preloaded! Swap active player
      // Mute the old active player
      this.players[this.activePlayerIndex].mute();
      
      this.activePlayerIndex = foundIndex;
      
      // Unmute the new active player and play
      if (!this.playerService.isMuted()) {
        this.players[this.activePlayerIndex].unMute();
      }
      this.players[this.activePlayerIndex].setVolume(this.playerService.volume());
      this.players[this.activePlayerIndex].playVideo();
    } else {
      // Not preloaded (or it was already active), just load it in the current active player
      this.cuedVideoIds[this.activePlayerIndex] = videoId;
      if (!this.playerService.isMuted()) {
        this.players[this.activePlayerIndex].unMute();
      }
      this.players[this.activePlayerIndex].setVolume(this.playerService.volume());
      this.players[this.activePlayerIndex].loadVideoById(videoId);
    }
  }

  private schedulePreloading(queue: any[], currentIndex: number): void {
    const upcomingIds: string[] = [];
    
    // Get up to 3 upcoming videos (taking repeatMode into account if needed)
    for (let i = 1; i <= 3; i++) {
      let idx = currentIndex + i;
      // Handle loop 'all'
      if (idx >= queue.length && this.playerService.repeatMode() === 'all') {
        idx = idx % queue.length;
      }
      if (idx < queue.length) {
        upcomingIds.push(queue[idx].videoId);
      }
    }

    // Find our idle players
    const idleIndices = [0, 1, 2, 3].filter(i => i !== this.activePlayerIndex);

    // For each upcoming video, assign it to an idle player if not already there
    for (let i = 0; i < upcomingIds.length; i++) {
      const vidId = upcomingIds[i];
      const playerIdx = idleIndices[i];
      
      if (playerIdx !== undefined) {
        // If it's already cued with this exact ID, we don't need to re-cue
        if (this.cuedVideoIds[playerIdx] !== vidId) {
          this.cuedVideoIds[playerIdx] = vidId;
          this.players[playerIdx].mute(); // Ensure it's muted
          this.players[playerIdx].cueVideoById(vidId);
        }
      }
    }
  }
}
