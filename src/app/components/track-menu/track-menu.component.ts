import { Component, Input, Output, EventEmitter, inject, HostListener } from '@angular/core';
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
  LucideDisc,
  LucideDownload,
  LucideRadio
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
    LucideDisc,
    LucideDownload,
    LucideRadio
  ],
  templateUrl: './track-menu.component.html',
  styleUrls: ['./track-menu.component.scss']
})
export class TrackMenuComponent {
  @Input() track: any;
  @Input() isOpen = false;
  
  @Output() closeMenu = new EventEmitter<void>();
  @Output() openPlaylist = new EventEmitter<any>();

  public playerService = inject(PlayerService);
  public authService = inject(AuthService);
  public userService = inject(UserService);
  public algorithmService = inject(AlgorithmService);
  private router = inject(Router);

  isMobile = false;

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  close(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.closeMenu.emit();
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

  goToAlbum(event: Event) {
    event.stopPropagation();
    if (this.track) {
      this.router.navigate(['/search'], { queryParams: { q: `${this.track.title} ${this.track.channelTitle}` } });
    }
    this.close();
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
