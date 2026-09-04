import { Component, EventEmitter, Output, ElementRef, ViewChild, ChangeDetectorRef, NgZone, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { LucidePlay, LucideSparkles, LucideCompass, LucideMic2, LucideGlobe, LucideSearch, LucideMessageSquare, LucideMusic, LucideChevronRight, LucideChevronLeft, LucideMinus, LucideMessageCircle } from '@lucide/angular';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-discovery-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucidePlay, LucideSparkles, LucideCompass, LucideMic2, LucideGlobe, LucideSearch, LucideMessageSquare, LucideMusic, LucideChevronRight, LucideChevronLeft, LucideMinus, LucideMessageCircle],
  templateUrl: './discovery-page.component.html',
  styleUrls: ['./discovery-page.component.scss']
})
export class DiscoveryPageComponent implements OnInit, OnDestroy {
  @Output() playTrack = new EventEmitter<YouTubeSearchResult>();
  @Output() toggleMenu = new EventEmitter<{track: YouTubeSearchResult, event: MouseEvent}>();
  
  askQuery: string = '';
  isSearching: boolean = false;
  loadingMessage: string = '';
  errorMessage: string = '';
  isAuraMinimized: boolean = false;
  
  // Hero items (could be hardcoded or dynamically fetched)
  heroItems = [
    { title: 'Top Hits 2026', subtitle: 'The most played songs this week', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200&h=400' },
    { title: 'Chill Lo-Fi', subtitle: 'Relax and unwind with smooth beats', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200&h=400' },
    { title: 'Workout Energy', subtitle: 'Push your limits with high BPM', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200&h=400' }
  ];
  currentHeroIndex = 0;

  // Feed results
  private allResults: YouTubeSearchResult[] = [];
  results: YouTubeSearchResult[] = [];
  
  private initialBatch = 10;
  private scrollBatch = 6;
  private scrollHandler: (() => void) | null = null;
  private isLoadingMore = false;
  loadingMore = false;

  constructor(
    private youtubeApi: YoutubeApiService,
    private playerService: PlayerService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.discover('Trending music hits'); // Default initial load
  }

  ngOnDestroy() {
    this.removeScrollListener();
  }

  nextHero() {
    this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroItems.length;
  }

  prevHero() {
    this.currentHeroIndex = (this.currentHeroIndex - 1 + this.heroItems.length) % this.heroItems.length;
  }

  async askAI() {
    const query = this.askQuery.trim();
    if (!query) return;
    await this.discover(query);
    // On mobile we might want to clear or unfocus
  }

  toggleAura() {
    this.isAuraMinimized = !this.isAuraMinimized;
  }

  async discover(intent: string) {
    this.isSearching = true;
    this.results = [];
    this.allResults = [];
    this.errorMessage = '';
    this.loadingMessage = 'Curating based on your taste...';
    this.cdr.detectChanges();
    
    // Animate loading text
    const loadingInterval = setInterval(() => {
      const msgs = ['Analyzing vibe...', 'Finding best matches...', 'Tuning frequencies...'];
      this.loadingMessage = msgs[Math.floor(Math.random() * msgs.length)];
      this.cdr.detectChanges();
    }, 1000);

    const songQuery = intent + ' songs';

    try {
      // Fetch 40 songs
      let fetchedSongs = await firstValueFrom(
        this.youtubeApi.searchMusic(songQuery, 40).pipe(
          timeout(12000),
          catchError(err => {
            console.warn('[Discovery] Query failed:', err);
            return of([] as YouTubeSearchResult[]);
          })
        )
      );

      clearInterval(loadingInterval);

      if (fetchedSongs && fetchedSongs.length > 0) {
        this.allResults = fetchedSongs;
        
        // Show first batch immediately with stagger
        const firstBatch = this.allResults.slice(0, this.initialBatch);
        this.isSearching = false;
        this.cdr.detectChanges();

        let i = 0;
        const addOne = () => {
          if (i < firstBatch.length) {
            this.ngZone.run(() => {
              this.results = [...this.results, firstBatch[i]];
              this.cdr.detectChanges();
            });
            i++;
            setTimeout(addOne, 100); // 100ms stagger
          } else {
            if (this.allResults.length > this.initialBatch) {
              this.setupScrollListener();
            }
          }
        };
        addOne();
      } else {
        this.isSearching = false;
        this.errorMessage = "Could not find songs for this taste. Try something else!";
        this.cdr.detectChanges();
      }
    } catch (e) {
      clearInterval(loadingInterval);
      this.isSearching = false;
      this.errorMessage = "An error occurred while finding songs.";
      this.cdr.detectChanges();
    }
  }

  private setupScrollListener() {
    this.removeScrollListener();
    this.scrollHandler = () => {
      if (this.isLoadingMore) return;
      if (this.results.length >= this.allResults.length) return;

      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const windowH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;

      if (scrollY + windowH >= docH - 1200) {
        this.isLoadingMore = true;
        this.loadNextBatch();
      }
    };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  private removeScrollListener() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
  }

  private loadNextBatch() {
    const currentLen = this.results.length;
    const nextItems = this.allResults.slice(currentLen, currentLen + this.scrollBatch);
    
    this.loadingMore = true;
    this.cdr.detectChanges();

    let i = 0;
    const addOne = () => {
      if (i < nextItems.length) {
        this.ngZone.run(() => {
          this.results = [...this.results, nextItems[i]];
          this.cdr.detectChanges();
        });
        i++;
        setTimeout(addOne, 100);
      } else {
        this.isLoadingMore = false;
        this.loadingMore = false;
        this.cdr.detectChanges();
      }
    };
    addOne();
  }

  onPlay(track: YouTubeSearchResult) {
    this.playTrack.emit(track);
  }

  onRightClick(event: MouseEvent, track: YouTubeSearchResult): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleMenu.emit({track, event});
  }

  isCurrentTrack(track: YouTubeSearchResult): boolean {
    return this.playerService.currentTrack()?.videoId === track.videoId;
  }
}


