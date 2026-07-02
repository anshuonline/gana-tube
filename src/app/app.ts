import { Component, OnInit, ViewChild, signal, ViewEncapsulation, HostListener } from '@angular/core';
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

  currentQuery = '';
  lazyLoadPage = 0;
  isLazyLoading = signal<boolean>(false);

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

    this.youtubeApi.searchMusic('New Hindi Songs 2026', 12)
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

    this.youtubeApi.searchMusic('New Bollywood Releases 2026', 12)
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

    this.youtubeApi.searchMusic('Latest Punjabi Hits 2026', 12)
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

  scrollShelf(element: HTMLElement, distance: number): void {
    element.scrollBy({ left: distance, behavior: 'smooth' });
  }

  onImgError(event: Event, track: YouTubeSearchResult): void {
    const img = event.target as HTMLImageElement;
    img.src = `https://img.youtube.com/vi/${track.videoId}/hqdefault.jpg`;
  }

  onPlaySearchTrack(track: YouTubeSearchResult): void {
    // 1. Play track immediately and clear searched query duplicates from queue
    this.playerService.setQueue([track as any], 0);

    // 2. Automatically query other popular songs by this artist to build autoplay queue
    const artist = track.channelTitle || '';
    if (artist && artist !== 'Unknown Artist') {
      this.youtubeApi.searchMusic(`${artist} hits`, 12).subscribe({
        next: (relatedTracks) => {
          const currentQueue = this.playerService.queue();
          const existingIds = new Set(currentQueue.map(t => t.videoId));
          const uniqueRelated = relatedTracks.filter(t => !existingIds.has(t.videoId));

          // Append related popular hits to player queue
          this.playerService.queue.set([...currentQueue, ...uniqueRelated]);
        },
        error: (err) => {
          console.warn('Failed to load related autoplay tracks:', err);
        }
      });
    }
  }

  performSearch(query: string): void {
    this.currentQuery = query;
    this.lazyLoadPage = 0;
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

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.hasSearched() && !this.isLoading() && !this.isLazyLoading()) {
      const pos = (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight;
      const max = document.documentElement.scrollHeight;
      // If we are within 250px of the bottom of the page
      if (pos >= max - 250) {
        this.loadMoreResults();
      }
    }
  }

  loadMoreResults(): void {
    if (!this.currentQuery || this.lazyLoadPage >= 3) {
      return;
    }

    this.isLazyLoading.set(true);
    this.lazyLoadPage++;

    // Generate query variations for paginated mock feel
    let queryVariation = this.currentQuery;
    if (this.lazyLoadPage === 1) {
      queryVariation = `${this.currentQuery} music`;
    } else if (this.lazyLoadPage === 2) {
      queryVariation = `${this.currentQuery} song`;
    } else if (this.lazyLoadPage === 3) {
      queryVariation = `${this.currentQuery} audio`;
    }

    this.youtubeApi.searchMusic(queryVariation).pipe(takeUntil(this.destroy$)).subscribe({
      next: (newItems) => {
        const currentItems = this.results();
        const existingIds = new Set(currentItems.map(item => item.videoId));
        const uniqueNewItems = newItems.filter(item => !existingIds.has(item.videoId));

        this.results.set([...currentItems, ...uniqueNewItems]);
        this.isLazyLoading.set(false);
      },
      error: () => {
        this.isLazyLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
