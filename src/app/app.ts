import { Component, OnInit, ViewChild, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideDisc3 } from '@lucide/angular';

import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { MusicPlayerComponent } from './components/music-player/music-player.component';
import { YtPlayerComponent } from './components/yt-player/yt-player.component';
import { YoutubeApiService, YouTubeSearchResult } from './services/youtube-api.service';
import { PlayerService } from './services/player.service';
import { environment } from '../environments/environment';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LucideDisc3,
    SearchBarComponent,
    SearchResultsComponent,
    MusicPlayerComponent,
    YtPlayerComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnInit {
  @ViewChild(SearchBarComponent) searchBar!: SearchBarComponent;

  results = signal<YouTubeSearchResult[]>([]);
  isLoading = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  apiKeyMissing = false;

  // Recommendation Shelves using Signals to trigger zoneless CD instantly
  trendingIndia = signal<YouTubeSearchResult[]>([]);
  bollywoodHits = signal<YouTubeSearchResult[]>([]);
  lofiRelax = signal<YouTubeSearchResult[]>([]);
  shelvesLoading = signal<boolean>(false);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private youtubeApi: YoutubeApiService,
    public playerService: PlayerService
  ) {}

  resetSearchState(event: Event): void {
    event.preventDefault();
    this.results.set([]);
    this.hasSearched.set(false);
    this.isLoading.set(false);
    if (this.searchBar) {
      this.searchBar.clearQuery();
    }
  }

  ngOnInit(): void {
    this.apiKeyMissing =
      !environment.youtubeApiKey ||
      environment.youtubeApiKey === 'YOUR_YOUTUBE_API_KEY_HERE';

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        if (!query) {
          this.results.set([]);
          this.hasSearched.set(false);
          return;
        }
        this.performSearch(query);
      });

    this.loadRecommendationShelves();
  }

  loadRecommendationShelves(): void {
    this.shelvesLoading.set(true);

    let loadedCount = 0;
    const checkDone = () => {
      loadedCount++;
      if (loadedCount >= 3) {
        this.shelvesLoading.set(false);
      }
    };

    this.youtubeApi.searchMusic('Trending in India', 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.trendingIndia.set(res);
          checkDone();
        },
        error: (err) => {
          console.error('Failed to load Trending India shelf:', err);
          checkDone();
        }
      });

    this.youtubeApi.searchMusic('Bollywood Hits 2026', 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.bollywoodHits.set(res);
          checkDone();
        },
        error: (err) => {
          console.error('Failed to load Bollywood Hits shelf:', err);
          checkDone();
        }
      });

    this.youtubeApi.searchMusic('lo fi chill beats', 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.lofiRelax.set(res);
          checkDone();
        },
        error: (err) => {
          console.error('Failed to load Lo-Fi shelf:', err);
          checkDone();
        }
      });
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  onSuggestSearch(query: string): void {
    this.performSearch(query);
  }

  onPlayTrack(track: YouTubeSearchResult, list: YouTubeSearchResult[]): void {
    this.playerService.setQueue(list as any, list.indexOf(track));
  }

  performSearch(query: string): void {
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.youtubeApi.searchMusic(query).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.results.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.isLoading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
