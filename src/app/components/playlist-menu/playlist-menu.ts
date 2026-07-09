import { Component, Input, Output, EventEmitter, inject, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerService, Track } from '../../services/player.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { 
  LucideShuffle,
  LucideEdit,
  LucideListStart,
  LucideListPlus,
  LucideFolderPlus,
  LucideTrash2
} from '@lucide/angular';

@Component({
  selector: 'app-playlist-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideShuffle,
    LucideEdit,
    LucideListStart,
    LucideListPlus,
    LucideFolderPlus,
    LucideTrash2
  ],
  templateUrl: './playlist-menu.html',
  styleUrls: ['./playlist-menu.scss']
})
export class PlaylistMenuComponent implements OnChanges {
  @Input() playlist: any;
  @Input() isOpen = false;
  
  @Input() xPos = 0;
  @Input() yPos = 0;
  
  calculatedX = 0;
  calculatedY = 0;
  
  @Output() closeMenu = new EventEmitter<void>();

  public playerService = inject(PlayerService);
  public userService = inject(UserService);
  public authService = inject(AuthService);
  public toastService = inject(ToastService);

  isMobile = false;
  isEditing = false;
  editName = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkScreenSize();
    }
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    this.calculatePosition();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] || changes['xPos'] || changes['yPos']) {
      this.calculatePosition();
    }
  }

  calculatePosition() {
    if (this.isMobile || !this.isOpen) return;
    
    const menuWidth = 260;
    const menuHeight = 350;

    let finalX = this.xPos;
    let finalY = this.yPos;

    if (finalX + menuWidth > window.innerWidth) {
      finalX = window.innerWidth - menuWidth - 16;
    }
    
    if (finalY + menuHeight > window.innerHeight) {
      finalY = Math.max(16, this.yPos - menuHeight - 24);
    }

    this.calculatedX = finalX;
    this.calculatedY = finalY;
  }

  close(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.closeMenu.emit();
  }

  async shufflePlay(event: Event) {
    event.stopPropagation();
    if (this.playlist && this.playlist.tracks && this.playlist.tracks.length > 0) {
      this.playerService.setQueue([...this.playlist.tracks], 0);
      this.playerService.toggleShuffle();
    }
    this.close();
  }

  editPlaylist(event: Event) {
    event.stopPropagation();
    if (this.playlist?.playlist_id) {
      this.isEditing = true;
      this.editName = this.playlist.name;
    } else {
      this.toastService.info("Cannot edit this playlist");
    }
  }

  async saveEdit(event: Event) {
    event.stopPropagation();
    const newName = this.editName.trim();
    if (newName && newName !== this.playlist.name) {
      const email = this.authService.currentUser()?.email;
      if (email && this.playlist.playlist_id) {
        // Assume updatePlaylist is added in UserService later, for now just show toast
        this.toastService.info("Playlist rename will be available soon!");
      }
    }
    this.isEditing = false;
    this.close();
  }

  cancelEdit(event: Event) {
    event.stopPropagation();
    this.isEditing = false;
  }

  playNext(event: Event) {
    event.stopPropagation();
    if (this.playlist && this.playlist.tracks) {
      // Add in reverse order so they play in correct order next
      const tracks = [...this.playlist.tracks].reverse();
      tracks.forEach((track: any) => {
        this.playerService.addNext(track);
      });
    }
    this.close();
  }

  addToQueue(event: Event) {
    event.stopPropagation();
    if (this.playlist && this.playlist.tracks) {
      this.playlist.tracks.forEach((track: any) => {
        this.playerService.addToQueue(track);
      });
    }
    this.close();
  }

  saveToPlaylist(event: Event) {
    event.stopPropagation();
    // Complex to add all tracks to another playlist, leaving as alert for now
    alert('Select tracks individually to add them to other playlists.');
    this.close();
  }

  async deletePlaylist(event: Event) {
    event.stopPropagation();
    const confirmDelete = confirm('Are you sure you want to delete this playlist?');
    if (confirmDelete && this.playlist?.playlist_id) {
      const email = this.authService.currentUser()?.email;
      if (email) {
        try {
          const url = this.userService['apiUrl'].replace('user-api.php', 'playlist-api.php');
          await fetch(`${url}?action=deletePlaylist`, {
            method: 'POST',
            body: JSON.stringify({ email, playlist_id: this.playlist.playlist_id })
          });
          this.userService.loadPlaylists(email);
        } catch(e) {}
      }
    }
    this.close();
  }
}
