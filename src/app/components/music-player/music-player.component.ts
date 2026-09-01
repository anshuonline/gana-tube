import { Component, signal, HostListener, Output, EventEmitter, OnDestroy } from '@angular/core';
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
  LucideShare2,
  LucideMoon,
  LucideMonitor,
  LucideDownload,
  LucideCheck
} from '@lucide/angular';
import { PlayerService } from '../../services/player.service';
import { AlgorithmService } from '../../services/algorithm.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { OfflineService } from '../../services/offline.service';
import { ToastService } from '../../services/toast.service';

import { SyncService } from '../../services/sync.service';

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
    LucideShare2,
    LucideMoon,
    LucideMonitor,
    LucideDownload,
    LucideCheck
  ],
  template: `
    <div class="player-bar" [class.visible]="playerService.currentTrack() !== null" (click)="onPlayerBarClick($event)">
      
      <!-- Ambient Background -->
      <div class="ambient-bg" *ngIf="playerService.currentTrack()?.thumbnail" [style.backgroundImage]="'url(' + (playerService.currentTrack()?.thumbnailHigh || playerService.currentTrack()?.thumbnail) + ')'"></div>
      <div class="ambient-overlay"></div>

      <!-- Full Width Progress Bar at Top -->
      <div class="progress-section full-width-progress">
        <div class="progress-track" (mousedown)="onScrubStart($event)" (touchstart)="onScrubStart($event)">
          <div class="progress-fill" [style.width.%]="displayProgressPercent"></div>
          <div class="progress-thumb" [style.left.%]="displayProgressPercent"></div>
        </div>
      </div>

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
          <div class="thumb-placeholder" *ngIf="!playerService.currentTrack()">
            <svg lucideMusic [attr.size]="24"></svg>
          </div>
          <div class="expand-icon">
            <svg lucideChevronUp [attr.size]="24"></svg>
          </div>
        </div>
        <div class="track-info" (click)="toggleFullScreen()">
          <div class="track-title" [class.marquee]="playerService.currentTrack()?.title?.length! > 25">
            <span>{{ playerService.currentTrack()?.title || 'Not Playing' }}</span>
          </div>
          <div class="track-artist">{{ playerService.currentTrack()?.channelTitle || '---' }}</div>
        </div>
      </div>

      <!-- Center: Controls -->
      <div class="player-center">
        <div class="main-controls">
          <button
            class="ctrl-btn secondary"
            [class.active]="isCurrentTrackLiked()"
            (click)="toggleLike($event)"
            title="Like"
            *ngIf="playerService.currentTrack() !== null"
          >
            <svg lucideHeart [attr.size]="20" [attr.fill]="isCurrentTrackLiked() ? 'currentColor' : 'none'"></svg>
          </button>
          <button
            class="ctrl-btn secondary"
            [class.active]="isDownloaded()"
            [class.loading]="isDownloading()"
            (click)="toggleDownload($event)"
            [title]="isDownloaded() ? 'Downloaded (Available Offline)' : 'Download for Offline'"
            *ngIf="playerService.currentTrack() !== null"
          >
            <div class="spinner" style="width: 14px; height: 14px; border-width: 2px;" *ngIf="isDownloading()"></div>
            <ng-container *ngIf="!isDownloading()">
              <svg *ngIf="!isDownloaded()" lucideDownload [attr.size]="20"></svg>
              <svg *ngIf="isDownloaded()" lucideCheck [attr.size]="20" class="text-green-500" stroke="#10b981"></svg>
            </ng-container>
          </button>
          <button
            class="ctrl-btn secondary"
            [class.active]="playerService.isShuffled()"
            (click)="playerService.toggleShuffle()"
            title="Shuffle"
          >
            <svg lucideShuffle [attr.size]="20"></svg>
          </button>
          <button class="ctrl-btn" (click)="playerService.previous()" title="Previous">
            <svg lucideSkipBack [attr.size]="24"></svg>
          </button>
          <button
            class="play-pause-btn prominent"
            [class.loading]="playerService.playerState() === 'loading'"
            (click)="playerService.togglePlayPause()"
            [disabled]="playerService.currentTrack() === null"
            [title]="playerService.playerState() === 'playing' ? 'Pause' : 'Play'"
          >
            <div class="spinner dark" *ngIf="playerService.playerState() === 'loading'"></div>
            <ng-container *ngIf="playerService.playerState() !== 'loading'">
              <svg *ngIf="playerService.playerState() === 'playing'" lucidePause [attr.size]="28" fill="currentColor"></svg>
              <svg *ngIf="playerService.playerState() !== 'playing'" lucidePlay [attr.size]="28" fill="currentColor" style="margin-left: 2px;"></svg>
            </ng-container>
          </button>
          <button class="ctrl-btn" (click)="playerService.next()" title="Next">
            <svg lucideSkipForward [attr.size]="24"></svg>
          </button>
          <button
            class="ctrl-btn secondary"
            [class.active]="playerService.repeatMode() !== 'none'"
            (click)="playerService.toggleRepeat()"
            [title]="'Repeat: ' + playerService.repeatMode()"
          >
            <svg *ngIf="playerService.repeatMode() === 'one'" lucideRepeat2 [attr.size]="20"></svg>
            <svg *ngIf="playerService.repeatMode() !== 'one'" lucideRepeat [attr.size]="20"></svg>
          </button>
        </div>
      </div>

      <!-- Right Controls -->
      <div class="player-right">
        <span class="time-display">{{ formatTime(playerService.currentTime()) }} / {{ formatTime(playerService.duration()) }}</span>
        <button
          class="ctrl-btn secondary"
          [class.active]="showQueue()"
          (click)="toggleQueue(); $event.stopPropagation()"
          title="Play Queue"
        >
          <svg lucideListMusic [attr.size]="18"></svg>
        </button>
        <!-- <button class="ctrl-btn secondary" (click)="toggleDevices(); $event.stopPropagation()" title="Devices" [class.active]="showDevices()">
          <svg lucideMonitor [attr.size]="18"></svg>
        </button> -->
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

      <!-- Devices Drawer Panel -->
      <div class="devices-drawer" [class.open]="showDevices()" (click)="$event.stopPropagation()">
        <div class="devices-header">
          <h3>Connect to a device</h3>
          <button class="close-devices-btn" (click)="showDevices.set(false)">Close</button>
        </div>
        <div class="devices-list">
          <div
            class="device-item"
            *ngFor="let device of syncService.availableDevices()"
            [class.active]="device.isActive"
            [class.this-device]="device.deviceId === syncService.deviceId"
            (click)="device.deviceId === syncService.deviceId ? syncService.requestTakeover() : syncService.transferPlayback(device.deviceId)"
          >
            <div class="device-icon">
              <svg lucideMonitor *ngIf="!device.isMobile" [attr.size]="24"></svg>
              <!-- fallback for mobile if no LucideSmartphone -->
              <svg lucideMonitor *ngIf="device.isMobile" [attr.size]="24"></svg> 
            </div>
            <div class="device-meta">
              <span class="device-name">{{ device.deviceName }} <span *ngIf="device.deviceId === syncService.deviceId">(This Device)</span></span>
              <span class="device-status" *ngIf="device.isActive">Listening Now</span>
            </div>
          </div>
          
          <div *ngIf="syncService.availableDevices().length === 0" class="no-devices">
            <p *ngIf="!authService.currentUser()">Log in to sync with other devices.</p>
            <p *ngIf="authService.currentUser()">Listening on this device only. Open GanaTube on another device to sync.</p>
          </div>
        </div>
      </div>

      <!-- Queue Drawer Panel (Standard Bar) -->
      <div class="queue-drawer" [class.open]="showQueue()" (click)="$event.stopPropagation()">
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
          <div class="fs-cover-card" *ngIf="playerService.currentTrack() as track" (click)="onCoverClick($event)">
            <img [src]="track.thumbnailHigh || track.thumbnail" [alt]="track.title" referrerpolicy="no-referrer" />
            
            <div class="heart-animation-overlay" *ngIf="showLikeAnimation()">
              <svg lucideHeart [attr.size]="140" fill="#fff" color="#fff"></svg>
            </div>
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
            <div class="progress-track fs-progress-track" (mousedown)="onScrubStart($event)" (touchstart)="onScrubStart($event)">
              <div class="progress-fill" [style.width.%]="displayProgressPercent"></div>
              <div class="progress-thumb" [style.left.%]="displayProgressPercent"></div>
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

            <button
              class="fs-ctrl-btn secondary"
              [class.active]="isDownloaded()"
              [class.loading]="isDownloading()"
              (click)="toggleDownload($event)"
              [title]="isDownloaded() ? 'Downloaded (Available Offline)' : 'Download for Offline'"
              *ngIf="playerService.currentTrack() !== null"
            >
              <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;" *ngIf="isDownloading()"></div>
              <ng-container *ngIf="!isDownloading()">
                <svg *ngIf="!isDownloaded()" lucideDownload [attr.size]="28"></svg>
                <svg *ngIf="isDownloaded()" lucideCheck [attr.size]="28" class="text-green-500" stroke="#10b981"></svg>
              </ng-container>
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

    <!-- Sleep Timer Modal (Outside of both player-bar and fullscreen-overlay) -->
    <div class="sleep-modal-overlay" *ngIf="playerService.showSleepModal()" (click)="playerService.showSleepModal.set(false)">
      <div class="sleep-modal" (click)="$event.stopPropagation()">
        <h3>Sleep Timer</h3>
        <p class="sleep-active-text" *ngIf="playerService.sleepTimerActive()">
          <span *ngIf="playerService.sleepAtEndOfTrack()">Active: Until End of Track</span>
          <span *ngIf="!playerService.sleepAtEndOfTrack()">Active: {{ playerService.formatSleepTimeRemaining() }} left</span>
        </p>
        
        <div class="sleep-options">
          <button class="sleep-opt-btn" (click)="playerService.setSleepAtEndOfTrack()">End of Track</button>
          <button class="sleep-opt-btn" (click)="playerService.setSleepTimer(15)">15 Min</button>
          <button class="sleep-opt-btn" (click)="playerService.setSleepTimer(30)">30 Min</button>
          <button class="sleep-opt-btn" (click)="playerService.setSleepTimer(60)">60 Min</button>
        </div>
        
        <div class="sleep-custom-container">
          <div class="sleep-custom-header">
            <span>Custom Timer</span>
            <span>{{ customSleepTime() }} Min</span>
          </div>
          <input 
            type="range" 
            class="sleep-slider" 
            min="1" 
            max="120" 
            [ngModel]="customSleepTime()" 
            (ngModelChange)="customSleepTime.set($event)"
            (change)="playerService.setSleepTimer(customSleepTime(), false)"
          />
        </div>

        <button class="sleep-cancel-btn" *ngIf="playerService.sleepTimerActive()" (click)="playerService.cancelSleepTimer()">Turn Off Timer</button>
        <button class="sleep-close-btn" (click)="playerService.showSleepModal.set(false)">Close</button>
      </div>
    </div>
  `,
  styleUrls: ['./music-player.component.scss'],
})
export class MusicPlayerComponent implements OnDestroy {
  @Output() expand = new EventEmitter<void>();
  
