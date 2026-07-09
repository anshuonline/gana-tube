import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucidePlay, LucidePlus, LucideMoreVertical, LucideMusic2 } from '@lucide/angular';
import { YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, LucidePlay, LucidePlus, LucideMoreVertical, LucideMusic2],
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

  skeletons = Array(10).fill(0);

  topResult: YouTubeSearchResult | null = null;
  otherResults: YouTubeSearchResult[] = [];

  constructor(private playerService: PlayerService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['results'] || changes['currentFilter']) {
      this.processResults();
    }
  }

  processResults() {
    if (!this.results || this.results.length === 0) {
      this.topResult = null;
      this.otherResults = [];
      this.ambientBgFound.emit('');
      return;
    }

    if (this.currentFilter === 'all') {
      // In 'all' view, the first result is the "Featured/Top Result"
      this.topResult = this.results[0];
      this.otherResults = this.results.slice(1);
      
      // Emit the top result's thumbnail to be used as ambient background
      if (this.topResult) {
        this.ambientBgFound.emit(this.topResult.thumbnailHigh || this.topResult.thumbnail);
      }
    } else {
      // In other views (Songs, Playlists), show everything as a list
      this.topResult = null;
      this.otherResults = [...this.results];
      this.ambientBgFound.emit('');
    }
  }

  onPlay(track: YouTubeSearchResult): void {
    this.playTrack.emit(track);
  }

  isCurrentTrack(track: YouTubeSearchResult): boolean {
    return this.playerService.currentTrack()?.videoId === track.videoId;
  }

  onToggleMenu(track: YouTubeSearchResult, event: MouseEvent): void {
    event.stopPropagation();
    this.toggleMenu.emit({track, event});
  }

  onImgError(event: Event, track: YouTubeSearchResult): void {
    const img = event.target as HTMLImageElement;
    img.src = `https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`;
  }
}
