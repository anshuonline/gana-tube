import { Component, OnInit, ViewChild, signal, ViewEncapsulation, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideDisc3, LucideChevronLeft, LucideChevronRight, LucideSearch } from '@lucide/angular';

import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { MusicPlayerComponent } from './components/music-player/music-player.component';
import { YtPlayerComponent } from './components/yt-player/yt-player.component';
import { YoutubeApiService, YouTubeSearchResult } from './services/youtube-api.service';
import { PlayerService } from './services/player.service';
import { AlgorithmService, ShelfDefinition } from './services/algorithm.service';
import { environment } from '../environments/environment';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LucideDisc3,
    LucideChevronLeft,
    LucideChevronRight,
    LucideSearch,
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

  // Language filter
  availableLanguages = ['Hindi', 'English', 'Punjabi', 'Bhojpuri', 'Haryanvi', 'Tamil', 'Telugu'];
  homeScreenLanguage = signal<string>('Hindi');

  // Top Artists Data
  topArtistsByLang: Record<string, {name: string, image: string}[]> = {
    'Hindi': [
      { name: 'Arijit Singh', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Arijit_Singh_performance_at_Chandigarh_2025.jpg/500px-Arijit_Singh_performance_at_Chandigarh_2025.jpg' },
      { name: 'Shreya Ghoshal', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Shreya_Ghoshal_Behindwoods_Gold_Icons_Awards_2023_%28cropped%29.jpg/500px-Shreya_Ghoshal_Behindwoods_Gold_Icons_Awards_2023_%28cropped%29.jpg' },
      { name: 'AR Rahman', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/AR_Rahman_at_Premier_Futsal_Press_Meet_%28cropped%29.jpg/500px-AR_Rahman_at_Premier_Futsal_Press_Meet_%28cropped%29.jpg' },
      { name: 'Neha Kakkar', image: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Neha_Kakkar_in_January_2020.jpg' },
      { name: 'Armaan Malik', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Armaan_Malik_2016.jpg/500px-Armaan_Malik_2016.jpg' },
      { name: 'Atif Aslam', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Atif_Aslam_at_Badlapur_%28cropped%29.jpg/500px-Atif_Aslam_at_Badlapur_%28cropped%29.jpg' },
      { name: 'Jubin Nautiyal', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Jubin_Nauityal_at_the_Good_Homes_Awards_2015.jpg/500px-Jubin_Nauityal_at_the_Good_Homes_Awards_2015.jpg' },
      { name: 'Darshan Raval', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Darshan-Raval-grace-the-12th-radio-mirchi-music-awards-2020.jpg/500px-Darshan-Raval-grace-the-12th-radio-mirchi-music-awards-2020.jpg' },
      { name: 'Sonu Nigam', image: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Sonu_Nigam123.jpg' },
      { name: 'Vishal Mishra', image: '' }
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
  pageContent: Record<string, { title: string; html: string }> = {
    'how-it-works': {
      title: 'How It Works',
      html: `
        <p>GanaTube leverages advanced algorithms to provide a seamless, continuous music experience. We connect directly to the largest media libraries in the world and instantly extract high-quality audio streams without the need for bloated video downloads.</p>
        <p>Simply search for a song, pick a mood, or select your preferred language. Our engine will dynamically queue related songs and ensure infinite playback.</p>
      `
    },
    'features': {
      title: 'Features',
      html: `
        <ul>
          <li><strong>Distraction-Free Audio:</strong> Enjoy pure music without visual clutter or heavy video buffering.</li>
          <li><strong>Infinite Playback:</strong> Smart algorithmic queuing ensures the music never stops.</li>
          <li><strong>Language Preferences:</strong> Instantly filter recommendations by your preferred regional language.</li>
          <li><strong>Background Play:</strong> Designed to work smoothly in the background while you multitask.</li>
          <li><strong>Zero Cost:</strong> A completely free, community-driven platform.</li>
        </ul>
      `
    },
    'faq': {
      title: 'Frequently Asked Questions',
      html: `
        <p><strong>Is GanaTube free?</strong><br>Yes, it is entirely free to use.</p>
        <p><strong>Do I need an account?</strong><br>No account is required. We save your preferences locally on your device for privacy.</p>
        <p><strong>How do I change the language?</strong><br>Use the language chips on the home screen to instantly filter suggestions.</p>
      `
    },
    'about': {
      title: 'About Us',
      html: `
        <p>GanaTube is an independent project built for music lovers who want a fast, lightweight, and privacy-respecting way to stream their favorite songs.</p>
        <p>We prioritize performance and user experience over everything else, stripping away the heavy elements of traditional streaming platforms to give you pure, uninterrupted audio.</p>
      `
    },
    'contact': {
      title: 'Contact Us',
      html: `
        <p>We'd love to hear from you. For general inquiries, suggestions, or feedback, please reach out to us at:</p>
        <p><strong>support@ganatube.in</strong></p>
      `
    },
    'privacy-policy': {
      title: 'Privacy Policy',
      html: `
        <p>Your privacy is important to us. GanaTube operates locally within your browser as much as possible. We do not store your personal listening history on any centralized servers.</p>
        <p>We may use anonymous telemetry to improve platform stability, but your musical tastes remain yours alone.</p>
      `
    },
    'terms-of-service': {
      title: 'Terms of Service',
      html: `
        <p>By using GanaTube, you agree to these terms. GanaTube is provided "as is" without any warranties.</p>
        <p>You agree not to misuse the platform, attempt to reverse-engineer our APIs, or use our services for any illegal activities.</p>
      `
    },
    'cookie-policy': {
      title: 'Cookie Policy',
      html: `
        <p>We use essential cookies and local storage to save your language preferences and UI settings.</p>
        <p>We do not use tracking cookies or third-party advertisement cookies. Your data stays on your device.</p>
      `
    },
    'dmca': {
      title: 'DMCA Policy',
      html: `
        <p>GanaTube acts strictly as a search engine and streaming client. We do not host any media files on our servers.</p>
        <p>If you are a copyright owner and believe your content is being indexed inappropriately, please contact us at:</p>
        <p><strong>dmca@ganatube.in</strong></p>
      `
    },
    'disclaimer': {
      title: 'Disclaimer',
      html: `
        <p>GanaTube is a third-party client. All content provided by the search results is owned by their respective creators and publishers.</p>
        <p>We make no claim of ownership over the audio streams provided through the platform.</p>
      `
    }
  };

  carouselIndex = 0;
  private carouselInterval: any;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private youtubeApi: YoutubeApiService,
    public playerService: PlayerService,
    private algorithmService: AlgorithmService
  ) {}

  resetSearchState(event?: Event): void {
    if (event) event.preventDefault();
    this.isSearchMode.set(false);
    this.hasSearched.set(false);
    this.currentQuery = '';
    this.results.set([]);
    this.currentPage.set('home');
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

    this.loadInitialShelves();
    this.startCarouselTimer();
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
            }
          },
          error: (err) => {
            console.error(`Failed to load shelf: ${def.title}`, err);
            loadedCount++;
            if (loadedCount >= initialDefinitions.length) {
              this.shelvesLoading.set(false);
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
      },
      error: (err: any) => {
        console.error('Failed to load shelf batch', err);
        this.shelfLoading.set(false);
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
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      event.stopPropagation();
      this.openSearchPage();
    }
    if (event.key === 'Escape' && this.isSearchMode()) {
      this.closeSearchPage();
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
      } else {
        this.loadNextShelf();
      }
    }
  }

  setLanguage(lang: string): void {
    if (this.homeScreenLanguage() === lang) return;
    this.homeScreenLanguage.set(lang);
    this.playerService.currentLanguage.set(lang);
    this.loadInitialShelves(lang);
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
