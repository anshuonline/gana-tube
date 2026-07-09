import { Component, signal, HostListener, Output, EventEmitter } from '@angular/core';
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
  LucideHeart,
  LucideShare2
} from '@lucide/angular';
import { PlayerService } from '../../services/player.service';
import { AlgorithmService } from '../../services/algorithm.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

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
    LucideHeart,
    LucideShare2
  ],
  template: `
    <div class="player-bar" [class.visible]="playerService.currentTrack() !== null" (click)="onPlayerBarClick($event)">
      <!-- Album Art -->
      <div class="player-left">
        <div class="album-art-wrapper" *ngIf="playerService.currentTrack() as track">
          <img
            class="album-art"
            [src]="track.thumbnailHigh || track.thumbnail"
            [alt]="track.title"
            referrerpolicy="no-referrer"
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
            [class.active]="isCurrentTrackLiked()"
            (click)="toggleLike($event)"
            title="Like"
            *ngIf="playerService.currentTrack() !== null"
          >
            <svg lucideHeart [attr.size]="18" [attr.fill]="isCurrentTrackLiked() ? 'currentColor' : 'none'"></svg>
          </button>
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
        <button class="ctrl-btn secondary" (click)="copyShareLink()" title="Share Link">
          <svg lucideShare2 [attr.size]="18"></svg>
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
    <div class="fullscreen-overlay" [class.active]="isFullScreen()"
         (touchstart)="onTouchStart($event)"
         (touchmove)="onTouchMove($event)"
         (touchend)="onTouchEnd($event)"
         [style.transform]="swipeTransform()"
         [style.transition]="isDragging() ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)'">
      <!-- Ambient Dynamic Glow Background -->
      <div class="ambient-glow-bg" *ngIf="playerService.currentTrack() as track" [style.background-image]="'url(' + track.thumbnailHigh + ')'"></div>
      <div class="vignette-overlay"></div>

      <!-- Header Controls -->
      <div class="fs-header">
        <div class="logo" style="display: flex; align-items: center; gap: 8px;">
          <img src="ganatubenewlogo.png" alt="GanaTube Logo" class="logo-img" style="height: 32px; width: auto;" />
          <span class="logo-text" style="font-size: 1.3rem; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; font-family: 'Outfit', sans-serif;">Tube.in</span>
        </div>
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
            <img [src]="track.thumbnailHigh || track.thumbnail" [alt]="track.title" referrerpolicy="no-referrer" />
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
              [class.active]="isCurrentTrackLiked()"
              (click)="toggleLike($event)"
              title="Like"
            >
              <svg lucideHeart [attr.size]="28" [attr.fill]="isCurrentTrackLiked() ? 'currentColor' : 'none'"></svg>
            </button>

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
      <!-- Toast Notification -->
      <div class="toast-notification" [class.show]="showToast()">
        Link copied to clipboard!
      </div>
    </div>
  `,
  styleUrls: ['./music-player.component.scss'],
})
export class MusicPlayerComponent {
  @Output() expand = new EventEmitter<void>();
  
  isFullScreen = signal<boolean>(false);
  showQueue = signal<boolean>(false);
  showFSQueue = signal<boolean>(false);
  showToast = signal<boolean>(false);

