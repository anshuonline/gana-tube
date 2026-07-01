import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideDisc3, LucidePlay } from '@lucide/angular';

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
    LucidePlay,
    SearchBarComponent,
    SearchResultsComponent,
    MusicPlayerComponent,
    YtPlayerComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit {
  @ViewChild(SearchBarComponent) searchBar!: SearchBarComponent;

  results = signal<YouTubeSearchResult[]>([]);
  isLoading = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  apiKeyMissing = false;

  debugLogs: string[] = [];

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

  getShelvesStateInfo(): string {
    return `hasSearched: ${this.hasSearched()}, isLoading: ${this.isLoading()}, shelvesLoading: ${this.shelvesLoading()}, trendingCount: ${this.trendingIndia().length}, bollywoodCount: ${this.bollywoodHits().length}, lofiCount: ${this.lofiRelax().length}`;
  }

  logDebug(msg: string): void {
    console.log(msg);
    this.debugLogs.push(`${new Date().toLocaleTimeString()} - ${msg}`);
  }

  logError(msg: string, err: any): void {
    console.error(msg, err);
    const errMsg = err?.message || err?.statusText || JSON.stringify(err);
    this.debugLogs.push(`${new Date().toLocaleTimeString()} - ❌ ERROR: ${msg} (${errMsg})`);
  }

  ngOnInit(): void {
    this.logDebug('App initialized. Checking API key...');
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
    this.logDebug('Initializing GanaTube recommendation shelves...');

    let loadedCount = 0;
    const checkDone = () => {
      loadedCount++;
      if (loadedCount >= 3) {
        this.shelvesLoading.set(false);
        this.logDebug('All recommendation shelves loading lifecycle complete.');
        this.logDebug(`Current state: ${this.getShelvesStateInfo()}`);
      }
    };

    this.youtubeApi.searchMusic('Trending in India', 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.logDebug(`Trending India Shelf loaded. Count: ${res.length}`);
          this.trendingIndia.set(res);
          checkDone();
        },
        error: (err) => {
          this.logError('Failed to load Trending India shelf', err);
          checkDone();
        }
      });

    this.youtubeApi.searchMusic('Bollywood Hits 2026', 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.logDebug(`Bollywood Hits Shelf loaded. Count: ${res.length}`);
          this.bollywoodHits.set(res);
          checkDone();
        },
        error: (err) => {
          this.logError('Failed to load Bollywood Hits shelf', err);
          checkDone();
        }
      });

    this.youtubeApi.searchMusic('lo fi chill beats', 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.logDebug(`Chill & Lo-Fi Shelf loaded. Count: ${res.length}`);
          this.lofiRelax.set(res);
          checkDone();
        },
        error: (err) => {
          this.logError('Failed to load Lo-Fi shelf', err);
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