  isFullScreen = signal<boolean>(false);
  showQueue = signal<boolean>(false);
  showDevices = signal<boolean>(false);
  showFSQueue = signal<boolean>(false);
  showToast = signal<boolean>(false);
  customSleepTime = signal<number>(30);
  isDownloading = signal<boolean>(false);

  constructor(
    public playerService: PlayerService,
    public algorithmService: AlgorithmService,
    private userService: UserService,
    public authService: AuthService,
    public syncService: SyncService,
    public offlineService: OfflineService,
    private toastService: ToastService
  ) {}

  isDownloaded(): boolean {
    const track = this.playerService.currentTrack();
    if (!track) return false;
    return this.offlineService.isDownloaded(track.videoId);
  }

  async toggleDownload(event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!this.authService.currentUser()) {
      this.toastService.info('Please login to download offline');
      this.authService.loginWithGoogle();
      return;
    }
    
    const track = this.playerService.currentTrack();
    if (!track) return;
    
    if (this.isDownloaded()) {
      // If already downloaded, maybe remove it?
      if (confirm('Remove this song from offline library?')) {
        await this.offlineService.removeTrack(track.videoId);
      }
    } else {
      if (this.isDownloading()) return;
      this.isDownloading.set(true);
      const success = await this.offlineService.downloadTrack(track);
      this.isDownloading.set(false);
      
      if (!success) {
        this.toastService.error('Failed to download song. Please check your internet connection.');
      } else {
        this.toastService.success('Song downloaded for offline listening!');
      }
    }
  }

  toggleDevices(): void {
    this.showDevices.set(!this.showDevices());
    if (this.showDevices()) {
      this.showQueue.set(false);
    }
  }

  toggleQueue(): void {
    this.showQueue.set(!this.showQueue());
    if (this.showQueue()) {
      this.showDevices.set(false);
    }
  }

  ngOnDestroy() {
    // Moved to PlayerService
  }

  isScrubbing = signal<boolean>(false);
  scrubPercent = signal<number>(0);
  scrubTarget: HTMLElement | null = null;

  get progressPercent(): number {
    const duration = this.playerService.duration();
    if (!duration) return 0;
    return Math.min(100, (this.playerService.currentTime() / duration) * 100);
  }

  get displayProgressPercent(): number {
    return this.isScrubbing() ? this.scrubPercent() : this.progressPercent;
  }

  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onWindowMove(event: MouseEvent | TouchEvent): void {
    if (!this.isScrubbing()) return;
    this.calculateScrub(event);
  }

  @HostListener('window:mouseup', ['$event'])
  @HostListener('window:touchend', ['$event'])
  onWindowUp(event: MouseEvent | TouchEvent): void {
    if (!this.isScrubbing()) return;
    this.isScrubbing.set(false);
    this.calculateScrub(event, true);
    this.scrubTarget = null;
  }

  onScrubStart(event: MouseEvent | TouchEvent): void {
    const target = event.currentTarget as HTMLElement;
    this.scrubTarget = target;
    this.isScrubbing.set(true);
    this.calculateScrub(event);
  }

  calculateScrub(event: MouseEvent | TouchEvent, doSeek = false): void {
    if (!this.scrubTarget) return;
    
    const rect = this.scrubTarget.getBoundingClientRect();
    let clientX = 0;
    
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX;
    }
    
    let ratio = (clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(ratio, 1));
    this.scrubPercent.set(ratio * 100);

    if (doSeek) {
      const seekTime = ratio * this.playerService.duration();
      this.playerService.seekTo(seekTime);
    }
  }

  toggleFullScreen(): void {
    if (this.playerService.currentTrack() !== null) {
      this.expand.emit();
    }
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
    
    const user = this.authService.currentUser();
    if (user && user.email) {
      return this.userService.likedSongs().some(song => (typeof song === 'string' ? song : song.videoId) === track.videoId);
    }
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
    // Left for backwards compatibility, actual seeking is now handled by onScrubStart/onWindowUp
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

  // Double tap to like
  lastTapTime = 0;
  showLikeAnimation = signal<boolean>(false);

  onCoverClick(event: Event): void {
    const now = Date.now();
    const DOUBLE_CLICK_TIME = 600; // ms
    if (now - this.lastTapTime < DOUBLE_CLICK_TIME) {
      // Double click detected
      this.triggerLikeAnimation(event);
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;
    }
  }

  triggerLikeAnimation(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    
    // Toggle like if not already liked
    if (!this.isCurrentTrackLiked()) {
      this.toggleLike(event);
    }
    
    this.showLikeAnimation.set(true);
    setTimeout(() => {
      this.showLikeAnimation.set(false);
    }, 800); // Wait for animation to finish
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
