import { Component, Input, OnInit, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';
import { UserService } from '../../services/user.service';
import { PlaylistMeta } from '../../data/playlists.data';
import { SponsoredAd } from '../../app';
import { LucidePlay, LucideArrowLeft, LucideShare2, LucideCheck, LucideHeart } from '@lucide/angular';

@Component({
  selector: 'app-playlist-page',
  standalone: true,
  imports: [CommonModule, LucidePlay, LucideArrowLeft, LucideShare2, LucideCheck, LucideHeart],
  templateUrl: './playlist-page.component.html',
  styleUrls: ['./playlist-page.component.scss']
})
export class PlaylistPageComponent implements OnInit {
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

  constructor() {}

  ngOnInit(): void {
    if (this.playlist) {
      this.loadSongs();
    }
    this.loadAd();
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
          
          if (this.playlist.id === 'liked-songs') {
            this.userService.likedSongs.set(updatedSongs);
          }
        });
      } else {
        this.songs.set(this.playlist.preloadedSongs);
        this.isLoading.set(false);
      }
      return;
    }
    
    this.isLoading.set(true);
    this.youtubeApi.getPlaylistSongs(this.playlist.searchQueries, this.playlist.id).subscribe((results) => {
      this.songs.set(results);
      this.isLoading.set(false);
    });
  }

  playSong(index: number): void {
    const currentSongs = this.songs();
    if (currentSongs && currentSongs.length > 0) {
      this.playerService.queue.set([...currentSongs]);
      this.playerService.currentIndex.set(index);
      this.playerService.playTrack(currentSongs[index]);
    }
  }

  playAll(): void {
    if (this.songs().length > 0) {
      this.playSong(0);
    }
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
}