  constructor(
    public playerService: PlayerService,
    public algorithmService: AlgorithmService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  get progressPercent(): number {
    const duration = this.playerService.duration();
    if (!duration) return 0;
    return Math.min(100, (this.playerService.currentTime() / duration) * 100);
  }

  toggleFullScreen(): void {
    if (this.playerService.currentTrack() !== null) {
      this.expand.emit();
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

  isCurrentTrackLiked(): boolean {
    const track = this.playerService.currentTrack();
    if (!track) return false;
    return this.algorithmService.isLiked(track.videoId);
  }

  toggleLike(event: Event): void {
    event.stopPropagation();
    const track = this.playerService.currentTrack();
    if (track) {
      const user = this.authService.currentUser();
      if (user && user.email) {
        this.userService.toggleLike(user.email, track, this.userService.preferredLanguages());
      }
      this.algorithmService.toggleLike(track);
    }
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

  copyShareLink(): void {
    const track = this.playerService.currentTrack();
    if (!track) return;
    
    const url = `${window.location.origin}/?play=${track.videoId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast.set(true);
      setTimeout(() => this.showToast.set(false), 3000);
    });
  }

  onVolumeChange(event: Event): void {
    const val = +(event.target as HTMLInputElement).value;
    this.playerService.setVolume(val);
  }

  onPlayerBarClick(event: MouseEvent): void {
    // Only block fullscreen toggle if the user explicitly clicked a button, slider, or the queue drawer
    const interactiveSelectors = '.ctrl-btn, .fs-ctrl-btn, .play-pause-btn, .progress-track, .volume-slider, .queue-drawer, .q-btn';
    if ((event.target as HTMLElement).closest(interactiveSelectors)) {
      return; // Do not open FS if clicking controls
    }
    this.toggleFullScreen();
  }

  // Swipe Gestures
  touchStartY = signal(0);
  touchCurrentY = signal(0);
  touchStartX = signal(0);
  touchCurrentX = signal(0);
  isDragging = signal(false);
  swipeTransform = signal('');

  onTouchStart(e: TouchEvent) {
    // Don't capture touch if it starts inside any scrollable container
    const scrollableSelector = '.fs-queue-section, .fs-queue-list, .queue-list, .lyrics-container, .volume-slider, .progress-track, [class*="scroll"]';
    if ((e.target as HTMLElement).closest(scrollableSelector)) {
      this.isDragging.set(false);
      return;
    }
    this.touchStartY.set(e.touches[0].clientY);
    this.touchStartX.set(e.touches[0].clientX);
    this.isDragging.set(true);
  }
  
  onTouchMove(e: TouchEvent) {
    if (!this.isDragging()) return;
    this.touchCurrentY.set(e.touches[0].clientY);
    this.touchCurrentX.set(e.touches[0].clientX);
    
    // Only update swipe transform, do NOT call e.preventDefault() — 
    // that was blocking scroll inside queue, lyrics, and all modals.
    this.updateSwipeTransform();
  }

  onTouchEnd(e: TouchEvent) {
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    
    if (!this.touchStartY() || !this.touchCurrentY()) {
      this.resetTouch();
      return;
    }
    
    const diffY = this.touchCurrentY() - this.touchStartY();
    const diffX = this.touchCurrentX() - this.touchStartX();
    
    // Swipe down to dismiss
    if (diffY > 120 && Math.abs(diffY) > Math.abs(diffX)) {
      this.toggleFullScreen();
    } 
    // Swipe left/right for next/prev
    else if (Math.abs(diffX) > 100 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        this.playerService.previous();
      } else {
        this.playerService.next();
      }
    }
    
    this.resetTouch();
  }

  resetTouch() {
    this.touchStartY.set(0);
    this.touchCurrentY.set(0);
    this.touchStartX.set(0);
    this.touchCurrentX.set(0);
    this.swipeTransform.set('');
  }
  
  updateSwipeTransform() {
    if (!this.isDragging() || !this.touchStartY() || !this.touchCurrentY()) {
      this.swipeTransform.set('');
      return;
    }
    const diffY = this.touchCurrentY() - this.touchStartY();
    const diffX = this.touchCurrentX() - this.touchStartX();
    
    // Only animate swipe down if primarily swiping down
    if (diffY > 0 && Math.abs(diffY) > Math.abs(diffX)) {
      this.swipeTransform.set(`translateY(${diffY}px)`);
      return;
    }
    // Only animate left/right if horizontal swipe
    if (Math.abs(diffX) > 20 && Math.abs(diffX) > Math.abs(diffY)) {
      this.swipeTransform.set(`translateX(${diffX}px)`);
      return;
    }
    this.swipeTransform.set('');
  }
}
