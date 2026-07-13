import { Component, Input, Output, EventEmitter, inject, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideHeart, LucideListMusic, LucideCheck, LucidePlus, LucideX, LucideTrash2 } from '@lucide/angular';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-save-playlist-modal',
  standalone: true,
  imports: [CommonModule, LucideHeart, LucideListMusic, LucideCheck, LucidePlus, LucideX, LucideTrash2, ConfirmModalComponent],
  templateUrl: './save-playlist-modal.html',
  styleUrls: ['./save-playlist-modal.scss']
})
export class SavePlaylistModalComponent implements OnInit, OnDestroy {
  @Input() track: any;
  @Input() isOpen = false;
  @Output() closeMenu = new EventEmitter<void>();

  userService = inject(UserService);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  newPlaylistName = signal<string>('');
  newPlaylistIsPublic = signal<boolean>(true);
  isMobile = false;
  isCreating = signal<boolean>(false);
  
  showDeleteConfirm = false;
  playlistToDelete: any = null;

  private resizeListener = () => {
    this.isMobile = window.innerWidth <= 768;
  };

  ngOnInit() {
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
  }

  close(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.closeMenu.emit();
  }

  isLiked(): boolean {
    return this.userService.likedSongs().some(t => t.videoId === this.track?.videoId);
  }

  isInPlaylist(playlist: any): boolean {
    if (!playlist.tracks || !this.track) return false;
    return playlist.tracks.some((t: any) => t.videoId === this.track.videoId);
  }

  getOwnedPlaylists(): any[] {
    return this.userService.customPlaylists().filter(p => !p.is_saved);
  }

  async toggleLikeTrack() {
    const user = this.authService.currentUser();
    if (user && user.email && this.track) {
      await this.userService.toggleLike(user.email, this.track, this.userService.preferredLanguages());
    }
  }

  async toggleInCustomPlaylist(playlist: any) {
    const user = this.authService.currentUser();
    if (user && user.email && this.track) {
      const playlistId = playlist.playlist_id || playlist.name;
      await this.userService.addToPlaylist(user.email, playlistId, this.track);
    }
  }

  async createAndAddToPlaylist() {
    const name = this.newPlaylistName().trim();
    if (!name) return;
    if (!this.track) return;
    const user = this.authService.currentUser();
    if (!user || !user.email) {
      this.toastService.error("Please log in to create playlists.");
      return;
    }
    
    this.isCreating.set(true);
    try {
      const created = await this.userService.createPlaylist(user.email as string, name, this.newPlaylistIsPublic());
      if (created) {
        await this.userService.addToPlaylist(user.email as string, name, this.track);
        this.newPlaylistName.set('');
        this.newPlaylistIsPublic.set(false);
        this.toastService.success(`Playlist "${name}" created successfully`);
      } else {
        this.toastService.error("Failed to create playlist.");
      }
    } catch (e) {
      console.error(e);
      this.toastService.error("An error occurred while creating the playlist.");
    } finally {
      this.isCreating.set(false);
    }
  }

  deletePlaylistInit(playlist: any, event: Event) {
    event.stopPropagation();
    this.playlistToDelete = playlist;
    this.showDeleteConfirm = true;
  }

  async confirmDelete() {
    if (this.playlistToDelete) {
      const playlistId = this.playlistToDelete.playlist_id;
      const user = this.authService.currentUser();
      if (user?.email && playlistId) {
        try {
          const success = await this.userService.deletePlaylist(user.email, playlistId);
          if (success) {
            this.toastService.success(`Playlist deleted successfully`);
          } else {
            this.toastService.error("Failed to delete playlist");
          }
        } catch(e) {
          this.toastService.error("An error occurred");
        }
      }
    }
    this.showDeleteConfirm = false;
    this.playlistToDelete = null;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.playlistToDelete = null;
  }
}
