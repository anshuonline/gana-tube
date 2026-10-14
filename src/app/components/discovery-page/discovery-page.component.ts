import { Component, EventEmitter, Output, ElementRef, ViewChild, ChangeDetectorRef, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, timeout, catchError, of, forkJoin } from 'rxjs';
import {
  LucidePlay,
  LucidePause,
  LucideSparkles,
  LucideCompass,
  LucideMusic,
  LucideFlame,
  LucideTrendingUp,
  LucideHeadphones,
  LucideRadio,
  LucideZap,
  LucideHeart,
  LucideCoffee,
  LucideDisc,
  LucideActivity,
  LucideMinus,
  LucideSearch,
  LucideChevronRight,
  LucideChevronLeft,
  LucideLoader2
} from '@lucide/angular';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';
import { HttpClient } from '@angular/common/http';

export interface MoodCategory {
  id: string;
  name: string;
  query: string;
  icon: 'heart' | 'flame' | 'coffee' | 'zap' | 'music' | 'activity' | 'sparkles' | 'headphones' | 'radio' | 'disc' | 'compass';
  gradient: string;
  color?: string;
}

export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    id: 'romance',
    name: 'Romance & Love',
    query: 'Bollywood Romantic Hits Arijit Singh Shreya Ghoshal',
    icon: 'heart',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    color: '#ec4899'
  },
  {
    id: 'party',
    name: 'Party & Dance',
    query: 'Bollywood Party Dance Songs Badshah Honey Singh',
    icon: 'flame',
    gradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
    color: '#f97316'
  },
  {
    id: 'chill-lofi',
    name: 'Chill & Lofi',
    query: 'Indian Lofi Chill Slowed Reverb Songs',
    icon: 'coffee',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    color: '#3b82f6'
  },
  {
    id: 'punjabi',
    name: 'Punjabi Power',
    query: 'Latest Punjabi Hits Diljit Dosanjh Karan Aujla Sidhu Moosewala',
    icon: 'zap',
    gradient: 'linear-gradient(135deg, #eab308 0%, #b45309 100%)',
    color: '#eab308'
  },
  {
    id: 'bollywood-90s',
    name: 'Bollywood 90s',
    query: '90s Bollywood Evergreen Melodies Kumar Sanu Alka Yagnik',
    icon: 'music',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    color: '#8b5cf6'
  },
  {
    id: 'workout',
    name: 'Workout & Gym',
    query: 'Workout Gym Motivation High Energy Hindi Songs',
    icon: 'activity',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
    color: '#ef4444'
  },
  {
    id: 'devotional',
    name: 'Devotional & Bhakti',
    query: 'Krishna Shiv Bhakti Bhajans Peaceful Aarti',
    icon: 'sparkles',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    color: '#f59e0b'
  },
  {
    id: 'acoustic',
    name: 'Acoustic & Unplugged',
    query: 'Bollywood Acoustic Unplugged Guitar Songs',
    icon: 'headphones',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    color: '#10b981'
  },
  {
    id: 'desi-hiphop',
    name: 'Desi Hip-Hop & Rap',
    query: 'Desi Hip Hop Rap Divine Seedhe Maut MC Stan King',
    icon: 'radio',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #3730a3 100%)',
    color: '#6366f1'
  },
  {
    id: 'ghazals',
    name: 'Ghazals & Sufi',
    query: 'Soulful Ghazals Jagjit Singh Nusrat Fateh Ali Khan Rahat',
    icon: 'disc',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
    color: '#14b8a6'
  },
  {
    id: 'edm',
    name: 'EDM & Electronic',
    query: 'EDM Indian Electronic Dance Festival Beats',
    icon: 'zap',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
    color: '#06b6d4'
  },
  {
    id: 'indie',
    name: 'Indie & Pop',
    query: 'Indian Indie Pop Anuv Jain Prateek Kuhad Jasleen Royal',
    icon: 'compass',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    color: '#a855f7'
  },
  {
    id: 'retro-classics',
    name: 'Retro Classics (70s-80s)',
    query: 'Retro Hindi Classics Kishore Kumar Mohammed Rafi Lata Mangeshkar',
    icon: 'disc',
    gradient: 'linear-gradient(135deg, #d946ef 0%, #86198f 100%)',
    color: '#d946ef'
  },
  {
    id: 'late-night',
    name: 'Late Night Driving',
    query: 'Late Night Drive Peaceful Car Hindi Songs',
    icon: 'headphones',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #075985 100%)',
    color: '#0284c7'
  }
];

