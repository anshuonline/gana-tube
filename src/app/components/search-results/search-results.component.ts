import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucidePlay, LucidePlus, LucideMusic2 } from '@lucide/angular';
import { YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, LucidePlay, LucidePlus, LucideMusic2],
  template: `
    <!-- Loading State -->
    <div class="loading-grid" *ngIf="isLoading">
      <div class="skeleton-card" *ngFor="let s of skeletons"></div>
    </div>

    <!-- Empty State -->
    <div class="empty-state" *ngIf="!isLoading && results.length === 0 && hasSearched">
      <svg lucideMusic2 class="empty-icon" [attr.size]="64"></svg>
      <h3>No songs found</h3>
      <p>Try a different search term</p>
    </div>

    <!-- Welcome State -->
    <div class="welcome-state" *ngIf="!isLoading && !hasSearched">
      <div class="welcome-glow"></div>
      <div class="welcome-content">
        <svg lucideMusic2 class="welcome-icon pulse-animation" [attr.size]="72"></svg>
        <h2>Discover Your Music</h2>
        <p>Search for any song, artist, or album above to start listening</p>
        <div class="genre-chips">
          <button class="chip" (click)="suggestSearch.emit('Bollywood hits 2024')">Bollywood Hits</button>
          <button class="chip" (click)="suggestSearch.emit('lo fi beats')">Lo-Fi Beats</button>
          <button class="chip" (click)="suggestSearch.emit('top pop songs 2024')">Pop Charts</button>
          <button class="chip" (click)="suggestSearch.emit('hip hop 2024')">Hip Hop</button>
          <button class="chip" (click)="suggestSearch.emit('classical relaxing music')">Classical</button>
          <button class="chip" (click)="suggestSearch.emit('EDM dance 2024')">EDM</button>
        </div>
      </div>
    </div>

    <!-- Results Grid -->
    <div class="results-grid" *ngIf="!isLoading && results.length > 0">
      <div
        class="song-card"
        *ngFor="let track of results; let i = index"
        [class.active]="isCurrentTrack(track)"
        (click)="onPlay(track)"
      >
        <div class="card-thumbnail">
          <img
            [src]="track.thumbnailHigh || track.thumbnail"
            [alt]="track.title"
            loading="lazy"
            (error)="onImgError($event, track)"
          />
          <div class="thumbnail-overlay">
            <div class="play-ripple" *ngIf="isCurrentTrack(track)">
              <div class="bar"></div>
              <div class="bar"></div>
              <div class="bar"></div>
              <div class="bar"></div>
            </div>
            <button class="play-btn-overlay" *ngIf="!isCurrentTrack(track)">
              <svg lucidePlay [attr.size]="28"></svg>
            </button>
          </div>
          <div class="track-number">{{ i + 1 }}</div>
        </div>
        <div class="card-info">
          <h4 class="track-title" [title]="track.title">{{ track.title }}</h4>
          <p class="track-channel">{{ track.channelTitle }}</p>
        </div>
        <button
          class="add-queue-btn"
          (click)="addToQueue($event, track)"
          title="Add to queue"
        >
          <svg lucidePlus [attr.size]="16"></svg>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./search-results.component.scss'],
})
export class SearchResultsComponent {
  @Input() results: YouTubeSearchResult[] = [];
  @Input() isLoading = false;
  @Input() hasSearched = false;
  @Output() suggestSearch = new EventEmitter<string>();
  @Output() playTrack = new EventEmitter<YouTubeSearchResult>();

  skeletons = Array(12).fill(0);

  constructor(private playerService: PlayerService) {}

  onPlay(track: YouTubeSearchResult): void {
    this.playTrack.emit(track);
  }

  addToQueue(event: Event, track: YouTubeSearchResult): void {
    event.stopPropagation();
    this.playerService.queue.update(q => [...q, track as any]);
  }

  isCurrentTrack(track: YouTubeSearchResult): boolean {
    return this.playerService.currentTrack()?.videoId === track.videoId;
  }

  onImgError(event: Event, track: YouTubeSearchResult): void {
    const img = event.target as HTMLImageElement;
    img.src = `https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`;
  }
}
