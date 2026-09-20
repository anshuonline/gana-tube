import { Component, Input, Output, EventEmitter, inject, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService, Track } from '../../services/player.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { AlgorithmService } from '../../services/algorithm.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';
import { 
  LucideListPlus,
  LucideListStart,
  LucideFolderPlus,
  LucideHeart,
  LucideShare2,
  LucideRadio,
  LucideTrash2,
  LucideMoon,
  LucideVolumeX,
  LucideVolume1,
  LucideVolume2,
  LucideChevronDown,
  LucideChevronUp
} from '@lucide/angular';
import { FormsModule } from '@angular/forms';
import { OfflineService } from '../../services/offline.service';

@Component({
  selector: 'app-track-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideListPlus,
    LucideListStart,
    LucideFolderPlus,
    LucideHeart,
    LucideShare2,
    LucideRadio,
    LucideTrash2,
    LucideMoon,
    LucideVolumeX,
    LucideVolume1,
    LucideVolume2,
    LucideChevronDown,
    LucideChevronUp
  ],
  templateUrl: './track-menu.component.html',
  styleUrls: ['./track-menu.component.scss']
})
export class TrackMenuComponent implements OnChanges {
  @Input() track: any;
  @Input() isOpen = false;
  
  @Input() xPos = 0;
  @Input() yPos = 0;
  
  calculatedX = 0;
  calculatedY = 0;
  
  @Output() closeMenu = new EventEmitter<void>();
  @Output() openPlaylist = new EventEmitter<any>();
  
  @Input() playlistContextId?: string;
  @Input() isOwner?: boolean;
  @Output() removeFromPlaylist = new EventEmitter<any>();

  public playerService = inject(PlayerService);
  public authService = inject(AuthService);
  public userService = inject(UserService);
  public algorithmService = inject(AlgorithmService);
  public offlineService = inject(OfflineService);
  public toastService = inject(ToastService);
  private router = inject(Router);

  isMobile = false;
  isFullScreen = false;
  
