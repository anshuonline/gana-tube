import { Component, OnInit, ViewChild, signal, ViewEncapsulation, HostListener, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideDisc3, LucideChevronLeft, LucideChevronRight, LucideSearch, LucideUsers, LucideDownload, LucidePlay, LucideHome, LucideLibrary, LucideUser, LucideMessageSquare, LucideMusic, LucideMegaphone, LucideShare2, LucideCheck, LucideHeart } from '@lucide/angular';

import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { MusicPlayerComponent } from './components/music-player/music-player.component';
import { YtPlayerComponent } from './components/yt-player/yt-player.component';
import { FullScreenPlayerComponent } from './components/full-screen-player/full-screen-player.component';
import { ListenTogetherComponent } from './components/listen-together/listen-together.component';
import { YoutubeApiService, YouTubeSearchResult } from './services/youtube-api.service';
import { PlayerService } from './services/player.service';
import { AlgorithmService, ShelfDefinition } from './services/algorithm.service';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { environment } from '../environments/environment';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, filter, catchError } from 'rxjs/operators';
import { Router, NavigationEnd, RouterModule, ActivatedRoute } from '@angular/router';
import { PAGE_CONTENT } from './data/static-pages';
import { PlaylistPageComponent } from './components/playlist-page/playlist-page.component';
import { AdvertisePageComponent } from './components/advertise-page/advertise-page.component';
import { AdBookingPageComponent } from './components/ad-booking-page/ad-booking-page.component';
import { AdTermsPageComponent } from './components/ad-terms-page/ad-terms-page.component';
import { AdProhibitedPageComponent } from './components/ad-prohibited-page/ad-prohibited-page.component';
import { AdminManageSongsComponent } from './components/admin-manage-songs/admin-manage-songs';
import { PLAYLISTS, PlaylistMeta } from './data/playlists.data';
import { PwaService } from './services/pwa.service';
import { DomSanitizer, SafeResourceUrl, Meta, Title } from '@angular/platform-browser';

export interface SponsoredAd {
  isActive: boolean;
  imageUrl?: string;
  linkUrl?: string;
  customCode?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LucideChevronLeft,
    LucideChevronRight,
    LucideSearch,
    LucideMusic,
    LucideUsers,
    LucideDownload,
    LucidePlay,
    LucideHome,
    LucideLibrary,
    LucideUser,
    LucideMessageSquare,
    LucideMegaphone,
    LucideShare2,
    LucideCheck,
    LucideHeart,
    SearchBarComponent,
    SearchResultsComponent,
    MusicPlayerComponent,
    YtPlayerComponent,
    FullScreenPlayerComponent,
    ListenTogetherComponent,
    PlaylistPageComponent,
    AdvertisePageComponent,
    AdBookingPageComponent,
    AdTermsPageComponent,
    AdProhibitedPageComponent,
    RouterModule,
    AdminManageSongsComponent
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

  // Ad Booking State
  bookingState: {
    placementId?: string;
    placementName?: string;
    durationDays?: number;
    totalPrice?: number;
  } = {};

  currentQuery = '';

  // Language filter
  availableLanguages = ['English', 'Hindi', 'Punjabi', 'Bhojpuri', 'Bengali', 'Haryanvi', 'Tamil'];
  homeScreenLanguage = signal<string>('Hindi');

  // Playlists State
  customPlaylists = signal<PlaylistMeta[]>([]);
  
  allPlaylists = computed(() => {
    return [...this.customPlaylists(), ...PLAYLISTS];
  });
  
  selectedPlaylist = signal<PlaylistMeta | null>(null);
  
