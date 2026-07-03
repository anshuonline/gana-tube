import { Component, Input, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';
import { PlaylistMeta } from '../../data/playlists.data';
import { LucidePlay, LucideArrowLeft, LucideShare2, LucideCheck } from '@lucide/angular';

@Component({
  selector: 'app-playlist-page',
  standalone: true,
  imports: [CommonModule, LucidePlay, LucideArrowLeft, LucideShare2, LucideCheck],
  templateUrl: './playlist-page.component.html',
  styleUrls: ['./playlist-page.component.scss']
})
export class PlaylistPageComponent implements OnInit {
  @Input() playlist!: PlaylistMeta;
  @Output() back = new EventEmitter<void>();

  songs = signal<YouTubeSearchResult[]>([]);
  isLoading = signal<boolean>(true);
  isCopied = signal<boolean>(false);

  constructor(
    private youtubeApi: YoutubeApiService,
    public playerService: PlayerService
  ) {}

  ngOnInit(): void {
    if (this.playlist) {
      this.loadSongs();
    }
  }

  loadSongs(): void {
    this.isLoading.set(true);
    this.youtubeApi.getPlaylistSongs(this.playlist.searchQueries).subscribe((results) => {
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
