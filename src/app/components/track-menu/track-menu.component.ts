import { Component, Input, Output, EventEmitter, inject, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService, Track } from '../../services/player.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { AlgorithmService } from '../../services/algorithm.service';
import { Router } from '@angular/router';
import { 
  LucideListPlus,
  LucideListStart,
  LucideFolderPlus,
  LucideHeart,
  LucideShare2,
  LucideUser,
  LucideDownload,
  LucideRadio,
  LucideTrash2
} from '@lucide/angular';

@Component({
  selector: 'app-track-menu',
  standalone: true,
  imports: [
    CommonModule,
    LucideListPlus,
    LucideListStart,
    LucideFolderPlus,
    LucideHeart,
    LucideShare2,
    LucideUser,
    LucideDownload,
    LucideRadio,
    LucideTrash2
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] || changes['xPos'] || changes['yPos']) {
      this.calculatePosition();
    }
  }

  calculatePosition() {
    if (this.isMobile || !this.isOpen) return;
    
    // Assuming menu width is around 260px
    const menuWidth = 260;
    // Assuming menu height might be around 400px at most
    const menuHeight = 400;

    let finalX = this.xPos;
    let finalY = this.yPos;

    // Prevent going off screen to the right
    if (finalX + menuWidth > window.innerWidth) {
      finalX = window.innerWidth - menuWidth - 16;
    }
    
    // Prevent going off screen to the bottom (open upwards instead)
    if (finalY + menuHeight > window.innerHeight) {
      // open upwards (subtract button height roughly 24px and menu height)
      finalY = Math.max(16, this.yPos - menuHeight - 24);
    }

    this.calculatedX = finalX;
    this.calculatedY = finalY;
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

  addToQueue(event: Event) {
    event.stopPropagation();
    if (this.track) {
      this.playerService.addToQueue(this.track);
    }
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
      const url = `${window.location.origin}/?play=${this.track.videoId}`;
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
      });
    }
    this.close();
  }

  goToArtist(event: Event) {
    event.stopPropagation();
    if (this.track && this.track.channelTitle) {
      this.router.navigate(['/search'], { queryParams: { q: this.track.channelTitle } });
    }
    this.close();
  }

  getArtistImage(): string {
    return this.track?.channelThumbnail || 'ganatubenewlogo.png';
  }

  onImageError(event: any) {
    event.target.src = 'ganatubenewlogo.png';
  }

  download(event: Event) {
    event.stopPropagation();
    alert('Download feature coming soon!');
    this.close();
  }

  startRadio(event: Event) {
    event.stopPropagation();
    alert('Radio feature coming soon!');
    this.close();
  }
}
