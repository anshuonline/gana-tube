import { Component, OnInit, ViewChild, signal, ViewEncapsulation, HostListener, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideDisc3, LucideChevronLeft, LucideChevronRight, LucideSearch, LucideUsers, LucideDownload } from '@lucide/angular';

import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { MusicPlayerComponent } from './components/music-player/music-player.component';
import { YtPlayerComponent } from './components/yt-player/yt-player.component';
import { FullScreenPlayerComponent } from './components/full-screen-player/full-screen-player.component';
import { ListenTogetherComponent } from './components/listen-together/listen-together.component';
import { YoutubeApiService, YouTubeSearchResult } from './services/youtube-api.service';
import { PlayerService } from './services/player.service';
import { AlgorithmService, ShelfDefinition } from './services/algorithm.service';
import { environment } from '../environments/environment';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, filter, catchError } from 'rxjs/operators';
import { Router, NavigationEnd, RouterModule, ActivatedRoute } from '@angular/router';
import { PAGE_CONTENT } from './data/static-pages';
import { PlaylistPageComponent } from './components/playlist-page/playlist-page.component';
import { PLAYLISTS, PlaylistMeta } from './data/playlists.data';
import { PwaService } from './services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LucideChevronLeft,
    LucideChevronRight,
    LucideSearch,
    LucideUsers,
    LucideDownload,
    SearchBarComponent,
    SearchResultsComponent,
    MusicPlayerComponent,
    YtPlayerComponent,
    FullScreenPlayerComponent,
    ListenTogetherComponent,
    PlaylistPageComponent,
    RouterModule
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnInit {
  @ViewChild(SearchBarComponent) searchBar!: SearchBarComponent;

  public pwaService = inject(PwaService);

  results = signal<YouTubeSearchResult[]>([]);
  isLoading = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  isFullScreenPlayerVisible = signal<boolean>(false);
  isListenTogetherVisible = signal<boolean>(false);
  apiKeyMissing = false;

  currentQuery = '';

  // Language filter
  availableLanguages = ['Hindi', 'English', 'Punjabi', 'Bhojpuri', 'Haryanvi', 'Tamil', 'Telugu'];
  homeScreenLanguage = signal<string>('Hindi');

  // Playlists State
  allPlaylists = PLAYLISTS;
  selectedPlaylist = signal<PlaylistMeta | null>(null);
  
  homePlaylists = computed(() => {
    return this.allPlaylists.filter(p => p.language === this.homeScreenLanguage());
  });

  // Top Artists Data
  topArtistsByLang: Record<string, {name: string, image: string}[]> = {
    'Hindi': [
      { name: 'Arijit Singh', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Arijit_Singh_performance_at_Chandigarh_2025.jpg/500px-Arijit_Singh_performance_at_Chandigarh_2025.jpg' },
      { name: 'Shreya Ghoshal', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRV2uQTlBVTPRmPczCJ3ebYPPCiNXdskveCjApGGsiYHwhT8wFhNWrShJg-mjpRrnzFyUia504oAXU38CiDUN1pHbTZlcaNTA-AATVEBTWi-w&s=10' },
      { name: 'AR Rahman', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/AR_Rahman_at_Premier_Futsal_Press_Meet_%28cropped%29.jpg/500px-AR_Rahman_at_Premier_Futsal_Press_Meet_%28cropped%29.jpg' },
      { name: 'Neha Kakkar', image: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Neha_Kakkar_in_January_2020.jpg' },
      { name: 'Armaan Malik', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Armaan_Malik_2016.jpg/500px-Armaan_Malik_2016.jpg' },
      { name: 'Sunidhi Chauhan', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5BAm4r9Y80jFMiRlqTJEU_8Pt-1mF9q1APFLmpW8hbyozQcbXo5yF-AeYdeeoXl-ImjuA1nOpmHrdk05H9__xWFxUY_5xJwJ0DXlVto13gg&s=10' },
      { name: 'Jubin Nautiyal', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSS3crbcdJBTFuIOusxtwsqUoLUdjVlkYHxAagcfnPlhn9hMhlhMR61OsVSBK4YoDYflZKsd_vMq3dVpdGOZwMT441Old4qCx875VQj2Orp0A&s=10' },
      { name: 'Darshan Raval', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQY-gC8oCBsrpKPs01Z_4KHtbrJnmjseZ6vsaVSSLAgOvrCzOGteyQ-LgjmS84tA_8xNYu4kNEB_sbbKGwzkIXoeKcDM_IU5kDUCqkZHgraNA&s=10' },
      { name: 'Sonu Nigam', image: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Sonu_Nigam123.jpg' },
      { name: 'Vishal Mishra', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5nWJytsnV4xt2lYhsgN70PmLdmQbGP3z2c0XZu2jVzLPaEaOC99mdfoXbk1i77TbUyKO-mGKiVThFcH4FIKpyS8ESDWtm8wzr1FCPWaEt7w&s=10' }
    ],
    'English': [
      { name: 'Taylor Swift', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/500px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png' },
      { name: 'Ed Sheeran', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ed_Sheeran-6886_%28cropped%29.jpg/500px-Ed_Sheeran-6886_%28cropped%29.jpg' },
      { name: 'Dua Lipa', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Dua_Lipa-69798_%28cropped%29.jpg/500px-Dua_Lipa-69798_%28cropped%29.jpg' },
      { name: 'The Weeknd', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_Portrait_by_Brian_Ziff.jpg/500px-The_Weeknd_Portrait_by_Brian_Ziff.jpg' },
      { name: 'Billie Eilish', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg/500px-BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg' },
      { name: 'Ariana Grande', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Ariana_Grande_promoting_Wicked_%282024%29.jpg/500px-Ariana_Grande_promoting_Wicked_%282024%29.jpg' },
      { name: 'Justin Bieber', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Justin_Bieber_in_2015.jpg/500px-Justin_Bieber_in_2015.jpg' },
      { name: 'Bruno Mars', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/BrunoMars24KMagicWorldTourLive_%28cropped%29.jpg/500px-BrunoMars24KMagicWorldTourLive_%28cropped%29.jpg' },
      { name: 'Eminem', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Eminem_2021_Color_Corrected.jpg/500px-Eminem_2021_Color_Corrected.jpg' },
      { name: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg/500px-Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg' }
    ],
    'Punjabi': [
      { name: 'Diljit Dosanjh', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Diljit_Dosanjh.jpg' },
      { name: 'Karan Aujla', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Karan_Aujla_2020.jpg/500px-Karan_Aujla_2020.jpg' },
      { name: 'Sidhu Moose Wala', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Sidhu_Moose_Wala_during_the_shooting_of_his_film_Moosa_Jatt_%28cropped%29.jpg/500px-Sidhu_Moose_Wala_during_the_shooting_of_his_film_Moosa_Jatt_%28cropped%29.jpg' },
      { name: 'AP Dhillon', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/AP_Dhillon_CA.jpg/500px-AP_Dhillon_CA.jpg' },
      { name: 'Guru Randhawa', image: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Guru_Randhawa_at_the_launch_of_MTV_Unplugged_Season_8_%28cropped%29.jpg' },
      { name: 'Harrdy Sandhu', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Harrdy_Sandhu_snapped_promoting_his_film_on_Jhalak_Dikhhla_Jaa_10.jpg/500px-Harrdy_Sandhu_snapped_promoting_his_film_on_Jhalak_Dikhhla_Jaa_10.jpg' },
      { name: 'Ammy Virk', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Ammy_Virk_2019.jpg/500px-Ammy_Virk_2019.jpg' },
      { name: 'Shubh', image: '' },
      { name: 'B Praak', image: 'https://upload.wikimedia.org/wikipedia/commons/6/67/National_Awards_B_Praak_%28cropped%29.jpg' },
      { name: 'Mankirt Aulakh', image: '' }
    ]
  };

  currentTopArtists = computed(() => {
    return this.topArtistsByLang[this.homeScreenLanguage()] || [];
  });

  lazyLoadPage = 0;
  isLazyLoading = signal<boolean>(false);
  isScrolled = signal<boolean>(false);
  isSearchMode = signal<boolean>(false);

  // Dynamic algorithmic shelves for home recommendations
  allShelfDefinitions: ShelfDefinition[] = [];

  // Dynamic shelves signal holding loaded categories
  loadedShelves = signal<Array<{ title: string; query: string; songs: YouTubeSearchResult[] }>>([]);
  shelvesLoading = signal<boolean>(false);
  shelfLoading = signal<boolean>(false);
  loadingShelfTitle = signal<string>('');

  currentPage = signal<string>('home');
  pageContent = PAGE_CONTENT;

  carouselIndex = 0;
  private carouselInterval: any;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private youtubeApi: YoutubeApiService,
    public playerService: PlayerService,
    private algorithmService: AlgorithmService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      let url = event.urlAfterRedirects.split('/')[1] || 'home';
      url = url.split('?')[0]; // Ignore query params
      if (this.pageContent[url]) {
        this.currentPage.set(url);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.currentPage.set('home');
      }
    });
  }

  resetSearchState(event?: Event): void {
    if (event) event.preventDefault();
    this.isSearchMode.set(false);
    this.hasSearched.set(false);
    this.currentQuery = '';
    this.results.set([]);
    this.currentPage.set('home');
    this.selectedPlaylist.set(null);
    if (this.searchBar) {
      this.searchBar.clearQuery();
    }
  }

  openSearchPage(): void {
    this.isSearchMode.set(true);
    setTimeout(() => {
      if (this.searchBar) {
        this.searchBar.focusInput();
      }
    }, 100);
  }

  closeSearchPage(): void {
    this.isSearchMode.set(false);
  }

  openFullScreenPlayer(): void {
    this.isFullScreenPlayerVisible.set(true);
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
  }

  closeFullScreenPlayer(): void {
    this.isFullScreenPlayerVisible.set(false);
    document.body.style.overflow = '';
  }

  openListenTogether(): void {
    this.isListenTogetherVisible.set(true);
  }

  closeListenTogether(): void {
    this.isListenTogetherVisible.set(false);
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

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const videoId = params.get('play');
      if (videoId) {
        // Simple search by videoId or fetch details to play
        this.youtubeApi.searchMusic(videoId, 1).subscribe({
          next: (res) => {
            if (res && res.length > 0) {
              this.playerService.playTrack(res[0]);
              // Clear param from URL after playing
              this.router.navigate([], { queryParams: { play: null }, queryParamsHandling: 'merge', replaceUrl: true });
            }
          }
        });
      }
    });

    this.loadInitialShelves();
    this.startCarouselTimer();

    // Prevent focus from getting trapped in iframes (e.g. YouTube player)
    // This ensures global keyboard shortcuts (Ctrl+K, Space, Arrows) always work
    window.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.activeElement instanceof HTMLIFrameElement) {
          document.activeElement.blur();
          window.focus();
        }
      }, 50);
    });
  }

  loadInitialShelves(language?: string): void {
    this.shelvesLoading.set(true);
    this.loadedShelves.set([]);
    this.algorithmService.getVariableRewardShelves(language || this.homeScreenLanguage()).subscribe(shelves => {
      this.allShelfDefinitions = shelves;
      const initialDefinitions = this.allShelfDefinitions.slice(0, 3);
      let loadedCount = 0;

      if (initialDefinitions.length === 0) {
        this.shelvesLoading.set(false);
        return;
      }

      initialDefinitions.forEach((def) => {
        this.youtubeApi.searchMusic(def.query, 50).subscribe({
          next: (songs) => {
            if (songs && songs.length > 0) {
              this.loadedShelves.update(shelvesList => {
                const updated = [...shelvesList];
                updated.push({ title: def.title, query: def.query, songs });
                // Sort by their original definition index to preserve order
                return updated.sort((a, b) => {
                  const idxA = this.allShelfDefinitions.findIndex(d => d.title === a.title);
                  const idxB = this.allShelfDefinitions.findIndex(d => d.title === b.title);
                  return idxA - idxB;
                });
              });
            }
            loadedCount++;
            if (loadedCount >= initialDefinitions.length) {
              this.shelvesLoading.set(false);
              // Trigger background loading of remaining shelves
              setTimeout(() => this.loadNextShelf(), 500);
            }
          },
          error: (err) => {
            console.error(`Failed to load shelf: ${def.title}`, err);
            loadedCount++;
            if (loadedCount >= initialDefinitions.length) {
              this.shelvesLoading.set(false);
              // Trigger background loading of remaining shelves
              setTimeout(() => this.loadNextShelf(), 500);
            }
          }
        });
      });
    });
  }

  loadNextShelf(): void {
    const currentCount = this.loadedShelves().length;
    if (currentCount >= this.allShelfDefinitions.length || this.shelfLoading()) {
      return;
    }

    // Load up to 5 shelves at once
    const batchSize = 5;
    const nextDefs = this.allShelfDefinitions.slice(currentCount, currentCount + batchSize);
    
    this.loadingShelfTitle.set(nextDefs[0].title + (nextDefs.length > 1 ? ' & more...' : ''));
    this.shelfLoading.set(true);

    const observables = nextDefs.map(def => 
      this.youtubeApi.searchMusic(def.query, 50).pipe(
        // Catch errors for individual shelf loads so the whole batch doesn't fail
        catchError((err: any) => {
          console.error(`Failed to load shelf: ${def.title}`, err);
          return of(null);
        })
      )
    );

    forkJoin(observables).subscribe({
      next: (results: any[]) => {
        const newShelves: any[] = [];
        results.forEach((songs: any, index: number) => {
          if (songs && songs.length > 0) {
            newShelves.push({
              title: nextDefs[index].title,
              query: nextDefs[index].query,
              songs
            });
          }
        });
        
        if (newShelves.length > 0) {
          this.loadedShelves.update(shelves => [...shelves, ...newShelves]);
        }
        this.shelfLoading.set(false);
        
        // Continue loading next batch in background if more shelves exist
        if (this.loadedShelves().length < this.allShelfDefinitions.length) {
          setTimeout(() => this.loadNextShelf(), 1000);
        }
      },
      error: (err: any) => {
        console.error('Failed to load shelf batch', err);
        this.shelfLoading.set(false);
        
        // Continue loading next batch in background even if this one failed
        if (this.loadedShelves().length < this.allShelfDefinitions.length) {
          setTimeout(() => this.loadNextShelf(), 1000);
        }
      }
    });
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  onSuggestSearch(query: string): void {
    if (this.searchBar) {
      this.searchBar.query = query;
    }
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
    // 1. Play track immediately and queue the rest of the search results
    // This ensures that the queue matches the genre/context of what the user searched for.
    const currentResults = this.results();
    const trackIndex = currentResults.findIndex(t => t.videoId === track.videoId);
    
    if (trackIndex !== -1) {
      this.playerService.setQueue(currentResults as any, trackIndex);
    } else {
      this.playerService.setQueue([track as any], 0);
      
      // Fallback: Automatically query other popular songs by this artist to build autoplay queue
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
  }

  performSearch(query: string): void {
    this.currentQuery = query;
    this.lazyLoadPage = 0;
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.isSearchMode.set(false);
    this.youtubeApi.searchMusic(query, 50).pipe(takeUntil(this.destroy$)).subscribe({
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


  @HostListener('document:keydown', ['$event'])
  handleGlobalKeyboard(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'k' || event.code === 'KeyK')) {
      event.preventDefault();
      event.stopPropagation();
      this.openSearchPage();
      return;
    }

    if (event.key === 'Escape' && this.isSearchMode()) {
      this.closeSearchPage();
      return;
    }

    // Media shortcuts (only when not typing in an input)
    if (!isInput && this.playerService.currentTrack()) {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          this.playerService.togglePlayPause();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.playerService.previous();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.playerService.next();
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.playerService.setVolume(Math.min(100, this.playerService.volume() + 5));
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.playerService.setVolume(Math.max(0, this.playerService.volume() - 5));
          break;
      }
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollOffset = document.documentElement.scrollTop || document.body.scrollTop;
    this.isScrolled.set(scrollOffset > 50);

    // Parallax: fade out hero as user scrolls
    const heroEl = document.querySelector('.hero-section') as HTMLElement;
    if (heroEl) {
      const heroHeight = heroEl.offsetHeight;
      const ratio = Math.min(scrollOffset / (heroHeight * 0.6), 1);
      heroEl.style.opacity = `${1 - ratio}`;
      heroEl.style.transform = `translateY(-${scrollOffset * 0.3}px)`;
    }

    if (this.isLoading() || this.isLazyLoading() || this.shelfLoading() || this.shelvesLoading()) {
      return;
    }

    const pos = scrollOffset + window.innerHeight;
    const max = document.documentElement.scrollHeight;
    
    // If we are within 350px of the bottom of the page
    if (pos >= max - 350) {
      if (this.hasSearched()) {
        this.loadMoreResults();
      }
    }
  }

  setLanguage(lang: string): void {
    this.homeScreenLanguage.set(lang);
    this.loadInitialShelves(); // Reload dynamic shelves for the new language
  }

  openPlaylist(playlist: PlaylistMeta): void {
    this.selectedPlaylist.set(playlist);
    this.currentPage.set('playlist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closePlaylist(): void {
    this.selectedPlaylist.set(null);
    this.currentPage.set('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  startCarouselTimer(): void {
    this.carouselInterval = setInterval(() => {
      this.nextCarouselSlide();
    }, 4000);
  }

  resetCarouselTimer(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    this.startCarouselTimer();
  }

  nextCarouselSlide(event?: Event): void {
    if (event) {
      event.stopPropagation();
      this.resetCarouselTimer();
    }
    const firstShelf = this.loadedShelves()[0];
    if (firstShelf && firstShelf.songs && firstShelf.songs.length > 0) {
      this.carouselIndex = (this.carouselIndex + 1) % firstShelf.songs.length;
    }
  }

  prevCarouselSlide(event?: Event): void {
    if (event) {
      event.stopPropagation();
      this.resetCarouselTimer();
    }
    const firstShelf = this.loadedShelves()[0];
    if (firstShelf && firstShelf.songs && firstShelf.songs.length > 0) {
      this.carouselIndex = (this.carouselIndex - 1 + firstShelf.songs.length) % firstShelf.songs.length;
    }
  }

  setCarouselSlide(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
      this.resetCarouselTimer();
    }
    this.carouselIndex = index;
  }

  playLatestHits(): void {
    const firstShelf = this.loadedShelves()[0];
    if (firstShelf && firstShelf.songs && firstShelf.songs.length > 0) {
      this.playerService.setQueue(firstShelf.songs as any, 0);
    }
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
