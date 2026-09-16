import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  effect,
  inject,
  HostListener
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
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: -9999;
        opacity: 0.01;
        overflow: hidden;
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

    // Video mode — show the active player's video in a floating window
    effect(() => {
      const on = this.playerService.isVideoMode();
      this.applyVideoMode(on);
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
      const q = this.playerService.resolvedQuality();
      let initW = '1';
      let initH = '1';
      if (q === 'High') { initW = '1920'; initH = '1080'; }
      else if (q === 'Standard') { initW = '640'; initH = '360'; }
      else if (q === 'Max') { initW = '2560'; initH = '1440'; }

      for (let i = 0; i < this.totalPlayers; i++) {
        this.players[i] = new YT.Player(`yt-player-element-${i}`, {
          height: initH,
          width: initW,
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
                if (event.data === YT.PlayerState.PLAYING) {
                  // The YouTube IFrame API steals keyboard focus when starting playback.
                  // This returns focus to the main window so global shortcuts continue to work.
                  window.focus();
                  if (document.activeElement instanceof HTMLIFrameElement) {
                    document.activeElement.blur();
                  }
                }
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
      seekTo: (sec: number, allow: boolean) => {
        const p = this.players[this.activePlayerIndex];
        if (p && typeof p.seekTo === 'function') {
          p.seekTo(Math.round(sec), allow);
        }
      },
      getPlayerState: () => this.players[this.activePlayerIndex]?.getPlayerState(),
      getCurrentTime: () => this.players[this.activePlayerIndex]?.getCurrentTime(),
      getDuration: () => this.players[this.activePlayerIndex]?.getDuration(),
      getVideoLoadedFraction: () => this.players[this.activePlayerIndex]?.getVideoLoadedFraction?.() || 0,
      loadVideoById: (args: any) => {
        if (typeof args === 'string') {
          this.handleLoadVideo(args, 0);
        } else {
          this.handleLoadVideo(args.videoId, args.startSeconds || 0);
        }
      },
      setPlaybackQuality: (quality: string) => {
        const p = this.players[this.activePlayerIndex];
        
        // Force adaptive streaming algorithm by resizing the iframe itself!
        // YouTube uses IntersectionObserver and element size to throttle quality.
        let w = 1, h = 1;
        if (quality === 'hd720') { w = 1920; h = 1080; }
        else if (quality === 'medium') { w = 640; h = 360; }
        else if (quality === 'hd2160') { w = 2560; h = 1440; }
        
        this.players.forEach(player => {
          if (player && typeof player.setSize === 'function') {
            player.setSize(w, h);
          }
        });

        if (p) {
          p.setPlaybackQuality(quality);
          const state = p.getPlayerState();
          // Smartly reload to force quality change if it's currently playing or paused
          if (state === 1 || state === 2) {
            const time = p.getCurrentTime();
            const vid = this.cuedVideoIds[this.activePlayerIndex];
            if (vid) {
              p.loadVideoById({
                videoId: vid,
                startSeconds: time,
                suggestedQuality: quality
              });
            }
          }
        }
      }
    };
    
    // Unmute the active player initially based on service state
    if (!this.playerService.isMuted()) {
      this.players[this.activePlayerIndex].unMute();
    }
    
    this.playerService.setYtPlayer(proxy);
  }

  private getSuggestedQuality(): string {
    const q = this.playerService.resolvedQuality();
    if (q === 'Data Saver') return 'small';
    if (q === 'Standard') return 'medium';
    if (q === 'Max') return 'hd2160';
    return 'hd720';
  }

  private videoOverlay: HTMLElement | null = null;

  private applyVideoMode(on: boolean): void {
    // The container (opacity 0.01, z-index -9999) creates a stacking context —
    // children can never escape it. So in video mode we raise the container
    // itself and use inline styles on the active player (scoped CSS can't
    // reach the iframe — it has no Angular content attribute).
    const container = typeof document !== 'undefined' ? (document.querySelector('.yt-player-container') as HTMLElement | null) : null;

    for (let i = 0; i < this.totalPlayers; i++) {
      const el = typeof document !== 'undefined' ? (document.getElementById(`yt-player-element-${i}`) as HTMLElement | null) : null;
      if (!el) continue;

      if (on && i === this.activePlayerIndex) {
        // Nudge the player to re-layout and render video at a real size
        const p = this.players[i];
        if (p && typeof p.setSize === 'function') {
          p.setSize(640, 360);
        }

        // Position over the room's cover art (center), larger, YouTube miniplayer style
        let top: number, left: number, w: number, h: number;
        const anchor = typeof document !== 'undefined' ? (document.querySelector('.room-video-anchor') as HTMLElement | null) : null;
        const section = typeof document !== 'undefined' ? (document.querySelector('.player-section') as HTMLElement | null) : null;
        if (section) {
          const srect = section.getBoundingClientRect();
          w = Math.min(Math.round(srect.width - 48), window.innerWidth - 48);
          h = Math.round(w * 9 / 16);
          if (anchor) {
            const arect = anchor.getBoundingClientRect();
            top = Math.round(arect.top + arect.height / 2 - h / 2);
          } else {
            top = Math.round(srect.top + 24);
          }
          left = Math.round(srect.left + 24 + Math.max(0, (srect.width - 48 - w) / 2));
        } else if (anchor) {
          const rect = anchor.getBoundingClientRect();
          w = Math.min(Math.round(rect.width * 1.5), window.innerWidth - 48);
          h = Math.round(w * 9 / 16);
          top = Math.round(rect.top + rect.height / 2 - h / 2);
          left = Math.round(rect.left + rect.width / 2 - w / 2);
        } else {
          w = 400; h = 225;
          top = Math.round(window.innerHeight - h - 120);
          left = Math.round(window.innerWidth - w - 24);
        }

        el.style.cssText = `position:fixed;top:${top}px;left:${left}px;width:${w}px;height:${h}px;z-index:1200;opacity:1;pointer-events:none;border-radius:16px;border:1px solid rgba(236,72,153,0.35);box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 40px rgba(139,92,246,0.25);overflow:hidden;`;

        // Transparent overlay blocks hover/clicks so YouTube's controls,
        // share buttons and branding never appear (cross-origin, can't style inside)
        if (!this.videoOverlay) {
          this.videoOverlay = document.createElement('div');
          document.body.appendChild(this.videoOverlay);
        }
        this.videoOverlay.style.cssText = `position:fixed;top:${top}px;left:${left}px;width:${w}px;height:${h}px;background:transparent;pointer-events:auto;z-index:1201;border-radius:16px;cursor:pointer;`;
      } else {
        el.classList.remove('video-active');
        el.style.cssText = on ? 'display:none;' : '';
      }
    }

    if (container) {
      if (on) {
        container.style.opacity = '1';
        container.style.zIndex = '1199'; // Escape the -9999 stacking context
        container.style.overflow = 'visible';
      } else {
        container.style.opacity = '';
        container.style.zIndex = '';
        container.style.overflow = '';
      }
    }

    if (!on && this.videoOverlay) {
      this.videoOverlay.remove();
      this.videoOverlay = null;
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.playerService.isVideoMode()) {
      this.applyVideoMode(true);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (this.playerService.isVideoMode()) {
      this.applyVideoMode(true);
    }
  }

  private handleLoadVideo(videoId: string, startSeconds: number = 0): void {
    // Check if the video is already cued in one of the background players
    let foundIndex = -1;
    for (let i = 0; i < this.totalPlayers; i++) {
      if (this.cuedVideoIds[i] === videoId) {
        foundIndex = i;
        break;
      }
    }

    const oldActiveIndex = this.activePlayerIndex;
    const quality = this.getSuggestedQuality();

    if (foundIndex !== -1 && foundIndex !== this.activePlayerIndex) {
      // It's preloaded! Swap active player
      this.activePlayerIndex = foundIndex;
      this.applyVideoMode(this.playerService.isVideoMode());
      
      // Stop the old active player to save bandwidth
      if (typeof this.players[oldActiveIndex].stopVideo === 'function') {
        this.players[oldActiveIndex].stopVideo();
      }
      this.cuedVideoIds[oldActiveIndex] = '';
      
      // Unmute the new active player and play
      if (!this.playerService.isMuted()) {
        this.players[this.activePlayerIndex].unMute();
      }
      this.players[this.activePlayerIndex].setVolume(this.playerService.volume());
      this.players[this.activePlayerIndex].setPlaybackQuality(quality);
      
      if (startSeconds > 0) {
        this.players[this.activePlayerIndex].seekTo(startSeconds, true);
      }
      
      this.players[this.activePlayerIndex].playVideo();
    } else {
      // Not preloaded (or it was already active), just load it in the current active player
      this.cuedVideoIds[this.activePlayerIndex] = videoId;
      if (typeof this.players[this.activePlayerIndex].stopVideo === 'function') {
        this.players[this.activePlayerIndex].stopVideo();
      }
      if (!this.playerService.isMuted()) {
        this.players[this.activePlayerIndex].unMute();
      }
      this.players[this.activePlayerIndex].setVolume(this.playerService.volume());
      
      // Use object syntax for loadVideoById to set suggestedQuality and startSeconds
      this.players[this.activePlayerIndex].loadVideoById({
        videoId: videoId,
        startSeconds: startSeconds,
        suggestedQuality: quality
      });
      
      // Stop other background players since the queue path might have changed
      for (let i = 0; i < this.totalPlayers; i++) {
        if (i !== this.activePlayerIndex) {
          if (typeof this.players[i].stopVideo === 'function') {
            this.players[i].stopVideo();
          }
          this.cuedVideoIds[i] = ''; // Clear so schedulePreloading can re-cue properly
        }
      }
    }
  }

  private schedulePreloading(queue: any[], currentIndex: number): void {
    const upcomingIds: string[] = [];
    
    // Get only the next 1 upcoming video to save user bandwidth
    for (let i = 1; i <= 1; i++) {
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
          
          this.players[playerIdx].cueVideoById({
            videoId: vidId,
            suggestedQuality: this.getSuggestedQuality()
          });
        }
      }
    }
  }
}