  homePlaylists = computed(() => {
    // Show all custom playlists + up to 2 default playlists
    const custom = this.customPlaylists().filter(p => p.language === this.homeScreenLanguage());
    const defaults = PLAYLISTS.filter(p => p.language === this.homeScreenLanguage()).slice(0, 2);
    return [...custom, ...defaults];
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
  isSearchFocused = signal<boolean>(false);

  // Dynamic algorithmic shelves for home recommendations
  allShelfDefinitions: ShelfDefinition[] = [];

  // Dynamic shelves signal holding loaded categories
  loadedShelves = signal<Array<{ title: string; query: string; songs: YouTubeSearchResult[] }>>([]);
  shelvesLoading = signal<boolean>(false);
  shelfLoading = signal<boolean>(false);
  loadingShelfTitle = signal<string>('');

  currentPage = signal<string>('home');
  activeSocialTab = signal<'chat' | 'rooms'>('chat');
  linkCopied = false;
  pageContent = PAGE_CONTENT;

  // Sponsored Ad State
  sponsoredAd = signal<SponsoredAd | null>(null);
  inFeedAd = signal<SponsoredAd | null>(null);
  showAd = signal<boolean>(true);

  // Dynamic Hero Header Data (from ManageGT admin)
  heroData = signal<Record<string, { badge: string; title: string; subtitle: string; imageUrl: string; buttonText: string; buttonLink?: string }>>({});

  private manageApiUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost/manageads/managegt-api.php' : 'https://manageads.ganatube.in/managegt-api.php';

  carouselIndex = 0;
  private carouselInterval: any;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  sanitizer = inject(DomSanitizer);

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Helpers for Fallback Design
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getGradient(name: string): string {
    const colors = [
      ['#ff9a9e', '#fecfef'],
      ['#a18cd1', '#fbc2eb'],
      ['#84fab0', '#8fd3f4'],
      ['#e0c3fc', '#8ec5fc'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#30cfd0', '#330867'],
      ['#a8edea', '#fed6e3']
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorPair = colors[Math.abs(hash) % colors.length];
    return `linear-gradient(135deg, ${colorPair[0]} 0%, ${colorPair[1]} 100%)`;
  }

  // Profile & Settings State
  musicQuality = signal<'High' | 'Standard' | 'Data Saver'>('High');
  preferredLanguages = signal<string[]>(['Hindi', 'English', 'Tamil', 'Punjabi']);

  togglePreferredLanguage(lang: string): void {
    const current = this.preferredLanguages();
    let nextLangs = [...current];

    if (current.includes(lang)) {
      if (current.length > 1) {
        nextLangs = current.filter(l => l !== lang);
        this.preferredLanguages.set(nextLangs);
        if (this.homeScreenLanguage() === lang) {
          this.setLanguage(nextLangs[0]);
        }
      }
    } else {
      nextLangs = [...current, lang];
      this.preferredLanguages.set(nextLangs);
    }

    // Sync to DB if logged in
    const user = this.authService.currentUser();
    if (user && user.email) {
      this.userService.syncProfile({
        email: user.email,
        preferred_languages: nextLangs,
        liked_songs: this.userService.likedSongs(),
        recent_plays: this.userService.recentPlays(),
        listening_preferences: this.userService.listeningPreferences()
      });
    }
  }

  constructor(
    private youtubeApi: YoutubeApiService,
    public playerService: PlayerService,
    private algorithmService: AlgorithmService,
    private router: Router,
    private route: ActivatedRoute,
    private meta: Meta,
    private title: Title,
    public authService: AuthService,
    public userService: UserService
  ) {
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.email) {
        this.userService.loadProfile(user.email).then(profile => {
          if (profile) {
            if (profile.preferred_languages && profile.preferred_languages.length > 0) {
              this.preferredLanguages.set(profile.preferred_languages);
            }
            this.algorithmService.syncFromBackend(profile.liked_songs, profile.listening_preferences);
          }
        });
      } else if (user === null) {
        this.userService.likedSongs.set([]);
        this.userService.listeningPreferences.set([]);
        this.algorithmService.syncFromBackend([], []);
      }
    }, { allowSignalWrites: true });

    this.fetchCustomPlaylists();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      let url = event.urlAfterRedirects.split('/')[1] || 'home';
      url = url.split('?')[0]; // Ignore query params
      
      if (url === 'playlist') {
        const playlistId = event.urlAfterRedirects.split('/')[2];
        const targetPlaylist = this.allPlaylists().find(p => p.id === playlistId);
        if (targetPlaylist) {
          this.selectedPlaylist.set(targetPlaylist);
          this.updateSEO(
            `${targetPlaylist.title} - GanaTube`,
            `Listen to ${targetPlaylist.title} and other trending playlists for free on GanaTube.`
          );
        }
        this.currentPage.set('playlist');
        this.isSearchMode.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else if (event.urlAfterRedirects.startsWith('/advertise')) {
        this.currentPage.set('advertise');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else if (event.urlAfterRedirects.startsWith('/admin/manage-songs')) {
        this.currentPage.set('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else if (event.urlAfterRedirects.startsWith('/managegt')) {
        this.currentPage.set('managegt');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else if (url === 'language') {
        const langParam = event.urlAfterRedirects.split('/')[2];
        if (langParam) {
          const capitalizedLang = langParam.charAt(0).toUpperCase() + langParam.slice(1);
          this.homeScreenLanguage.set(capitalizedLang);
          this.loadInitialShelves(capitalizedLang);
          this.updateSEO(
            `${capitalizedLang} Songs & Trending Playlists - GanaTube`,
            `Listen to the best ${capitalizedLang} songs, top artists, and trending playlists for free on GanaTube. Distraction-free music streaming.`
          );
        }
        this.currentPage.set('home');
        this.isSearchMode.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else if (url === 'artist') {
        const artistParam = decodeURIComponent(event.urlAfterRedirects.split('/')[2] || '');
        if (artistParam) {
          this.performSearch(artistParam + ' songs');
          this.updateSEO(
            `${artistParam} Songs & Hits - GanaTube`,
            `Listen to ${artistParam}'s top hits, latest songs, and popular albums for free on GanaTube.`
          );
        }
        this.currentPage.set('search');
        this.isSearchMode.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Check if it's a valid static page or one of our main pages
      if (['home', 'profile', 'search', 'library', 'socials', 'admin', 'managegt'].includes(url) || this.pageContent[url]) {
        this.currentPage.set(url);
        
        if (url === 'search') {
          this.isSearchMode.set(true);
        } else {
          this.isSearchMode.set(false);
        }
        
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.currentPage.set('home');
        this.isSearchMode.set(false);
        this.router.navigate(['/']);
      }

      if (url === 'home' || url === 'search' || url === 'profile' || url === 'library' || url === 'socials') {
        this.updateSEO(
          'Free Music Online Without Ads | Best Online Music App - GanaTube',
          'Play free music online without ads and without login on GanaTube. Enjoy the best free music app in India for streaming seamless, ad-free online music instantly.'
        );
      }
    });
  }

  updateSEO(titleText: string, descText: string) {
    this.title.setTitle(titleText);
    this.meta.updateTag({ name: 'description', content: descText });
    this.meta.updateTag({ property: 'og:title', content: titleText });
    this.meta.updateTag({ property: 'og:description', content: descText });
  }

  fetchCustomPlaylists(): void {
    this.youtubeApi.getCustomPlaylists().subscribe((customData) => {
      let playlists: PlaylistMeta[] = [];
      // customData is { "Hindi": [ {title, coverImage, status, searchQueries, songs, id} ] }
      Object.keys(customData).forEach(lang => {
        const langPlaylists = customData[lang] || [];
        langPlaylists.forEach(p => {
          let isPublished = p.status === 'publish';
          if (p.status === 'schedule' && p.publishDate) {
            if (new Date(p.publishDate) <= new Date()) {
              isPublished = true;
            }
          }
          
          if (isPublished) {
            playlists.push({
              id: p.id || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              slug: p.id || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              title: p.title,
              coverImage: p.coverImage || '',
              language: lang,
              searchQueries: p.searchQueries || [],
              preloadedSongs: p.songs || []
            });
          }
        });
      });
      this.customPlaylists.set(playlists);
      
      // If user refreshed on a playlist page, set the selected playlist now that custom playlists are loaded
      if (this.currentPage() === 'playlist') {
        const playlistId = this.router.url.split('/')[2];
        const targetPlaylist = this.allPlaylists().find(p => p.id === playlistId);
        if (targetPlaylist && !this.selectedPlaylist()) {
          this.selectedPlaylist.set(targetPlaylist);
        }
      }
    });
  }

  @HostListener('window:click', ['$event'])
  onWindowClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Close search dropdown
    if (this.isSearchFocused() && this.results().length > 0) {
      if (!target.closest('.search-box-container') && !target.closest('.search-results-dropdown')) {
        this.isSearchFocused.set(false);
      }
    }
  }

  openProfilePage(): void {
    this.router.navigate(['/profile']);
    this.isSearchMode.set(false);
  }

  openLibraryPage(): void {
    this.router.navigate(['/library']);
    this.isSearchMode.set(false);
  }

  openSocialsPage(): void {
    this.router.navigate(['/socials']);
    this.isSearchMode.set(false);
  }

  openAdvertisePage(): void {
    this.router.navigate(['/advertise']);
    this.isSearchMode.set(false);
  }

  setMusicQuality(quality: 'High' | 'Standard' | 'Data Saver'): void {
    this.musicQuality.set(quality);
    // In a real app, this would also tell the YT player to change quality if possible
  }

  onSearchFocus(): void {
    this.isSearchMode.set(false);
  }

  resetSearchState(event?: Event): void {
    if (event) event.preventDefault();
    this.isSearchMode.set(false);
    this.hasSearched.set(false);
    this.currentQuery = '';
    this.results.set([]);
    this.currentPage.set('home'); // Ensure page state updates even if URL is already /home
    this.router.navigate(['/home']);
    this.selectedPlaylist.set(null);
    if (this.searchBar) {
      this.searchBar.clearQuery();
    }
  }

  // --- Auth Methods ---
  async login() {
    try {
      await this.authService.loginWithGoogle();
    } catch (e: any) {
      if (e.code === 'auth/cancelled-popup-request' || e.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user.');
      } else {
        console.error('Login error:', e);
      }
    }
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (e) {
      console.error(e);
    }
  }

  openSearchPage(): void {
    this.isSearchMode.set(true);
    this.router.navigate(['/search']);
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
    // Dynamic API URL for Localhost vs Live Domain (ganatube.in)
    const host = window.location.hostname;
    const adApiUrl = host === 'localhost' 
      ? 'http://localhost/manageads/api.php' 
      : 'https://manageads.ganatube.in/api.php';

    // Fetch Bottom Banner
    fetch(`${adApiUrl}?placeholder=bottom_player_banner`)
      .then(res => res.json())
      .then(data => {
        if (data && data.isActive) {
          this.sponsoredAd.set(data);
        }
      })
      .catch(err => console.error('Failed to load bottom banner', err));

    // Fetch In-Feed Banner
    fetch(`${adApiUrl}?placeholder=home_feed_banner`)
      .then(res => res.json())
      .then(data => {
        if (data && data.isActive) {
          this.inFeedAd.set(data);
        }
      })
      .catch(err => console.error('Failed to load in-feed banner', err));

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
    this.fetchHeroData(); // Fetch dynamic hero header from admin

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

  fetchHeroData(): void {
    const url = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost/manageads/managegt-api.php' : 'https://manageads.ganatube.in/managegt-api.php';
    fetch(`${url}?action=get_header&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          this.heroData.set(data);
        }
      })
      .catch(err => console.warn('Could not load custom header data:', err));
  }

  loadInitialShelves(language?: string): void {
    const lang = language || this.homeScreenLanguage();
    this.shelvesLoading.set(true);
    this.loadedShelves.set([]);

    // Fetch algorithmic dynamic shelves
    this.algorithmService.getVariableRewardShelves(lang).subscribe(algorithmicShelves => {
      if (language && language !== this.homeScreenLanguage()) return;
      
      // Fetch custom sections created by Admin in ManageGT
      this.youtubeApi.getCustomSections().subscribe((customData) => {
        if (language && language !== this.homeScreenLanguage()) return;
        
        const langCustomSections: any[] = customData[lang] || [];
        
        // Convert Custom Sections to ShelfDefinition format for the UI
        const customShelves: ShelfDefinition[] = langCustomSections.map(cs => ({
          title: cs.title,
          query: '', // We already have the songs, no need to query
          songs: cs.songs
        }));

        // Add Recently Played if available
        const recentPlays = this.userService.recentPlays();
        const recentShelves: ShelfDefinition[] = [];
        if (recentPlays && recentPlays.length > 0) {
          recentShelves.push({
            title: 'Recently Played',
            query: '',
            songs: recentPlays
          });
        }

        // Combine them: Recently Played FIRST, then Custom Admin Sections (instant), then Dynamic algorithmic shelves (slow API)
        this.allShelfDefinitions = [...recentShelves, ...customShelves, ...algorithmicShelves];
        
        const initialDefinitions = this.allShelfDefinitions.slice(0, 3);
        let loadedCount = 0;

        if (initialDefinitions.length === 0) {
          this.shelvesLoading.set(false);
          return;
        }

      initialDefinitions.forEach((def) => {
        if (def.songs && def.songs.length > 0) {
          // It's a custom section, already has songs!
          this.loadedShelves.update(shelvesList => {
            const updated = [...shelvesList];
            updated.push({ title: def.title, query: def.query, songs: def.songs! });
            return updated.sort((a, b) => {
              const idxA = this.allShelfDefinitions.findIndex(d => d.title === a.title);
              const idxB = this.allShelfDefinitions.findIndex(d => d.title === b.title);
              return idxA - idxB;
            });
          });
          loadedCount++;
          if (loadedCount >= initialDefinitions.length) {
            this.shelvesLoading.set(false);
            setTimeout(() => this.loadNextShelf(lang), 500);
          }
        } else {
          // Algorithmic shelf, needs fetching
          this.youtubeApi.searchMusic(def.query, 50).subscribe({
            next: (songs) => {
              if (language && language !== this.homeScreenLanguage()) {
                // Stale callback, just increment count to prevent hanging if it was the current one somehow
                loadedCount++;
                return; 
              }
              
              if (songs && songs.length > 0) {
                this.loadedShelves.update(shelvesList => {
                  const updated = [...shelvesList];
                  updated.push({ title: def.title, query: def.query, songs });
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
                setTimeout(() => this.loadNextShelf(language), 500);
              }
            },
            error: (err) => {
              console.error(`Failed to load shelf: ${def.title}`, err);
              if (language && language !== this.homeScreenLanguage()) {
                loadedCount++;
                return;
              }
              loadedCount++;
              if (loadedCount >= initialDefinitions.length) {
                this.shelvesLoading.set(false);
                setTimeout(() => this.loadNextShelf(language), 500);
              }
            }
          });
        }
      });
    });
    });
  }

  loadNextShelf(language?: string): void {
    const currentCount = this.loadedShelves().length;
    if (currentCount >= this.allShelfDefinitions.length || this.shelfLoading()) {
      return;
    }

    // Load up to 5 shelves at once
    const batchSize = 5;
    const nextDefs = this.allShelfDefinitions.slice(currentCount, currentCount + batchSize);
    
    this.loadingShelfTitle.set(nextDefs[0].title + (nextDefs.length > 1 ? ' & more...' : ''));
    this.shelfLoading.set(true);

    const observables = nextDefs.map(def => {
      if (def.songs && def.songs.length > 0) {
        return of(def.songs);
      } else {
        return this.youtubeApi.searchMusic(def.query, 50).pipe(
          // Catch errors for individual shelf loads so the whole batch doesn't fail
          catchError((err: any) => {
            console.error(`Failed to load shelf: ${def.title}`, err);
            return of(null);
          })
        );
      }
    });

    forkJoin(observables).subscribe({
      next: (results: any[]) => {
        if (language && language !== this.homeScreenLanguage()) return; // Ignore stale callback
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
          setTimeout(() => this.loadNextShelf(language), 1000);
        }
      },
      error: (err: any) => {
        console.error('Failed to load shelf batch', err);
        if (language && language !== this.homeScreenLanguage()) return; // Ignore stale callback
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
    if (!query) return;
    this.closeSearchPage();
    this.hasSearched.set(true);
    this.currentQuery = query;
    this.performSearch(query);
    
    // Sync listening preference to backend if logged in
    const user = this.authService.currentUser();
    if (user && user.email) {
      this.userService.trackListeningPreference(user.email, query, this.preferredLanguages());
    }
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

    // Parallax: fade out hero and zoom out as user scrolls
    const heroEl = document.querySelector('.hero-section') as HTMLElement;
    if (heroEl) {
      const heroHeight = heroEl.offsetHeight || 500;
      const scrollProgress = scrollOffset / heroHeight;
      const ratio = Math.min(scrollProgress * 1.5, 1);
      
      const imgContents = document.querySelectorAll('.hero-image-content img');
      imgContents.forEach((img) => {
        const imgEl = img as HTMLElement;
        const scale = Math.max(1 - (scrollProgress * 0.2), 0.8);
        const translateY = scrollOffset * 0.4;
        imgEl.style.transform = `translateY(${translateY}px) scale(${scale})`;
      });
      
      heroEl.style.opacity = `${1 - ratio}`;
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

  setLanguage(lang: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.router.navigate(['/language', lang.toLowerCase()]);
  }

  getHeroImage(lang: string): string {
    const dynamic = this.heroData()[lang];
    if (dynamic?.imageUrl) return dynamic.imageUrl;
    const langLower = lang.toLowerCase();
    const availableImages = ['hindi', 'english', 'punjabi', 'bhojpuri', 'bengali', 'haryanvi', 'tamil'];
    if (availableImages.includes(langLower)) {
      return `images/${langLower}-singers.png`;
    }
    return 'images/hindi-singers.png'; // fallback
  }

  getHeroTitle(lang: string): string {
    const dynamic = this.heroData()[lang];
    if (dynamic?.title) return dynamic.title;
    const titles: Record<string, string> = {
      'English': 'Global Essentials',
      'Hindi': 'Bollywood Blockbusters',
      'Punjabi': 'Punjabi Powerhouse',
      'Bhojpuri': 'Bhojpuri Chartbusters',
      'Bengali': 'Soulful Bengali',
      'Haryanvi': 'Haryanvi Dominance',
      'Tamil': 'Kollywood Supreme'
    };
    return titles[lang] || `${lang} Essentials`;
  }

  getHeroSubtitle(lang: string): string {
    const dynamic = this.heroData()[lang];
    if (dynamic?.subtitle) return dynamic.subtitle;
    const subtitles: Record<string, string> = {
      'English': 'EXPERIENCE THE BIGGEST INTERNATIONAL TRACKS STREAMING RIGHT NOW',
      'Hindi': 'DIVE INTO THE MOST TRENDING HINDI MELODIES AND CLUB ANTHEMS',
      'Punjabi': 'HIGH-ENERGY BEATS AND VOCALS THAT RULE THE CHARTS WORLDWIDE',
      'Bhojpuri': 'FEEL THE PULSE WITH THE MOST VIRAL BHOJPURI DANCE NUMBERS',
      'Bengali': 'IMMERSE YOURSELF IN THE RICH MUSICAL HERITAGE OF BENGAL',
      'Haryanvi': 'UNSTOPPABLE GROOVES AND REGIONAL HITS TAKING OVER THE NATION',
      'Tamil': 'DISCOVER TOP CHARTING TAMIL COMPOSITIONS AND BLOCKBUSTER HITS'
    };
    return subtitles[lang] || `DISCOVER THE LATEST AND GREATEST ${lang.toUpperCase()} HITS`;
  }

  explorePlaylist(lang: string): void {
    const dynamic = this.heroData()[lang];
    if (dynamic?.buttonLink) {
      const link = dynamic.buttonLink;
      if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        this.router.navigateByUrl(link);
      }
      return;
    }

    const langLower = lang.toLowerCase();
    const playlistSlug = langLower === 'english' ? '76069476' : `hero-${langLower}`;
    const targetPlaylist = this.allPlaylists().find(p => p.slug === playlistSlug || p.id === playlistSlug);
    
    if (targetPlaylist) {
      this.openPlaylist(targetPlaylist);
    } else {
      // Fallback if playlist not found
      this.onSuggestSearch(`${lang} Hits`);
    }
  }

  openPlaylist(playlist: PlaylistMeta): void {
    this.selectedPlaylist.set(playlist);
    this.currentPage.set('playlist');
    this.isSearchMode.set(false);
    this.router.navigate(['/playlist', playlist.id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openLikedSongs(): void {
    const likedSongs = this.userService.likedSongs().filter(song => typeof song !== 'string');
    if (likedSongs.length > 0) {
      const playlistMeta: PlaylistMeta = {
        id: 'liked-songs',
        title: 'Liked Songs',
        language: this.homeScreenLanguage(),
        coverImage: likedSongs[0].thumbnail || 'assets/default-playlist.jpg',
        preloadedSongs: likedSongs,
        searchQueries: []
      };
      this.selectedPlaylist.set(playlistMeta);
      this.currentPage.set('playlist');
      this.isSearchMode.set(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  closePlaylist(): void {
    this.selectedPlaylist.set(null);
    this.currentPage.set('home');
    this.router.navigate(['/home']);
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

  copyWebsiteLink() {
    navigator.clipboard.writeText('https://ganatube.in').then(() => {
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 2000);
    });
  }
}
