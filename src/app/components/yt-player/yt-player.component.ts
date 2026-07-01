import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
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
      <div #playerContainer id="yt-player-element"></div>
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
  @ViewChild('playerContainer') playerContainer!: ElementRef;
  private player: any = null;
  private playerReady = false;

  constructor(private playerService: PlayerService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initYouTubePlayer();
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.destroy();
    }
  }

  private initYouTubePlayer(): void {
    const initPlayer = () => {
      this.player = new YT.Player('yt-player-element', {
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
            this.playerReady = true;
            this.playerService.setYtPlayer(event.target);
          },
          onStateChange: (event: any) => {
            this.playerService.onPlayerStateChange(event);
          },
          onError: (event: any) => {
            console.warn('YT Player error:', event.data);
          },
        },
      });
    };

    if (typeof YT !== 'undefined' && YT.Player) {
      initPlayer();
    } else {
      (window as any)['onYouTubeIframeAPIReady'] = initPlayer;
    }
  }
}
