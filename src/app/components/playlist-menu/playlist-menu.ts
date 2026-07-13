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
  LucideTrash2,
  LucideGlobe,
  LucideLock,
  LucideShare2
} from '@lucide/angular';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { EditPlaylistModalComponent } from '../edit-playlist-modal/edit-playlist-modal';

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
    LucideListStart,
    LucideListPlus,
    LucideFolderPlus,
    LucideTrash2,
    LucideGlobe,
    LucideLock,
    LucideShare2,
    ConfirmModalComponent,
    EditPlaylistModalComponent
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
  showDeleteConfirm = false;
  showEditModal = false;

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
      this.showEditModal = true;
    } else {
      this.toastService.info("Cannot edit this playlist");
    }
  }

  async saveEditDetails(details: {name: string, isPublic: boolean}) {
    if (!this.playlist?.playlist_id) return;
    
    // Check if the name changed or visibility changed
    if (details.name !== this.playlist.name || details.isPublic !== this.playlist.is_public) {
      try {
        const url = this.userService['apiUrl'].replace('user-api.php', 'playlist-api.php');
        const user = this.authService.currentUser();
        const response: any = await fetch(`${url}?action=updatePlaylist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user?.email,
            playlist_id: this.playlist.playlist_id,
            playlist_name: details.name,
            is_public: details.isPublic ? 1 : 0
          })
        }).then(r => r.json());

        if (response.status === 'success') {
          // Update local state
          this.playlist.name = details.name;
          this.playlist.is_public = details.isPublic;
          
          // Update custom playlists array in user service
          const currentPlaylists = this.userService.customPlaylists();
          const pIndex = currentPlaylists.findIndex(p => p.playlist_id === this.playlist.playlist_id);
          if (pIndex >= 0) {
            currentPlaylists[pIndex].name = details.name;
            currentPlaylists[pIndex].is_public = details.isPublic;
            this.userService.customPlaylists.set([...currentPlaylists]);
          }
          this.toastService.success('Playlist updated successfully');
        } else {
          this.toastService.error('Failed to update playlist');
        }
      } catch (e) {
        console.error(e);
        this.toastService.error('Error updating playlist');
      }
    }
    this.showEditModal = false;
    this.close();
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
    alert('Select tracks individually to add them to other playlists.');
    this.close();
  }

  async toggleVisibility(event: Event) {
    event.stopPropagation();
    if (this.playlist?.playlist_id) {
      const email = this.authService.currentUser()?.email;
      if (email) {
        const newVisibility = !this.playlist.is_public;
        try {
          const url = this.userService['apiUrl'].replace('user-api.php', 'playlist-api.php');
          await fetch(`${url}?action=updatePlaylist`, {
            method: 'POST',
            body: JSON.stringify({ email, playlist_id: this.playlist.playlist_id, is_public: newVisibility ? 1 : 0 })
          });
          this.playlist.is_public = newVisibility;
          this.userService.loadPlaylists(email);
          this.toastService.success(`Playlist is now ${newVisibility ? 'Public' : 'Private'}`);
        } catch(e) {
          this.toastService.error("Failed to update visibility");
        }
      }
    }
  }

  sharePlaylist(event: Event) {
    event.stopPropagation();
    if (this.playlist?.playlist_id) {
      const url = `${window.location.origin}/${this.playlist.playlist_id}`;
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          this.toastService.success("Link copied to clipboard!");
        });
      }
    }
    this.close();
  }

  async deletePlaylist(event: Event) {
    event.stopPropagation();
    this.showDeleteConfirm = true;
  }

  async confirmDeleteAction() {
    this.showDeleteConfirm = false;
    if (this.playlist?.playlist_id) {
      const email = this.authService.currentUser()?.email;
      if (email) {
        try {
          if (this.playlist.is_saved) {
            const success = await this.userService.unsavePlaylist(email, this.playlist.playlist_id);
            if (success) {
              this.toastService.success("Playlist removed from library");
            } else {
              this.toastService.error("Failed to remove playlist");
            }
          } else {
            const url = this.userService['apiUrl'].replace('user-api.php', 'playlist-api.php');
            await fetch(`${url}?action=deletePlaylist`, {
              method: 'POST',
              body: JSON.stringify({ email, playlist_id: this.playlist.playlist_id })
            });
            this.userService.loadPlaylists(email);
            this.toastService.success("Playlist deleted successfully");
          }
        } catch(e) {
          this.toastService.error(this.playlist.is_saved ? "Failed to remove playlist" : "Failed to delete playlist");
        }
      }
    }
    this.close();
  }
}
