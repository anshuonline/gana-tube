import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';
import { UserService } from '../../services/user.service';
import { PlaylistMeta } from '../../data/playlists.data';
import { SponsoredAd } from '../../app';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LucidePlay, LucideArrowLeft, LucideShare2, LucideCheck, LucideHeart, LucideFolderPlus, LucideBarChart2, LucideTimer, LucideMoreVertical, LucideGripVertical } from '@lucide/angular';
import { TrackMenuComponent } from '../track-menu/track-menu.component';

import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'app-playlist-page',
  standalone: true,
  imports: [CommonModule, DragDropModule, TrackMenuComponent, LucidePlay, LucideArrowLeft, LucideShare2, LucideCheck, LucideHeart, LucideFolderPlus, LucideBarChart2, LucideTimer, LucideMoreVertical, LucideGripVertical],
  templateUrl: './playlist-page.component.html',
  styleUrls: ['./playlist-page.component.scss']
})
export class PlaylistPageComponent implements OnInit, OnChanges {
  @Input() playlist!: PlaylistMeta;
  @Output() back = new EventEmitter<void>();

  songs = signal<YouTubeSearchResult[]>([]);
  isLoading = signal<boolean>(true);
  isCopied = signal<boolean>(false);
  playlistAd = signal<SponsoredAd | null>(null);

  private sanitizer = inject(DomSanitizer);
  private youtubeApi = inject(YoutubeApiService);
  public playerService = inject(PlayerService);
  private userService = inject(UserService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private appState = inject(AppStateService);

  isMenuOpen = false;
  menuX = 0;
  menuY = 0;
  activeMenuTrack: any = null;

  openSaveModal(track: any) {
    this.appState.openSavePlaylist(track);
  }

  constructor() {}

  ngOnInit(): void {
    if (this.playlist) {
      this.loadSongs();
    }
    this.loadAd();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['playlist'] && !changes['playlist'].firstChange) {
      this.loadSongs();
    }
  }

