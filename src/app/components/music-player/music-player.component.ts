import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucidePlay,
  LucidePause,
  LucideSkipBack,
  LucideSkipForward,
  LucideVolume2,
  LucideVolumeX,
  LucideVolume1,
  LucideShuffle,
  LucideRepeat,
  LucideRepeat2,
  LucideMusic2,
  LucideMaximize2,
  LucideMinimize2,
  LucideListMusic,
  LucideTrash2,
} from '@lucide/angular';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucidePlay,
    LucidePause,
    LucideSkipBack,
    LucideSkipForward,
    LucideVolume2,
    LucideVolumeX,
    LucideVolume1,
    LucideShuffle,
    LucideRepeat,
    LucideRepeat2,
    LucideMusic2,
    LucideMaximize2,
    LucideMinimize2,
    LucideListMusic,
    LucideTrash2,
  ],
  template: `
    <div class="player-bar" [class.visible]="playerService.currentTrack() !== null">
      <!-- Album Art -->
      <div class="player-left" (click)="toggleFullScreen()">
        <div class="album-art-wrapper" *ngIf="playerService.currentTrack() as track">
          <img
            class="album-art"
            [src]="track.thumbnailHigh || track.thumbnail"
            [alt]="track.title"
          />
          <div class="vinyl-overlay" [class.spinning]="playerService.playerState() === 'playing'"></div>
        </div>
        <div class="album-art-placeholder" *ngIf="playerService.currentTrack() === null">
          <svg lucideMusic2 [attr.size]="24"></svg>
        </div>
        <div class="track-meta" *ngIf="playerService.currentTrack() as track">
          <span class="track-name" [title]="track.title">{{ track.title }}</span>
          <span class="track-artist">{{ track.channelTitle }}</span>
        </div>
        <div class="track-meta" *ngIf="playerService.currentTrack() === null">
          <span class="track-name">No song playing</span>
          <span class="track-artist">Search &amp; pick a song</span>
        </div>
      </div>

      <!-- Center Controls -->
      <div class="player-center">
        <div class="control-buttons">
          <button
            class="ctrl-btn secondary"
            [class.active]="playerService.isShuffled()"
            (click)="playerService.toggleShuffle()"
            title="Shuffle"
          >
            <svg lucideShuffle [attr.size]="18"></svg>
          </button>
          <button class="ctrl-btn" (click)="playerService.previous()" title="Previous">
            <svg lucideSkipBack [attr.size]="22"></svg>
          </button>
          <button
            class="play-pause-btn"
            [class.loading]="playerService.playerState() === 'loading'"
            (click)="playerService.togglePlayPause()"
            [disabled]="playerService.currentTrack() === null"
            [title]="playerService.playerState() === 'playing' ? 'Pause' : 'Play'"
          >
            <div class="spinner" *ngIf="playerService.playerState() === 'loading'"></div>
            <ng-container *ngIf="playerService.playerState() !== 'loading'">
              <svg *ngIf="playerService.playerState() === 'playing'" lucidePause [attr.size]="24"></svg>
              <svg *ngIf="playerService.playerState() !== 'playing'" lucidePlay [attr.size]="24"></svg>
            </ng-container>
          </button>
          <button class="ctrl-btn" (click)="playerService.next()" title="Next">
            <svg lucideSkipForward [attr.size]="22"></svg>
          </button>
          <button
            class="ctrl-btn secondary"
            [class.active]="playerService.repeatMode() !== 'none'"
            (click)="playerService.toggleRepeat()"
            [title]="'Repeat: ' + playerService.repeatMode()"
          >
            <svg *ngIf="playerService.repeatMode() === 'one'" lucideRepeat2 [attr.size]="18"></svg>
            <svg *ngIf="playerService.repeatMode() !== 'one'" lucideRepeat [attr.size]="18"></svg>
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <span class="time-label">{{ formatTime(playerService.currentTime()) }}</span>
          <div class="progress-track" (click)="onSeek($event)">
            <div class="progress-fill" [style.width.%]="progressPercent"></div>
            <div class="progress-thumb" [style.left.%]="progressPercent"></div>
          </div>
          <span class="time-label">{{ formatTime(playerService.duration()) }}</span>
        </div>
      </div>

      <!-- Right Controls -->
      <div class="player-right">
        <button
          class="ctrl-btn secondary"
          [class.active]="showQueue()"
          (click)="toggleQueue()"
          title="Play Queue"
        >
          <svg lucideListMusic [attr.size]="18"></svg>
        </button>
        <button class="ctrl-btn secondary" (click)="playerService.toggleMute()" title="Toggle Mute">
          <svg *ngIf="playerService.isMuted() || playerService.volume() === 0" lucideVolumeX [attr.size]="18"></svg>
          <svg *ngIf="!playerService.isMuted() && playerService.volume() > 0 && playerService.volume() < 50" lucideVolume1 [attr.size]="18"></svg>
          <svg *ngIf="!playerService.isMuted() && playerService.volume() >= 50" lucideVolume2 [attr.size]="18"></svg>
        </button>
        <input
          type="range"
          class="volume-slider"
          min="0"
          max="100"
          [value]="playerService.isMuted() ? 0 : playerService.volume()"
          (input)="onVolumeChange($event)"
          title="Volume"
        />
        <button class="ctrl-btn secondary maximize-btn" (click)="toggleFullScreen()" title="Expand Player">
          <svg lucideMaximize2 [attr.size]="18"></svg>
        </button>
      </div>

      <!-- Queue Drawer Panel (Standard Bar) -->
      <div class="queue-drawer" [class.open]="showQueue()">
        <div class="queue-header">
          <h3>Play Queue</h3>
          <button class="close-queue-btn" (click)="showQueue.set(false)">Close</button>
        </div>
        <div class="queue-list">
          <div
            class="queue-item"
            *ngFor="let track of playerService.queue(); let i = index"
            [class.active]="playerService.currentIndex() === i"
            (click)="playerService.playFromQueue(i)"
          >
            <span class="queue-num">{{ i + 1 }}</span>
            <img class="queue-thumb" [src]="track.thumbnail" />
            <div class="queue-meta">
              <span class="queue-title" [title]="track.title">{{ track.title }}</span>
              <span class="queue-artist">{{ track.channelTitle }}</span>
            </div>
            <button class="queue-remove-btn" (click)="onRemoveFromQueue($event, i)" title="Remove">
              <svg lucideTrash2 [attr.size]="14"></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- FULL SCREEN CAR/MEDIA VIEW -->
    <div class="fullscreen-overlay" [class.active]="isFullScreen()">
      <!-- Ambient Dynamic Glow Background -->
      <div class="ambient-glow-bg" *ngIf="playerService.currentTrack() as track" [style.background-image]="'url(' + track.thumbnailHigh + ')'"></div>
      <div class="vignette-overlay"></div>

      <!-- Header Controls -->
      <div class="fs-header">
        <div class="logo-text">Gana<span class="logo-accent">Tube</span></div>
        <div style="display: flex; gap: 16px;">
          <button class="fs-close-btn" [class.active]="showFSQueue()" (click)="toggleFSQueue()" title="Toggle Queue">
            <svg lucideListMusic [attr.size]="24"></svg>
          </button>
          <button class="fs-close-btn" (click)="toggleFullScreen()" title="Exit Fullscreen">
            <svg lucideMinimize2 [attr.size]="24"></svg>
          </button>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="fs-container" [class.with-queue]="showFSQueue()">
        <!-- Left Pane: Large Modern Cover Art (80% size) -->
        <div class="fs-vinyl-section" *ngIf="!showFSQueue()">
          <div class="fs-cover-card" *ngIf="playerService.currentTrack() as track">
            <img [src]="track.thumbnailHigh || track.thumbnail" [alt]="track.title" />
          </div>
        </div>

        <!-- Left Pane replacement: Queue list if toggled inside FS -->
        <div class="fs-queue-section" *ngIf="showFSQueue()">
          <div class="fs-queue-header">
            <h2>Queue List</h2>
          </div>
          <div class="fs-queue-list">
            <div
              class="fs-queue-item"
              *ngFor="let track of playerService.queue(); let i = index"
              [class.active]="playerService.currentIndex() === i"
              (click)="playerService.playFromQueue(i)"
            >
              <span class="fs-queue-num">{{ i + 1 }}</span>
              <img class="fs-queue-thumb" [src]="track.thumbnail" />
              <div class="fs-queue-meta">
                <span class="fs-queue-title">{{ track.title }}</span>
                <span class="fs-queue-artist">{{ track.channelTitle }}</span>
              </div>
              <button class="fs-queue-remove-btn" (click)="onRemoveFromQueue($event, i)" title="Remove">
                <svg lucideTrash2 [attr.size]="18"></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Pane: Large Controls & Track Information -->
        <div class="fs-info-section">
          <div class="track-header" *ngIf="playerService.currentTrack() as track">
            <h1 class="track-title-large" [title]="track.title">{{ track.title }}</h1>
            <p class="track-artist-large">{{ track.channelTitle }}</p>
          </div>

          <!-- Large Progress Scrubber -->
          <div class="fs-progress-bar-wrap">
            <div class="progress-track fs-progress-track" (click)="onSeek($event)">
              <div class="progress-fill" [style.width.%]="progressPercent"></div>
              <div class="progress-thumb" [style.left.%]="progressPercent"></div>
            </div>
            <div class="fs-time-labels">
              <span>{{ formatTime(playerService.currentTime()) }}</span>
              <span>{{ formatTime(playerService.duration()) }}</span>
            </div>
          </div>

          <!-- Huge Dash Buttons -->
          <div class="fs-dashboard-controls">
            <button
              class="fs-ctrl-btn secondary"
              [class.active]="playerService.isShuffled()"
              (click)="playerService.toggleShuffle()"
              title="Shuffle"
            >
              <svg lucideShuffle [attr.size]="28"></svg>
            </button>

            <button class="fs-ctrl-btn" (click)="playerService.previous()" title="Previous">
              <svg lucideSkipBack [attr.size]="36"></svg>
            </button>

            <button
              class="fs-play-btn-large"
              [class.loading]="playerService.playerState() === 'loading'"
              (click)="playerService.togglePlayPause()"
              title="Play/Pause"
            >
              <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;" *ngIf="playerService.playerState() === 'loading'"></div>
              <ng-container *ngIf="playerService.playerState() !== 'loading'">
                <svg *ngIf="playerService.playerState() === 'playing'" lucidePause [attr.size]="42"></svg>
                <svg *ngIf="playerService.playerState() !== 'playing'" lucidePlay [attr.size]="42"></svg>
              </ng-container>
            </button>

            <button class="fs-ctrl-btn" (click)="playerService.next()" title="Next">
              <svg lucideSkipForward [attr.size]="36"></svg>
            </button>

            <button
              class="fs-ctrl-btn secondary"
              [class.active]="playerService.repeatMode() !== 'none'"
              (click)="playerService.toggleRepeat()"
              [title]="'Repeat: ' + playerService.repeatMode()"
            >
              <svg *ngIf="playerService.repeatMode() === 'one'" lucideRepeat2 [attr.size]="28"></svg>
              <svg *ngIf="playerService.repeatMode() !== 'one'" lucideRepeat [attr.size]="28"></svg>
            </button>
          </div>

          <!-- Large Volume Slider -->
          <div class="fs-volume-wrap">
            <button class="fs-ctrl-btn secondary" (click)="playerService.toggleMute()" title="Mute">
              <svg *ngIf="playerService.isMuted() || playerService.volume() === 0" lucideVolumeX [attr.size]="24"></svg>
              <svg *ngIf="!playerService.isMuted() && playerService.volume() > 0 && playerService.volume() < 50" lucideVolume1 [attr.size]="24"></svg>
              <svg *ngIf="!playerService.isMuted() && playerService.volume() >= 50" lucideVolume2 [attr.size]="24"></svg>
            </button>
            <input
              type="range"
              class="fs-volume-slider"
              min="0"
              max="100"
              [value]="playerService.isMuted() ? 0 : playerService.volume()"
              (input)="onVolumeChange($event)"
              title="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./music-player.component.scss'],
})
export class MusicPlayerComponent {
  isFullScreen = signal<boolean>(false);
  showQueue = signal<boolean>(false);
  showFSQueue = signal<boolean>(false);

  constructor(public playerService: PlayerService) {}

  get progressPercent(): number {
    const duration = this.playerService.duration();
    if (!duration) return 0;
    return Math.min(100, (this.playerService.currentTime() / duration) * 100);
  }

  toggleFullScreen(): void {
    if (this.playerService.currentTrack() !== null) {
      this.isFullScreen.set(!this.isFullScreen());
    }
  }

  toggleQueue(): void {
    this.showQueue.set(!this.showQueue());
  }

  toggleFSQueue(): void {
    this.showFSQueue.set(!this.showFSQueue());
  }

  onRemoveFromQueue(event: Event, index: number): void {
    event.stopPropagation();
    this.playerService.removeFromQueue(index);
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  onSeek(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const seekTime = ratio * this.playerService.duration();
    this.playerService.seekTo(Math.max(0, Math.min(seekTime, this.playerService.duration())));
  }

  onVolumeChange(event: Event): void {
    const val = +(event.target as HTMLInputElement).value;
    this.playerService.setVolume(val);
  }
}
