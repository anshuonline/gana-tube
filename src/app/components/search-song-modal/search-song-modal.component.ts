import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { LucideSearch, LucideX, LucideRefreshCw, LucidePlus } from '@lucide/angular';

@Component({
  selector: 'app-search-song-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSearch, LucideX, LucideRefreshCw, LucidePlus],
  templateUrl: './search-song-modal.component.html',
  styleUrls: ['./search-song-modal.component.scss']
})
export class SearchSongModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() songSelected = new EventEmitter<YouTubeSearchResult>();

  searchQuery = '';
  searchResults: YouTubeSearchResult[] = [];
  isSearching = false;
  hasSearched = false;

  constructor(private youtubeApi: YoutubeApiService) {}

  performSearch() {
    if (!this.searchQuery.trim()) return;
    this.isSearching = true;
    this.hasSearched = true;
    this.searchResults = [];

    this.youtubeApi.searchMusic(this.searchQuery, 15).subscribe({
      next: (results) => {
        // Filter out same songs
        const unique = [];
        const titles = new Set();
        for (const r of results) {
          let norm = r.title.toLowerCase().replace(/[\(\[].*?[\)\]]/g, '').trim();
          if (!titles.has(norm)) {
            titles.add(norm);
            unique.push(r);
          }
        }
        this.searchResults = unique.slice(0, 10);
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Search error', err);
        this.isSearching = false;
      }
    });
  }

  selectSong(song: YouTubeSearchResult) {
    this.songSelected.emit(song);
  }

  closeModal() {
    this.close.emit();
  }
}
