import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucidePlay, LucideMoreVertical, LucideMusic2, LucideAudioLines, LucideDisc3, LucideLibrary } from '@lucide/angular';
import { YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, LucidePlay, LucideMoreVertical, LucideMusic2, LucideAudioLines, LucideDisc3, LucideLibrary],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnChanges {
  @Input() results: YouTubeSearchResult[] = [];
  @Input() isLoading = false;
  @Input() hasSearched = false;
  @Input() currentFilter: 'all' | 'songs' | 'albums' | 'playlists' = 'all';

  @Output() suggestSearch = new EventEmitter<string>();
  @Output() playTrack = new EventEmitter<YouTubeSearchResult>();
  @Output() ambientBgFound = new EventEmitter<string>();
  @Output() toggleMenu = new EventEmitter<{track: YouTubeSearchResult, event: MouseEvent}>();

  skeletons = Array(8).fill(0);

  topResult: YouTubeSearchResult | null = null;
  songResults: YouTubeSearchResult[] = [];
  albumResults: YouTubeSearchResult[] = [];
  playlistResults: YouTubeSearchResult[] = [];

  constructor(private playerService: PlayerService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['results'] || changes['currentFilter']) {
      this.processResults();
    }
  }

  processResults() {
    const results = this.results || [];
    if (results.length === 0) {
      this.topResult = null;
      this.songResults = [];
      this.albumResults = [];
      this.playlistResults = [];
      this.ambientBgFound.emit('');
      return;
    }

    this.albumResults = results.filter(r => r.type === 'album');
    this.playlistResults = results.filter(r => r.type === 'playlist' || r.type === 'community-playlist');
    this.songResults = results.filter(r => r.type !== 'album' && r.type !== 'playlist' && r.type !== 'community-playlist');

    if (this.currentFilter === 'all') {
      // Top result: best playlist match, otherwise first song
      this.topResult = this.playlistResults[0] || this.songResults[0] || null;

      if (this.topResult) {
        // Remove the top result from its section so it isn't shown twice
        if (this.topResult.type === 'playlist' || this.topResult.type === 'community-playlist') {
          this.playlistResults = this.playlistResults.slice(1);
        } else {
          this.songResults = this.songResults.slice(1);
        }
        this.ambientBgFound.emit(this.topResult.thumbnailHigh || this.topResult.thumbnail);
      }
    } else {
      this.topResult = null;
      // Keep the ambient background alive from the first item of the active view
      const first = this.currentFilter === 'albums'
        ? this.albumResults[0]
        : this.currentFilter === 'playlists'
          ? this.playlistResults[0]
          : this.songResults[0];
      this.ambientBgFound.emit(first ? (first.thumbnailHigh || first.thumbnail) : '');
    }
  }

  formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getSectionLabel(type: string): string {
    return type === 'community-playlist' ? 'Community Playlist' : type === 'album' ? 'Album' : type === 'playlist' ? 'Playlist' : 'Song';
  }

  onPlay(track: YouTubeSearchResult): void {
    this.playTrack.emit(track);
  }

  isCurrentTrack(track: YouTubeSearchResult): boolean {
    return this.playerService.currentTrack()?.videoId === track.videoId;
  }

  onRightClick(event: MouseEvent, track: YouTubeSearchResult): void {
    event.preventDefault(); // Prevent standard browser context menu
    event.stopPropagation();
    this.toggleMenu.emit({track, event});
  }

  onImgError(event: Event, track: YouTubeSearchResult): void {
    const img = event.target as HTMLImageElement;
    if (track.videoId && track.videoId.length === 11) {
      img.src = `https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`;
    }
    img.style.visibility = 'hidden';
  }
}