@Component({
  selector: 'app-discovery-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucidePlay,
    LucidePause,
    LucideSparkles,
    LucideCompass,
    LucideMusic,
    LucideFlame,
    LucideTrendingUp,
    LucideHeadphones,
    LucideRadio,
    LucideZap,
    LucideHeart,
    LucideCoffee,
    LucideDisc,
    LucideActivity,
    LucideMinus,
    LucideSearch,
    LucideChevronRight,
    LucideChevronLeft,
    LucideLoader2
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './discovery-page.component.html',
  styleUrls: ['./discovery-page.component.scss']
})
export class DiscoveryPageComponent implements OnInit {
  @Output() playTrack = new EventEmitter<YouTubeSearchResult>();
  @Output() toggleMenu = new EventEmitter<{track: YouTubeSearchResult, event: MouseEvent}>();

  @ViewChild('trendingRail') trendingRail?: ElementRef<HTMLDivElement>;

  // Explore Data
  spotlight: YouTubeSearchResult | null = null;
  trendingNow: YouTubeSearchResult[] = [];
  freshDrops: YouTubeSearchResult[] = [];
  curatedTracks: YouTubeSearchResult[] = [];
  selectedCategory: MoodCategory | null = null;

  // Categories list
  categories: MoodCategory[] = MOOD_CATEGORIES;

  // States
  isInitialLoading: boolean = true;
  isCuratingMood: boolean = false;
  isSearchingAI: boolean = false;
  errorMessage: string = '';
  loadingMessage: string = '';

  // Aura AI Assistant
  isAuraMinimized: boolean = true;
  askQuery: string = '';