  loadAd(): void {
    const host = window.location.hostname;
    const adApiUrl = host === 'localhost' 
      ? 'http://localhost/manageads/api.php' 
      : 'https://manageads.ganatube.in/api.php';

    fetch(`${adApiUrl}?placeholder=playlist_in_feed_banner`)
      .then(res => res.json())
      .then(data => {
        if (data && data.isActive) {
          this.playlistAd.set(data);
        }
      })
      .catch(err => console.error('Failed to load playlist ad', err));
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  loadSongs(): void {
    if (this.playlist.preloadedSongs && this.playlist.preloadedSongs.length > 0) {
      // Check if they are legacy dummy songs (Unknown Title)
      const hasDummies = this.playlist.preloadedSongs.some(s => s.title === 'Unknown Title');
      
      if (hasDummies) {
        this.isLoading.set(true);
        const dummyIds = this.playlist.preloadedSongs.filter(s => s.title === 'Unknown Title').map(s => s.videoId);
        
        this.youtubeApi.getVideoDetails(dummyIds).subscribe(details => {
          // Merge details with any non-dummy preloaded songs
          const updatedSongs = this.playlist.preloadedSongs!.map(s => {
            if (s.title === 'Unknown Title') {
              const detail = details.find(d => d.videoId === s.videoId);
              return detail || s; // fallback to dummy if not found
            }
            return s;
          });
          
          this.songs.set(updatedSongs);
          this.isLoading.set(false);
          this.fetchMissingDurations(updatedSongs);
          
          if (this.playlist.id === 'liked-songs') {
            this.userService.likedSongs.set(updatedSongs);
          }
        });
      } else {
        this.songs.set(this.playlist.preloadedSongs);
        this.isLoading.set(false);
        this.fetchMissingDurations(this.playlist.preloadedSongs);
      }
      return;
    }
    
    this.isLoading.set(true);
    this.youtubeApi.getPlaylistSongs(this.playlist.searchQueries, this.playlist.id).subscribe((results) => {
      this.songs.set(results);
      this.isLoading.set(false);
      this.fetchMissingDurations(results);
    });
  }

  fetchMissingDurations(currentList: YouTubeSearchResult[]): void {
    const missingIds = currentList.filter(s => s.duration === undefined).map(s => s.videoId);
    if (missingIds.length === 0) return;

    this.youtubeApi.getVideoDetails(missingIds).subscribe(details => {
      const updated = currentList.map(song => {
        if (song.duration === undefined) {
          const fetched = details.find(d => d.videoId === song.videoId);
          if (fetched && fetched.duration !== undefined) {
            return { ...song, duration: fetched.duration };
          }
        }
        return song;
      });
      this.songs.set(updated);
    });
  }

  getEstimatedDuration(): string {
    const totalSongs = this.songs().length;
    if (totalSongs === 0) return '0 min';
    
    let totalSeconds = 0;
    for (const song of this.songs()) {
      totalSeconds += song.duration || 210;
    }
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  }

  incrementPlayCount(): void {
    if (this.playlist.id === 'liked-songs' || this.playlist.id.startsWith('search-')) return;
    
    const host = window.location.hostname;
    const apiUrl = host === 'localhost' 
      ? 'http://localhost/manageads/playlist-api.php' 
      : 'https://manageads.ganatube.in/playlist-api.php';
      
    fetch(`${apiUrl}?action=incrementPlayCount`, {
      method: 'POST',
      body: JSON.stringify({ playlist_id: this.playlist.id })
    }).catch(e => console.error('Error incrementing play count', e));
  }

  playAll(): void {
    if (this.songs().length > 0) {
      this.playerService.isPlaylistContext.set(true);
      this.playerService.setQueue([...this.songs()]);
      this.incrementPlayCount();
    }
  }

  playSong(index: number): void {
    this.playerService.isPlaylistContext.set(true);
    this.playerService.setQueue([...this.songs()], index);
    this.incrementPlayCount();
  }

  goBack(): void {
    this.back.emit();
  }

  sharePlaylist(): void {
    const baseUrl = window.location.origin.includes('localhost') ? 'https://ganatube.in' : window.location.origin;
    const url = `${baseUrl}/playlist/${this.playlist.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.isCopied.set(true);
      setTimeout(() => {
        this.isCopied.set(false);
      }, 2000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
      prompt('Copy this link:', url);
    });
  }

  isSaved(): boolean {
    if (!this.playlist || this.playlist.is_owner === true) return false;
    const userPlaylists = this.userService.customPlaylists();
    return userPlaylists.some(p => p.playlist_id === this.playlist.id && p.is_saved);
  }

  async toggleSavePlaylist(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user || !user.email) {
      this.toastService.show('Please log in to save playlists', 'error');
      return;
    }
    
    if (this.playlist.is_owner === true) {
      return;
    }

    if (this.isSaved()) {
      const success = await this.userService.unsavePlaylist(user.email, this.playlist.id);
      if (success) {
        this.toastService.show('Playlist removed from your library', 'success');
      } else {
        this.toastService.show('Failed to remove playlist', 'error');
      }
    } else {
      const success = await this.userService.savePlaylist(user.email, this.playlist.id);
      if (success) {
        this.toastService.show('Playlist saved to your library', 'success');
      } else {
        this.toastService.show('Failed to save playlist', 'error');
      }
    }
  }
  openTrackMenu(track: YouTubeSearchResult, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuTrack = track;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.isMenuOpen = true;
  }

  closeTrackMenu(): void {
    this.isMenuOpen = false;
    this.activeMenuTrack = null;
  }

  onDrop(event: CdkDragDrop<YouTubeSearchResult[]>): void {
    const currentSongs = [...this.songs()];
    moveItemInArray(currentSongs, event.previousIndex, event.currentIndex);
    this.songs.set(currentSongs);
    
    // Save to DB if it's user's custom playlist
    if (this.playlist.is_owner && this.playlist.id !== 'liked-songs' && !this.playlist.id.startsWith('search-')) {
      this.syncPlaylistToDB(currentSongs);
    } else if (this.playlist.id === 'liked-songs') {
      this.userService.likedSongs.set(currentSongs);
    }
  }

  removeFromPlaylist(track: YouTubeSearchResult): void {
    const currentSongs = this.songs().filter(s => s.videoId !== track.videoId);
    this.songs.set(currentSongs);
    this.closeTrackMenu();
    this.toastService.show(`Removed ${track.title} from playlist`, 'success');
    
    if (this.playlist.is_owner && this.playlist.id !== 'liked-songs' && !this.playlist.id.startsWith('search-')) {
      this.syncPlaylistToDB(currentSongs);
    } else if (this.playlist.id === 'liked-songs') {
      this.userService.likedSongs.set(currentSongs);
    }
  }

  private syncPlaylistToDB(songs: YouTubeSearchResult[]): void {
    const host = window.location.hostname;
    const apiUrl = host === 'localhost' 
      ? 'http://localhost/manageads/playlist-api.php' 
      : 'https://manageads.ganatube.in/playlist-api.php';
    const email = this.authService.currentUser()?.email;
    if (!email) return;

    fetch(`${apiUrl}?action=updatePlaylist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: email,
        playlist_id: this.playlist.id,
        songs: songs
      })
    }).catch(e => console.error('Error syncing playlist', e));
  }
}