  // Touch Drag State
  private startY = 0;
  private currentY = 0;
  public transformY = 0;
  public isDragging = false;

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    this.calculatePosition();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.track-menu-container') && !target.closest('.icon-btn') && !target.closest('.track-options-btn')) {
        this.close();
      }
    }
  }

  isArtistsExpanded = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] || changes['track']) {
      this.isArtistsExpanded = false;
    }
    if (changes['isOpen'] || changes['xPos'] || changes['yPos']) {
      this.calculatePosition();
    }
  }

  calculatePosition() {
    if (this.isMobile || !this.isOpen) return;
    
    // Width of desktop track menu
    const menuWidth = 260;
    // Accurate height of track menu without download option
    const menuHeight = 460;

    let finalX = this.xPos;
    let finalY = this.yPos;

    // Prevent going off screen to the right
    if (finalX + menuWidth > window.innerWidth - 16) {
      finalX = window.innerWidth - menuWidth - 16;
    }
    if (finalX < 16) {
      finalX = 16;
    }
    
    // Prevent overlapping bottom player bar (~88px) or going off bottom screen
    const hasPlayer = !!this.playerService.currentTrack();
    const playerOffset = hasPlayer ? 104 : 20;
    const maxAllowedY = window.innerHeight - playerOffset;
    
    if (finalY + menuHeight > maxAllowedY) {
      // Flip upwards above the trigger element / click coordinate
      finalY = this.yPos - menuHeight - 12;
      // If flipping upwards goes too high or still doesn't fit, clamp to maxAllowed
      if (finalY < 16) {
        finalY = 16;
      }
      if (finalY + menuHeight > maxAllowedY) {
        finalY = Math.max(16, maxAllowedY - menuHeight);
      }
    }

    this.calculatedX = Math.round(finalX);
    this.calculatedY = Math.round(finalY);
  }

  close(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isFullScreen = false;
    this.transformY = 0;
    this.closeMenu.emit();
  }

  // Touch Event Handlers for Mobile Drag
  onTouchStart(event: TouchEvent) {
    if (!this.isMobile) return;
    this.isDragging = true;
    this.startY = event.touches[0].clientY;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || !this.isMobile) return;
    this.currentY = event.touches[0].clientY;
    const deltaY = this.currentY - this.startY;
    
    if (this.isFullScreen) {
      // If full screen, only allow dragging down
      if (deltaY > 0) {
        this.transformY = deltaY;
      }
    } else {
      // If normal, allow dragging up (negative) or down (positive)
      this.transformY = deltaY;
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isDragging || !this.isMobile) return;
    this.isDragging = false;
    
    if (this.isFullScreen) {
      // Dragged down from full screen
      if (this.transformY > 150) {
        this.isFullScreen = false; // Snap back to normal
      }
    } else {
      // Normal mode drag
      if (this.transformY < -100) {
        this.isFullScreen = true; // Dragged up to full screen
      } else if (this.transformY > 150) {
        this.close(); // Dragged down to close
        return;
      }
    }
    this.transformY = 0; // Reset transform
  }

  isLiked(): boolean {
    if (!this.track) return false;
    return this.algorithmService.isLiked(this.track.videoId);
  }

  playNext(event: Event) {
    event.stopPropagation();
    if (this.track) {
      this.playerService.addNext(this.track);
    }
    this.close();
  }

  toggleSleepTimer(event: Event) {
    event.stopPropagation();
    this.playerService.toggleSleepModal();
    this.close();
  }

  addToQueue(event: Event) {
    event.stopPropagation();
    if (this.track) {
      this.playerService.addToQueue(this.track);
    }
    this.close();
  }

  onRemoveFromPlaylist() {
    this.removeFromPlaylist.emit(this.track);
    this.close();
  }

  saveToPlaylist(event: Event) {
    event.stopPropagation();
    if (this.track) {
      this.openPlaylist.emit(this.track);
    }
    this.close();
  }

  toggleLike(event: Event) {
    event.stopPropagation();
    if (this.track) {
      const user = this.authService.currentUser();
      if (user && user.email) {
        this.userService.toggleLike(user.email, this.track, this.userService.preferredLanguages());
      }
      this.algorithmService.toggleLike(this.track);
    }
    this.close();
  }

  share(event: Event) {
    event.stopPropagation();
    if (this.track) {
      const url = `https://ganatube.in/share.php?v=${this.track.videoId}`;
      navigator.clipboard.writeText(url).then(() => {
        this.toastService.success('Link copied to clipboard!');
      });
    }
    this.close();
  }

  getArtists(): string[] {
    if (!this.track) return [];
    const raw = (this.track.artist && this.track.artist !== 'unknown' ? this.track.artist : this.track.channelTitle) || '';
    if (!raw) return [];

    // Split on delimiters: comma, &, feat., ft., featuring, /, •, +
    const parts = raw
      .split(/,|\s+&\s+|\s+feat\.?\s+|\s+ft\.?\s+|\s+featuring\s+|\s+\/\s+|\s+•\s+|\s+\+\s+/i)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(part);
      }
    }

    return unique.length > 0 ? unique : [raw.trim()];
  }

  getVisibleArtists(): string[] {
    const all = this.getArtists();
    if (this.isArtistsExpanded || all.length <= 4) {
      return all;
    }
    return all.slice(0, 4);
  }

  toggleArtistsExpanded(event: Event) {
    event.stopPropagation();
    this.isArtistsExpanded = !this.isArtistsExpanded;
  }

  goToArtist(artistName: string, event: Event) {
    event.stopPropagation();
    if (artistName) {
      this.router.navigate(['/artist', encodeURIComponent(artistName)]);
    }
    this.close();
  }

  getArtistImage(): string {
    return this.track?.channelThumbnail || 'ganatubenewlogo.png';
  }

  onImageError(event: any) {
    event.target.src = 'ganatubenewlogo.png';
  }

  isDownloadingState = false;

  async download(event: Event) {
    event.stopPropagation();
    if (this.track && !this.isDownloaded() && !this.isDownloadingState) {
      this.isDownloadingState = true;
      try {
        await this.offlineService.downloadTrack(this.track);
      } finally {
        this.isDownloadingState = false;
      }
    }
  }

  isDownloaded(): boolean {
    if (!this.track) return false;
    return !!this.offlineService.downloadedTracks()[this.track.videoId];
  }

  isDownloading(): boolean {
    return this.isDownloadingState;
  }

  startRadio(event: Event) {
    // Disabled
  }

  // Volume Control Methods
  volume(): number {
    return this.playerService.volume();
  }

  isMuted(): boolean {
    return this.playerService.isMuted();
  }

  toggleMute(event: Event): void {
    event.stopPropagation();
    this.playerService.toggleMute();
  }

  onVolumeChange(value: number): void {
    this.playerService.setVolume(value);
  }

  getSliderBackground(value: number): string {
    return `linear-gradient(to right, #fff ${value}%, #333 ${value}%)`;
  }
}