  constructor(
    private youtubeApi: YoutubeApiService,
    public playerService: PlayerService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  private apiUrl = 'https://manageads.ganatube.in/analytic-api.php';

  ngOnInit(): void {
    this.loadExploreData();
  }

  loadExploreData(): void {
    this.isInitialLoading = true;
    this.errorMessage = '';

    // Primary: fetch live trending hits (Top 50) and latest releases (Taaza Tunes) from JioSaavn
    const trending$ = this.youtubeApi.getSaavnTrending('Hindi', 20, 'trending').pipe(
      timeout(10000),
      catchError(err => {
        console.warn('[Discovery] JioSaavn getTrending failed, falling back to YouTube Music:', err);
        return this.youtubeApi.getTrendingMusic('Hindi', 20).pipe(
          catchError(() => this.youtubeApi.searchMusic('Trending Hindi Songs 2026', 20))
        );
      })
    );

    const latest$ = this.youtubeApi.getSaavnTrending('Hindi', 16, 'latest').pipe(
      timeout(10000),
      catchError(err => {
        console.warn('[Discovery] JioSaavn getLatest failed, falling back to search:', err);
        return this.youtubeApi.searchMusic('Latest Official Bollywood Songs 2026', 16).pipe(
          catchError(() => of([] as YouTubeSearchResult[]))
        );
      })
    );

    forkJoin({ trending: trending$, latest: latest$ }).subscribe({
      next: ({ trending, latest }) => {
        if (trending && trending.length > 0) {
          this.spotlight = trending[0];
          this.trendingNow = trending.slice(0, 16);
        }
        if (latest && latest.length > 0) {
          this.freshDrops = latest;
        } else if (trending && trending.length > 16) {
          this.freshDrops = trending.slice(16);
        } else {
          this.fetchFreshDrops();
          return;
        }
        this.isInitialLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.fallbackToTop100();
      }
    });
  }

  private fetchFreshDrops(): void {
    this.youtubeApi.searchMusic('Latest Official Bollywood Songs 2026', 12).pipe(
      timeout(8000),
      catchError(() => of([] as YouTubeSearchResult[]))
    ).subscribe({
      next: (drops) => {
        this.freshDrops = drops || [];
        this.isInitialLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isInitialLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private fallbackToTop100(): void {
    this.http.get<any>(`${this.apiUrl}?action=getTop100Songs`).subscribe({
      next: (res) => {
        if (res && res.status === 'success' && res.data && res.data.length > 0) {
          const mappedData: YouTubeSearchResult[] = res.data.map((song: any) => ({
            videoId: song.video_id,
            title: song.title,
            thumbnail: song.thumbnail,
            thumbnailHigh: song.thumbnail,
            channelTitle: 'GanaTube Top Charts',
            publishedAt: new Date().toISOString()
          }));
          this.spotlight = mappedData[0];
          this.trendingNow = mappedData.slice(0, 16);
          this.freshDrops = mappedData.slice(16, 28);
          this.isInitialLoading = false;
          this.cdr.detectChanges();
        } else {
          this.errorMessage = 'Could not load explore charts. Please check your connection.';
          this.isInitialLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.errorMessage = 'Failed to load explore feed. Tap retry.';
        this.isInitialLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Playback Handlers ───────────────────────────────────────────────────────
  handleSpotlightPlay(): void {
    if (!this.spotlight) return;
    if (this.isSpotlightPlaying()) {
      this.playerService.togglePlayPause();
    } else {
      this.onPlayTrack(this.spotlight, this.trendingNow.length > 0 ? this.trendingNow : [this.spotlight]);
    }
  }

  isSpotlightPlaying(): boolean {
    return (
      !!this.spotlight &&
      this.playerService.currentTrack()?.videoId === this.spotlight.videoId &&
      this.playerService.isPlaying()
    );
  }

  isCurrentTrack(track: YouTubeSearchResult): boolean {
    return (
      this.playerService.currentTrack()?.videoId === track.videoId &&
      this.playerService.isPlaying()
    );
  }

  isCurrentTrackLoaded(track: YouTubeSearchResult): boolean {
    return this.playerService.currentTrack()?.videoId === track.videoId;
  }

  onPlayTrack(track: YouTubeSearchResult, queueContext?: YouTubeSearchResult[]): void {
    if (!track) return;
    this.playTrack.emit(track);

    if (queueContext && queueContext.length > 0) {
      const idx = queueContext.findIndex(t => t.videoId === track.videoId);
      this.playerService.setQueue(queueContext, idx >= 0 ? idx : 0);
    } else {
      this.playerService.playTrack(track);
    }
  }

  onRightClick(event: MouseEvent, track: YouTubeSearchResult): void {
    if (!track) return;
    event.preventDefault();
    event.stopPropagation();
    this.toggleMenu.emit({ track, event });
  }

  on3DotClick(event: MouseEvent, track: YouTubeSearchResult): void {
    if (!track) return;
    event.preventDefault();
    event.stopPropagation();
    this.toggleMenu.emit({ track, event });
  }

  onImgError(event: Event, track: YouTubeSearchResult): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    if (track.videoId && track.videoId.length === 11 && !img.dataset['fallback']) {
      img.dataset['fallback'] = '1';
      img.src = `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`;
      return;
    }
    img.style.visibility = 'hidden';
  }

  // ─── Carousel Controls ───────────────────────────────────────────────────────
  scrollTrending(direction: 'left' | 'right'): void {
    if (!this.trendingRail?.nativeElement) return;
    const container = this.trendingRail.nativeElement;
    const scrollAmount = 480;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }

  // ─── Moods & Genres Browse ──────────────────────────────────────────────────
  selectCategory(cat: MoodCategory): void {
    this.selectedCategory = cat;
    this.curateCategory(cat);
  }

  clearCategory(): void {
    this.selectedCategory = null;
    this.curatedTracks = [];
  }

  curateCategory(cat: MoodCategory): void {
    this.isCuratingMood = true;
    this.curatedTracks = [];
    this.cdr.detectChanges();

    this.youtubeApi.searchMusic(cat.query, 24).pipe(
      timeout(10000),
      catchError(() => of([] as YouTubeSearchResult[]))
    ).subscribe({
      next: (tracks) => {
        this.curatedTracks = tracks || [];
        this.isCuratingMood = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          const el = document.getElementById('curated-mood-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      },
      error: () => {
        this.isCuratingMood = false;
        this.cdr.detectChanges();
      }
    });
  }

  exploreArtist(artistName?: string): void {
    if (!artistName) return;
    const cat: MoodCategory = {
      id: 'artist-' + artistName.replace(/\s+/g, '-').toLowerCase(),
      name: `Artist: ${artistName}`,
      query: `${artistName} top hits songs`,
      icon: 'music',
      gradient: 'linear-gradient(135deg, #F50919 0%, #D90816 100%)',
      color: '#F50919'
    };
    this.selectCategory(cat);
  }

  // ─── Aura AI Assistant ───────────────────────────────────────────────────────
  toggleAura(): void {
    this.isAuraMinimized = !this.isAuraMinimized;
  }

  async askAI(): Promise<void> {
    const query = this.askQuery.trim();
    if (!query) return;

    this.isSearchingAI = true;
    this.loadingMessage = 'Curating your vibe with Aura AI...';
    this.cdr.detectChanges();

    const cat: MoodCategory = {
      id: 'ai-vibe',
      name: `Aura Mix: "${query}"`,
      query: `${query} songs`,
      icon: 'sparkles',
      gradient: 'linear-gradient(135deg, #F50919 0%, #D90816 100%)',
      color: '#F50919'
    };

    this.selectedCategory = cat;

    try {
      const songs = await firstValueFrom(
        this.youtubeApi.searchMusic(`${query} songs`, 28).pipe(
          timeout(12000),
          catchError(() => of([] as YouTubeSearchResult[]))
        )
      );

      this.curatedTracks = songs || [];
      this.isSearchingAI = false;
      this.isAuraMinimized = true; // Collapse so user sees results immediately
      this.cdr.detectChanges();

      setTimeout(() => {
        const el = document.getElementById('curated-mood-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch {
      this.isSearchingAI = false;
      this.cdr.detectChanges();
    }
  }

  formatDuration(sec?: number): string {
    if (!sec || isNaN(sec)) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
