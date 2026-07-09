import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideLibrary, LucideHeart, LucidePlay, 
  LucideListMusic, LucideMoreVertical 
} from '@lucide/angular';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideLibrary, LucideHeart, LucidePlay, 
    LucideListMusic, LucideMoreVertical
  ],
  templateUrl: './library-page.html',
  styleUrls: ['./library-page.scss']
})
export class LibraryPageComponent {
  @Output() onOpenLikedSongs = new EventEmitter<void>();
  @Output() onOpenRecentlyPlayed = new EventEmitter<void>();
  @Output() onOpenCustomPlaylist = new EventEmitter<any>();
  @Output() onTogglePlaylistMenu = new EventEmitter<{playlist: any, event: MouseEvent}>();
  @Output() onLogin = new EventEmitter<void>();

  constructor(
    public authService: AuthService,
    public userService: UserService
  ) {}

  randomLikedThumbnail(): string | null {
    const songs = this.userService.likedSongs();
    if (songs.length === 0) return null;
    return songs[0].thumbnailHigh || songs[0].thumbnail;
  }

  randomRecentThumbnail(): string | null {
    const plays = this.userService.recentPlays();
    if (plays.length === 0) return null;
    return plays[0].thumbnailHigh || plays[0].thumbnail;
  }

  login() {
    this.onLogin.emit();
  }

  openLikedSongs() {
    this.onOpenLikedSongs.emit();
  }

  openRecentlyPlayed() {
    this.onOpenRecentlyPlayed.emit();
  }

  openCustomPlaylist(pl: any) {
    this.onOpenCustomPlaylist.emit(pl);
  }

  togglePlaylistMenu(playlist: any, event: MouseEvent) {
    event.stopPropagation();
    this.onTogglePlaylistMenu.emit({playlist, event});
  }
}
