import { Component, OnInit, ViewChild, ElementRef, signal, ViewEncapsulation, HostListener, computed, inject, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
  import { LucideSearch, LucideUsers, LucideDownload, LucidePlay, LucideHome, LucideLibrary, LucideUser, LucideMessageSquare, LucideMusic, LucideShare2, LucideCheck, LucideFlame, LucideCompass, LucideMenu, LucideGift, LucideImage, LucideEdit3, LucideLogOut, LucideX, LucideRadio, LucideSparkles, LucideChevronDown, LucideHeart, LucideClock, LucideEye, LucideEyeOff } from '@lucide/angular';

import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { MusicPlayerComponent } from './components/music-player/music-player.component';
import { YtPlayerComponent } from './components/yt-player/yt-player.component';
import { FullScreenPlayerComponent } from './components/full-screen-player/full-screen-player.component';
import { TrackMenuComponent } from './components/track-menu/track-menu.component';
import { PlaylistMenuComponent } from './components/playlist-menu/playlist-menu';
import { SavePlaylistModalComponent } from './components/save-playlist-modal/save-playlist-modal';
import { ToastComponent } from './components/toast/toast.component';
import { ToastService } from './services/toast.service';
import { HttpClient } from '@angular/common/http';
import { YoutubeApiService, YouTubeSearchResult } from './services/youtube-api.service';
import { PlayerService, Track } from './services/player.service';
import { RoomService } from './services/room.service';
import { AlgorithmService, ShelfDefinition } from './services/algorithm.service';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { AnalyticsService } from './services/analytics.service';
import { AppStateService } from './services/app-state.service';
import { SearchHistoryService } from './services/search-history.service';
import { environment } from '../environments/environment';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, filter, catchError } from 'rxjs/operators';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, RouterModule, ActivatedRoute } from '@angular/router';
import { PAGE_CONTENT } from './data/static-pages';
import { PlaylistPageComponent } from './components/playlist-page/playlist-page.component';
import { AdvertisePageComponent } from './components/advertise-page/advertise-page.component';
import { AdBookingPageComponent } from './components/ad-booking-page/ad-booking-page.component';
import { AdTermsPageComponent } from './components/ad-terms-page/ad-terms-page.component';
import { AdProhibitedPageComponent } from './components/ad-prohibited-page/ad-prohibited-page.component';

import { ALL_PLAYLISTS, PlaylistMeta } from './data/playlists.data';
import { PwaService } from './services/pwa.service';
import { DomSanitizer, SafeResourceUrl, Meta, Title } from '@angular/platform-browser';
import { CarModePlayerComponent } from './components/car-mode-player/car-mode-player.component';
import { LibraryPageComponent } from './components/library-page/library-page';
import { FeedbackPopupComponent } from './components/feedback-popup/feedback-popup.component';
import { ShortsPageComponent } from './components/shorts-page/shorts-page.component';
import { DiscoveryPageComponent } from './components/discovery-page/discovery-page.component';
import { SpinWheelComponent } from './components/spin-wheel/spin-wheel.component';
import { OfflineLibraryComponent } from './components/offline-library/offline-library.component';
import { CuratedPlaylistsComponent } from './components/curated-playlists/curated-playlists';
  import { LanguageSelectModalComponent } from './components/language-select-modal/language-select-modal.component';
  import { LoginPromptModalComponent } from './components/login-prompt-modal/login-prompt-modal.component';
  import { PromoPopupModalComponent } from './components/promo-popup-modal/promo-popup-modal.component';
import { RoomsDiscoverComponent } from './components/rooms/rooms-discover/rooms-discover.component';
import { RoomViewComponent } from './components/rooms/room-view/room-view.component';
import { RoomFeaturesPopupComponent } from './components/room-features-popup/room-features-popup.component';
import { IntroVideoComponent } from './components/intro-video/intro-video.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { register as registerSwiperElements } from 'swiper/element/bundle';

registerSwiperElements();

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
    LucideSearch,
    LucideMusic,
    LucideUsers,
    LucideDownload,
    LucidePlay,
    LucideHome,
    LucideLibrary,
    LucideUser,
    LucideMessageSquare,
    LucideShare2,
    LucideCheck,
    LucideFlame,
    LucideCompass,
    LucideMenu,
    LucideGift,
    LucideImage,
    LucideEdit3,
    LucideLogOut,
    LucideX,
    LucideRadio,
    LucideSparkles,
    LucideChevronDown,
    LucideHeart,
    LucideClock,
    LucideEye,
    LucideEyeOff,
    SearchBarComponent,
    SearchResultsComponent,
    MusicPlayerComponent,
    YtPlayerComponent,
    FullScreenPlayerComponent,
    CarModePlayerComponent,
    TrackMenuComponent,
    PlaylistPageComponent,
    AdvertisePageComponent,
    AdBookingPageComponent,
    AdTermsPageComponent,
    AdProhibitedPageComponent,
    RouterModule,

    PlaylistMenuComponent,
    SavePlaylistModalComponent,
    ToastComponent,
    LibraryPageComponent,
    FeedbackPopupComponent,
    ShortsPageComponent,
    DiscoveryPageComponent,
    SpinWheelComponent,
    LucideGift,
    CuratedPlaylistsComponent,
    LanguageSelectModalComponent,
    LoginPromptModalComponent,
    PromoPopupModalComponent,
    RoomsDiscoverComponent,
    RoomViewComponent,
    RoomFeaturesPopupComponent,
    IntroVideoComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class App implements OnInit {
  @ViewChild(SearchBarComponent) searchBar!: SearchBarComponent;
  @ViewChild('spinWheel') spinWheel!: SpinWheelComponent;

  public pwaService = inject(PwaService);
  public analyticsService = inject(AnalyticsService);
  public roomService = inject(RoomService);

  openSpinWheel() {
    this.spinWheel?.open();
  }

  results = signal<YouTubeSearchResult[]>([]);
  isLoading = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  hasMoreSongs = signal<boolean>(true);
  noMoreResultsCount = 0;
  isFullScreenPlayerVisible = signal<boolean>(false);
  isCarModeVisible = signal<boolean>(false);
  apiKeyMissing = false;
  appVersion = 'v1.0.6';
  currentYear = new Date().getFullYear();
  isMobileMenuOpen = signal<boolean>(false);
  isRouteLoading = signal<boolean>(false);
  isRouteDone = signal<boolean>(false);

  showInstallModal = false;

  showLoginPrompt = signal<boolean>(false);

  closeInstallModal() {
    this.showInstallModal = false;
  }

  triggerInstall() {
    this.pwaService.installApp();
    this.showInstallModal = false;
  }

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
  homeScreenLanguage = signal<string>('English');
  showLanguageModal = signal<boolean>(false);
  isMobileView = signal<boolean>(false);

  // Playlists State
  customPlaylists = signal<PlaylistMeta[]>([]);
  
  // Track displayed video IDs to prevent duplicates on the home page
  displayedVideoIds = new Set<string>();
  
  allPlaylists = computed(() => {
    return [...this.customPlaylists(), ...ALL_PLAYLISTS];
  });
  
  selectedPlaylist = signal<PlaylistMeta | null>(null);
  ytPlaylistsForHome = signal<PlaylistMeta[]>([]);

  homePlaylists = computed(() => {
    // Show dynamic custom playlists and dynamic YTMusic playlists for the selected language
    const custom = this.customPlaylists().filter(p => p.language === this.homeScreenLanguage());
    const yt = this.ytPlaylistsForHome();
    return [...custom, ...yt];
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
  isNavbarHidden = signal<boolean>(false);
  isNavbarAutoHide = signal<boolean>(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('gt_navbar_autohide') !== 'false'
      : true
  );
  private lastScrollOffset = 0;

  toggleNavbarAutoHide(): void {
    const newVal = !this.isNavbarAutoHide();
    this.isNavbarAutoHide.set(newVal);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_navbar_autohide', newVal ? 'true' : 'false');
    }
    if (!newVal) {
      this.isNavbarHidden.set(false);
      this.toastService.show('Navbar pinned (Always visible)', 'info');
    } else {
      this.toastService.show('Auto-hide enabled (Hides on scroll)', 'info');
    }
  }

  isSearchMode = signal<boolean>(false);
  isSearchFocused = signal<boolean>(false);
  searchFilter = signal<'all' | 'songs' | 'albums' | 'playlists' | 'artists'>('all');
  artistResults = signal<{ name: string; artistId: string; thumb?: string }[]>([]);
  searchGenres = [
    // Moods & Vibes
    { title: 'Romance', color: 'linear-gradient(135deg, #FF416C, #FF4B2B)', emoji: '💕' },
    { title: 'Chill', color: 'linear-gradient(135deg, #11998E, #38EF7D)', emoji: '🧊' },
    { title: 'Party', color: 'linear-gradient(135deg, #8E2DE2, #4A00E0)', emoji: '🎉' },
    { title: 'Sad Songs', color: 'linear-gradient(135deg, #2C3E50, #4CA1AF)', emoji: '😢' },
    { title: 'Workout', color: 'linear-gradient(135deg, #f12711, #f5af19)', emoji: '💪' },
    { title: 'Sleep', color: 'linear-gradient(135deg, #0f0c29, #302b63)', emoji: '🌙' },
    { title: 'Devotional', color: 'linear-gradient(135deg, #F09819, #EDDE5D)', emoji: '🙏' },
    { title: 'Focus', color: 'linear-gradient(135deg, #355C7D, #6C5B7B)', emoji: '🎯' },
    // Regional
    { title: 'Bollywood', color: 'linear-gradient(135deg, #FC466B, #3F5EFB)', emoji: '🎬' },
    { title: 'Kollywood', color: 'linear-gradient(135deg, #00B4DB, #0083B0)', emoji: '🎵' },
    { title: 'Tollywood', color: 'linear-gradient(135deg, #F7971E, #FFD200)', emoji: '🌟' },
    { title: 'Punjabi', color: 'linear-gradient(135deg, #FF512F, #DD2476)', emoji: '🥁' },
    { title: 'Bhojpuri', color: 'linear-gradient(135deg, #f5af19, #f12711)', emoji: '🎤' },
    { title: 'Haryanvi', color: 'linear-gradient(135deg, #56ab2f, #a8e063)', emoji: '🌾' },
    { title: 'Marathi', color: 'linear-gradient(135deg, #ee0979, #ff6a00)', emoji: '🪘' },
    { title: 'Bengali', color: 'linear-gradient(135deg, #4776E6, #8E54E9)', emoji: '🎶' },
    // Global
    { title: 'Pop', color: 'linear-gradient(135deg, #FF005B, #8B008B)', emoji: '🎧' },
    { title: 'Hip Hop', color: 'linear-gradient(135deg, #F7971E, #FFD200)', emoji: '🔥' },
    { title: 'K-Pop', color: 'linear-gradient(135deg, #ff9a9e, #fecfef)', emoji: '🇰🇷' },
    { title: 'Indie', color: 'linear-gradient(135deg, #00C6FF, #0072FF)', emoji: '🎸' },
    { title: 'Lo-Fi', color: 'linear-gradient(135deg, #614385, #516395)', emoji: '📻' },
    { title: 'Classical', color: 'linear-gradient(135deg, #C9D6FF, #E2E2E2)', emoji: '🎻' },
    { title: 'EDM', color: 'linear-gradient(135deg, #00F260, #0575E6)', emoji: '🎛️' },
    { title: 'R&B', color: 'linear-gradient(135deg, #6a3093, #a044ff)', emoji: '🎷' }
  ];

  // Track currently loading playlist to prevent race conditions
  currentLoadingPlaylistId: string | null = null;

  @ViewChild('searchInput') searchInput!: ElementRef;
  ambientSearchBg = signal<string>('');

  // Dynamic algorithmic shelves for home recommendations
  allShelfDefinitions: ShelfDefinition[] = [];

  // Dynamic shelves signal holding loaded categories
  loadedShelves = signal<Array<{ title: string; query: string; songs: YouTubeSearchResult[] }>>([]);
  shelvesLoading = signal<boolean>(true);
  shelfLoading = signal<boolean>(false);
  loadingShelfTitle = signal<string>('');

  currentPage = signal<string>('home');

  isHomeFullyLoaded(): boolean {
    if (this.currentPage() !== 'home') return true;
    if (this.hasSearched() || this.isSearchMode()) return true;
    if (this.shelvesLoading() || this.shelfLoading()) return false;
    if (this.allShelfDefinitions.length === 0) return false;
    return this.loadedShelves().length >= this.allShelfDefinitions.length;
  }

  private sentinelObserver?: IntersectionObserver;

  @ViewChild('homeScrollSentinel') set sentinelRef(el: ElementRef<HTMLDivElement> | undefined) {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    if (el && el.nativeElement) {
      if (!this.sentinelObserver) {
        this.sentinelObserver = new IntersectionObserver((entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            if (this.currentPage() === 'home' && !this.hasSearched() && !this.isSearchMode()) {
              if (!this.shelfLoading() && !this.shelvesLoading() && this.loadedShelves().length < this.allShelfDefinitions.length) {
                this.loadNextShelf(this.homeScreenLanguage());
              }
            }
          }
        }, {
          root: null,
          rootMargin: '1000px 0px',
          threshold: 0
        });
      }
      this.sentinelObserver.observe(el.nativeElement);
    }
  }
  activeSocialTab = signal<'chat' | 'rooms'>('chat');
  linkCopied = false;
  pageContent = PAGE_CONTENT;

  // Sponsored Ad State
  sponsoredAd = signal<SponsoredAd | null>(null);
  inFeedAd = signal<SponsoredAd | null>(null);
  playerCoverAd = signal<SponsoredAd | null>(null);
  showAd = signal<boolean>(true);

  // Home feed dynamic chips
  dynamicChips = signal<string[]>(['All', 'Trending', 'New Releases', 'Romantic', 'Lofi Chill', 'Party Hits', 'Acoustic', 'Arijit Singh']);

  // Dynamic Hero Header Data
  heroData = signal<Record<string, { badge: string; title: string; subtitle: string; imageUrl: string; buttonText: string; buttonLink?: string }>>({});

  private manageApiUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost/manageads/managegt-api.php' : 'https://manageads.ganatube.in/managegt-api.php';

  showFeedbackPopup = signal<boolean>(false);

  carouselIndex = 0;
  private carouselInterval: any;

  private destroy$ = new Subject<void>();
  private http = inject(HttpClient);

  private hoverPreviewAudio: HTMLAudioElement | null = null;
  private hoverPreviewTimeout: any = null;

  onCardHover(track: YouTubeSearchResult | undefined, isHovering: boolean) {
    if (!track || typeof window === 'undefined') return;
    
    if (isHovering) {
      this.hoverPreviewTimeout = setTimeout(() => {
        if (this.hoverPreviewAudio) {
          this.hoverPreviewAudio.pause();
        }
        this.hoverPreviewAudio = new Audio();
        
        const apiUrl = window.location.hostname === 'localhost'
          ? 'http://localhost/manageads/stream.php'
          : 'https://manageads.ganatube.in/stream.php';
          
        this.hoverPreviewAudio.src = `${apiUrl}?id=${track.videoId}`;
        // Random start time between 30 and 80 seconds
        this.hoverPreviewAudio.currentTime = Math.floor(Math.random() * 50) + 30;
        this.hoverPreviewAudio.volume = 0.3; // Low volume for preview
        this.hoverPreviewAudio.play().catch(e => console.log('Hover preview play failed', e));
        
        setTimeout(() => {
          if (this.hoverPreviewAudio && this.hoverPreviewAudio.src.includes(track.videoId)) {
            this.hoverPreviewAudio.pause();
          }
        }, 5000); // 5 seconds preview limit
      }, 500); // 500ms delay to prevent triggering on quick swipes
    } else {
      clearTimeout(this.hoverPreviewTimeout);
      if (this.hoverPreviewAudio) {
        this.hoverPreviewAudio.pause();
        this.hoverPreviewAudio = null;
      }
    }
  }
  private location = inject(Location);
  private sanitizer = inject(DomSanitizer);
  public toastService = inject(ToastService);

  private readonly SEARCH_HISTORY_KEY = 'ganatube_search_history';

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getAdIframeUrl(placeholder: string): string {
    const isLocalhost = typeof window !== 'undefined' && window.location.origin.includes('localhost');
    const baseUrl = isLocalhost ? 'http://localhost/manageads' : 'https://manageads.ganatube.in';
    return `${baseUrl}/ad_iframe.php?placeholder=${placeholder}`;
  }

  safeHomeFeedAdUrl: SafeResourceUrl = this.getSafeUrl(this.getAdIframeUrl('home_feed_banner'));
  safeBottomPlayerAdUrl: SafeResourceUrl = this.getSafeUrl(this.getAdIframeUrl('bottom_player_banner'));
  safePlayerCoverAdUrl: SafeResourceUrl = this.getSafeUrl(this.getAdIframeUrl('player_cover_ad'));

  injectHeaderScript(customHtml: string): void {
    if (typeof window === 'undefined' || !customHtml) return;
    
    try {
      let cleanHtml = customHtml.trim();
      if (cleanHtml.includes('\\"') || cleanHtml.includes('\\r\\n') || cleanHtml.includes('\\n') || cleanHtml.includes("\\'")) {
        cleanHtml = cleanHtml
          .replace(/\\r\\n/g, '\n')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'");
      }

      const container = document.createElement('div');
      container.innerHTML = cleanHtml;
      
      Array.from(container.childNodes).forEach(node => {
        if (node.nodeName.toLowerCase() === 'script') {
          const originalScript = node as HTMLScriptElement;
          const newScript = document.createElement('script');
          
          Array.from(originalScript.attributes).forEach(attr => {
            const cleanVal = attr.value.replace(/^["']|["']$/g, '');
            newScript.setAttribute(attr.name, cleanVal);
          });
          
          if (originalScript.text) {
            newScript.text = originalScript.text;
          } else if (originalScript.innerHTML) {
            newScript.innerHTML = originalScript.innerHTML;
          }
          
          document.head.appendChild(newScript);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // If there are other tags (e.g. meta, link, noscript, style), append them directly
          document.head.appendChild(node.cloneNode(true));
        }
      });
    } catch (e) {
      console.error('Error injecting header script:', e);
    }
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

  // Random backgrounds for library boxes
  randomLikedThumbnail = signal<string | null>(null);
  randomRecentThumbnail = signal<string | null>(null);

  // Profile & Settings State
  get musicQuality() {
    return this.playerService.musicQuality;
  }
  preferredLanguages = signal<string[]>(['English', 'Hindi', 'Tamil', 'Punjabi']);
  
  isEditingUsername = signal<boolean>(false);
  isSavingUsername = signal<boolean>(false);
  newUsername = signal<string>('');
  currentAmbientBg = signal<string>('');
  
  profileBannerIndex = signal<number>(
    typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('gt_profile_banner') || '1', 10) : 1
  );

  changeProfileBanner() {
    const nextIndex = this.profileBannerIndex() === 1 ? 2 : 1;
    this.profileBannerIndex.set(nextIndex);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_profile_banner', nextIndex.toString());
    }
  }
  
  activeMenuTrack = signal<any | null>(null);
  activeMenuPosition = signal<{x: number, y: number} | null>(null);

  activePlaylistMenu = signal<any | null>(null);
  activePlaylistMenuPosition = signal<{x: number, y: number} | null>(null);
  showPlaylistModal = signal<boolean>(false);
  playlistModalTrack = signal<any | null>(null);
  newPlaylistName = signal<string>('');

  toggleMenu(track: any, event: MouseEvent) {
    event.stopPropagation();
    if (this.activeMenuTrack()?.videoId === track.videoId) {
      this.closeMenu();
    } else {
      if (event.type === 'contextmenu') {
        // Right-click: Position at mouse coordinates
        this.activeMenuPosition.set({ x: event.clientX, y: event.clientY });
      } else {
        // Left-click on button: Position relative to button
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        this.activeMenuPosition.set({ x: rect.right, y: rect.bottom });
      }
      this.activeMenuTrack.set(track);
    }
  }

  closeMenu() {
    this.activeMenuTrack.set(null);
    this.activeMenuPosition.set(null);
  }

  togglePlaylistMenu(playlist: any, event: MouseEvent) {
    event.stopPropagation();
    if (this.activePlaylistMenu()?.playlist_id === playlist.playlist_id && playlist.playlist_id) {
      this.closePlaylistMenu();
    } else if (this.activePlaylistMenu()?.name === playlist.name && !playlist.playlist_id) {
      this.closePlaylistMenu();
    } else {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      this.activePlaylistMenuPosition.set({ x: rect.right, y: rect.bottom });
      this.activePlaylistMenu.set(playlist);
    }
  }

  closePlaylistMenu() {
    this.activePlaylistMenu.set(null);
    this.activePlaylistMenuPosition.set(null);
  }

  // ── Shelf "More" Popup Modal State ─────────────────────────────────────────
  activeShelfModal = signal<{ title: string; query?: string; songs: any[] } | null>(null);
  isShelfModalMinimized = signal<boolean>(false);
  isShelfModalMaximized = signal<boolean>(false);
  shelfModalVisibleCount = signal<number>(12);
  isShelfModalLoadingMore = signal<boolean>(false);
  hasFetchedExtraShelfSongs = signal<boolean>(false);

  visibleShelfModalSongs = computed(() => {
    const modal = this.activeShelfModal();
    if (!modal || !modal.songs) return [];
    return modal.songs.slice(0, this.shelfModalVisibleCount());
  });

  openShelfModal(shelf: any) {
    if (!shelf) return;
    this.activeShelfModal.set({
      title: shelf.title,
      query: shelf.query || '',
      songs: [...(shelf.songs || [])]
    });
    this.shelfModalVisibleCount.set(12);
    this.isShelfModalLoadingMore.set(false);
    this.hasFetchedExtraShelfSongs.set(false);
    this.isShelfModalMinimized.set(false);
    this.isShelfModalMaximized.set(false);

    // Prevent background page from scrolling
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  closeShelfModal() {
    this.activeShelfModal.set(null);
    this.isShelfModalMinimized.set(false);
    this.isShelfModalMaximized.set(false);
    this.isShelfModalLoadingMore.set(false);

    // Restore background scrolling if full player is not open
    if (!this.isFullScreenPlayerVisible()) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  toggleMinimizeShelfModal() {
    this.isShelfModalMinimized.update(v => {
      const next = !v;
      if (next) {
        // Minimized to dock: restore background scrolling
        if (!this.isFullScreenPlayerVisible()) {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }
      } else {
        // Restored from dock: lock background scrolling
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }
      return next;
    });
  }

  toggleMaximizeShelfModal() {
    this.isShelfModalMaximized.update(v => !v);
  }

  onShelfModalScroll(event: Event) {
    const el = event.target as HTMLElement;
    if (!el || this.isShelfModalLoadingMore()) return;

    // Trigger when user is within 180px of the bottom
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom > 180) return;

    const modal = this.activeShelfModal();
    if (!modal || !modal.songs) return;

    const currentVisible = this.shelfModalVisibleCount();
    const totalCurrent = modal.songs.length;

    // Case 1: More songs already exist in the shelf songs list
    if (currentVisible < totalCurrent) {
      this.isShelfModalLoadingMore.set(true);
      setTimeout(() => {
        this.shelfModalVisibleCount.update(c => Math.min(c + 12, totalCurrent));
        this.isShelfModalLoadingMore.set(false);
      }, 160);
      return;
    }

    // Case 2: All current songs displayed, but query exists and extra hasn't been fetched yet
    if (modal.query && !this.hasFetchedExtraShelfSongs()) {
      this.isShelfModalLoadingMore.set(true);
      this.hasFetchedExtraShelfSongs.set(true);

      this.youtubeApi.searchMusic(modal.query, 40).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(newSongs => {
        this.isShelfModalLoadingMore.set(false);
        if (newSongs && newSongs.length > 0) {
          const existingIds = new Set(modal.songs.map((s: any) => s.videoId));
          const fresh = newSongs.filter((s: any) => s && s.videoId && !existingIds.has(s.videoId));
          if (fresh.length > 0) {
            const combined = [...modal.songs, ...fresh];
            this.activeShelfModal.update(m => m ? { ...m, songs: combined } : null);
            this.shelfModalVisibleCount.update(c => c + 12);

            // Also update the shelf in loadedShelves for richer home content
            this.loadedShelves.update(shelves =>
              shelves.map(s => s.title === modal.title ? { ...s, songs: combined } : s)
            );
          }
        }
      });
    }
  }

  playAllShelfModal() {
    const modal = this.activeShelfModal();
    if (modal && modal.songs && modal.songs.length > 0) {
      this.playerService.setQueue(modal.songs, 0);
    }
  }

  shuffleShelfModal() {
    const modal = this.activeShelfModal();
    if (modal && modal.songs && modal.songs.length > 0) {
      const shuffled = [...modal.songs].sort(() => Math.random() - 0.5);
      this.playerService.setQueue(shuffled, 0);
    }
  }

  addToQueue(track: any) {
    this.playerService.addToQueue(track);
    this.closeMenu();
  }

  playNext(track: any) {
    this.playerService.addNext(track);
    this.closeMenu();
  }

  shareTrack(track: any) {
    const url = `https://ganatube.in/watch?v=${track.videoId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      this.toastService.success('Link copied to clipboard!');
      this.analyticsService.recordShare(track);
    }
    this.closeMenu();
  }

  async toggleLikeTrack(track: any) {
    const user = this.authService.currentUser();
    if (user && user.email) {
      const added = await this.userService.toggleLike(user.email, track, this.userService.preferredLanguages());
      if (added) {
        this.toastService.success('Added to liked songs');
      } else {
        this.toastService.success('Removed from liked songs');
      }
    } else {
      this.toastService.info('Please login to like songs');
    }
    this.closeMenu();
  }

  openSaveToPlaylist(track: any) {
    this.playlistModalTrack.set(track);
    this.showPlaylistModal.set(true);
    this.closeMenu();
  }

  closePlaylistModal() {
    this.showPlaylistModal.set(false);
    this.playlistModalTrack.set(null);
    this.newPlaylistName.set('');
  }

  playCustomPlaylist(playlist: any) {
    if (playlist && playlist.tracks && playlist.tracks.length > 0) {
      this.playerService.setQueue(playlist.tracks, 0);
    } else {
      this.toastService.info('This playlist is empty.');
    }
  }

  newPlaylistIsPublic = signal<boolean>(true);

  async createAndAddToPlaylist() {
    const name = this.newPlaylistName().trim();
    if (!name) return;
    const track = this.playlistModalTrack();
    if (!track) return;
    const user = this.authService.currentUser();
    if (!user || !user.email) {
      this.toastService.error("Please log in to create playlists.");
      return;
    }
    
    const created = await this.userService.createPlaylist(user.email as string, name, this.newPlaylistIsPublic());
    if (created) {
      await this.userService.addToPlaylist(user.email as string, name, track);
      this.closePlaylistModal();
      this.toastService.success(`Playlist "${name}" created successfully`);
    } else {
      this.toastService.error("Failed to create playlist.");
    }
  }

  isLiked(track: any): boolean {
    if (!track) return false;
    return !!this.userService.likedSongs().find(s => 
      (typeof s === 'string' ? s === track.videoId : s.videoId === track.videoId)
    );
  }

  isInPlaylist(playlist: any, track: any): boolean {
    if (!track || !playlist) return false;
    return !!playlist.tracks.find((t: any) => t.videoId === track.videoId);
  }

  async saveUsername() {
    if (this.newUsername().trim()) {
      let newName = this.newUsername().trim();
      if (newName.length > 20) {
        this.toastService.error('Username cannot exceed 20 characters.');
        return;
      }
      const email = this.authService.currentUser()?.email;
      
      this.isSavingUsername.set(true);

      if (email) {
        const dbResult = await this.userService.updateUsernameInDB(email, newName);
        if (!dbResult.success) {
          this.toastService.error(dbResult.message || 'Username already taken or database error.');
          this.isSavingUsername.set(false);
          return;
        }
      }

      const success = await this.authService.updateUsername(newName);
      if (success) {
        this.isEditingUsername.set(false);
        this.userService.displayName.set(newName);
        this.toastService.success('Username saved successfully!');
      } else {
        this.toastService.error('Failed to update username. Please try again.');
      }
      
      this.isSavingUsername.set(false);
    }
  }

  toggleEditUsername() {
    this.isEditingUsername.set(!this.isEditingUsername());
    if (this.isEditingUsername()) {
      this.newUsername.set(this.userService.displayName() || this.authService.currentUser()?.displayName || '');
    }
  }

  getDisplayUsername(): string {
    const name = this.userService.displayName() || this.authService.currentUser()?.displayName || 'User';
    return name.length > 20 ? name.substring(0, 20) + '...' : name;
  }

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

  searchByGenre(genre: string) {
    if (this.searchBar) {
      this.searchBar.query = genre;
    }
    this.onSearch(genre);
  }

  // --- Search Integration ---
  trackByVideoId(index: number, track: any): string {
    return track.videoId;
  }

  shelfTrackBy(index: number, shelf: any): string {
    return shelf.title;
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
    private cdr: ChangeDetectorRef,
    public userService: UserService,
    public appState: AppStateService,
    public searchHistory: SearchHistoryService,
    private domSanitizer: DomSanitizer
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isRouteLoading.set(true);
        this.isRouteDone.set(false);
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isRouteLoading.set(false);
        this.isRouteDone.set(true);
        setTimeout(() => {
          if (this.isRouteDone()) this.isRouteDone.set(false);
        }, 500);
      }
    });

    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.email) {
        this.analyticsService.startTrackingTime(user.email, user.displayName || user.email);
      } else {
        this.analyticsService.stopTrackingTime();
        this.analyticsService.startGuestTracking();
      }
    });

    effect(() => {
      const track = this.playerService.currentTrack();
      if (track && track.title) {
        this.title.setTitle(`${track.title} - GanaTube`);
      } else {
        this.title.setTitle('GanaTube - Free Music Streaming');
      }
    });

    effect(() => {
      const trackToSave = this.appState.savePlaylistTrack();
      if (trackToSave) {
        this.openSaveToPlaylist(trackToSave);
        this.appState.savePlaylistTrack.set(null); // Reset after opening
      }
    }, { allowSignalWrites: true });

    // Dynamic chips effect based on currently playing track
    effect(() => {
      const track: any = this.playerService.currentTrack();
      if (track) {
        const title = track.title || track.snippet?.title || '';
        let channel = track.channelTitle || track.snippet?.channelTitle || '';
        
        if (channel.toLowerCase().includes('vevo') || channel.toLowerCase().includes('official')) {
          channel = channel.replace(/vevo/ig, '').replace(/official/ig, '').trim();
        }
        if (!channel) channel = 'Artist';

        // Keep 'All' as the first chip for resetting
        const chips = [
          'All',
          `More from ${channel}`,
          `${channel} Mix`,
          'Similar Songs',
          'Indie Pop',
          'Trending',
          'Chill Vibes'
        ];
        // Deduplicate and set
        this.dynamicChips.set([...new Set(chips)].slice(0, 8));
      } else {
        this.dynamicChips.set(['All', 'Trending', 'New Releases', 'Romantic', 'Lofi Chill', 'Party Hits', 'Acoustic', 'Arijit Singh']);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.email) {
        this.userService.loadProfile(user.email, user.displayName || '').then(profile => {
          if (profile) {
            this.userService.loadPlaylists(user.email as string);
            if (profile.preferred_languages && profile.preferred_languages.length > 0) {
              this.preferredLanguages.set(profile.preferred_languages);
            }
            this.algorithmService.syncFromBackend(profile.liked_songs, profile.listening_preferences);
            
            // Sync Firebase displayName to DB if it's missing in DB
            if (!this.userService.displayName() && user.displayName) {
              // Ensure we don't exceed the 20 chars limit for DB
              const cleanName = user.displayName.substring(0, 20);
              this.userService.updateUsernameInDB(user.email as string, cleanName, true).then(res => {
                if (res.success && res.display_name) {
                  this.userService.displayName.set(res.display_name);
                  // Update Firebase auth profile to keep it in sync
                  this.authService.updateUsername(res.display_name);
                } else if (res.success) {
                  this.userService.displayName.set(cleanName);
                }
              });
            }
            
            // If user refreshed on liked-songs or recently-played page, re-open now that profile is loaded
            if (this.router.url.includes('/playlist/liked-songs')) {
              this.openLikedSongs();
            } else if (this.router.url.includes('/playlist/recently-played')) {
              this.openRecentlyPlayed();
            }

            // Set random thumbnails for library boxes
            const liked = this.userService.likedSongs();
            if (liked && liked.length > 0) {
              const randSong = liked[Math.floor(Math.random() * liked.length)];
              const thumbUrl = typeof randSong === 'string' ? `https://i.ytimg.com/vi/${randSong}/maxresdefault.jpg` : (randSong.thumbnailHigh || randSong.thumbnail);
              this.randomLikedThumbnail.set(thumbUrl);
            }
            
            const recentPlays = this.userService.recentPlays();
            if (recentPlays && recentPlays.length > 0) {
              const randSong = recentPlays[Math.floor(Math.random() * recentPlays.length)];
              const thumbUrl = typeof randSong === 'string' ? `https://i.ytimg.com/vi/${randSong}/maxresdefault.jpg` : (randSong.thumbnailHigh || randSong.thumbnail);
              this.randomRecentThumbnail.set(thumbUrl);
            }
          }
        });
      } else if (user === null) {
        this.userService.likedSongs.set([]);
        this.userService.listeningPreferences.set([]);
        this.algorithmService.syncFromBackend([], []);
      }
    }, { allowSignalWrites: true });

    this.fetchCustomPlaylists();

    if (typeof window !== 'undefined') {
      window.addEventListener('offline', () => {
        this.toastService.error('You are currently offline. Check your internet connection.');
      });
      window.addEventListener('online', () => {
        this.toastService.success('Back online!');
      });
    }
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Mark that user has navigated within the app (useful for back button logic)
      if (this.currentPage() !== 'home' || event.id > 1) {
        (window as any).hasNavigatedInApp = true;
      }

      let url = event.urlAfterRedirects.split('/')[1] || 'home';
      url = url.split('?')[0]; // Ignore query params
      this.analyticsService.setCurrentPage(event.urlAfterRedirects);
      
      // Clear tracking if navigating away from playlist page
      if (url !== 'playlist') {
        this.currentLoadingPlaylistId = null;
      }
      
      if (url === 'playlist') {
        let playlistId = event.urlAfterRedirects.split('/')[2] || '';
        try { playlistId = decodeURIComponent(playlistId); } catch { /* keep raw segment */ }
        if (playlistId === 'liked-songs') {
          this.openLikedSongs();
          return;
        }
        if (playlistId === 'recently-played') {
          this.openRecentlyPlayed();
          return;
        }
        const targetPlaylist = this.allPlaylists().find(p => p.id === playlistId);
        if (targetPlaylist) {
          this.selectedPlaylist.set(targetPlaylist);
          this.updateSEO(
            `${targetPlaylist.title} - GanaTube`,
            `Listen to ${targetPlaylist.title} and other trending playlists for free on GanaTube.`
          );
          this.currentPage.set('playlist');
          this.isSearchMode.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (playlistId) {
          this.currentLoadingPlaylistId = playlistId; // Set tracking ID
          if (playlistId.startsWith('artist-')) {
            if (!(this.currentPage() === 'playlist' && this.selectedPlaylist()?.id === playlistId)) {
              let artistName = playlistId.replace('artist-', '');
              try { artistName = decodeURIComponent(artistName); } catch { /* already raw */ }
              this.openArtistPage(artistName, '');
            }
          } else if (playlistId.startsWith('pl_') || playlistId.startsWith('cp-')) {
            this.fetchPublicPlaylist(playlistId, '');
          } else if (playlistId.startsWith('MPREb_')) {
            this.isLoading.set(true);
            this.youtubeApi.getAlbum(playlistId).pipe(takeUntil(this.destroy$)).subscribe(album => {
              this.isLoading.set(false);
              // Only open if this is still the playlist we are trying to load
              if (this.currentLoadingPlaylistId !== playlistId) return;
              
              if (album) {
                album.is_owner = false;
                album.is_public = true;
                album.language = 'English';
                if (!album.searchQueries) album.searchQueries = [];
                this.openPlaylist(album);
              } else {
                this.router.navigate(['/home']);
              }
            });
          } else if (playlistId.startsWith('PL') || playlistId.startsWith('VL') || playlistId.startsWith('RD') || playlistId.startsWith('OL')) {
            this.isLoading.set(true);
            this.youtubeApi.getYTPlaylist(playlistId).pipe(takeUntil(this.destroy$)).subscribe(playlist => {
              this.isLoading.set(false);
              // Only open if this is still the playlist we are trying to load
              if (this.currentLoadingPlaylistId !== playlistId) return;
              
              if (playlist) {
                playlist.is_owner = false;
                playlist.is_public = true;
                playlist.language = 'English';
                if (!playlist.searchQueries) playlist.searchQueries = [];
                this.openPlaylist(playlist);
              } else {
                this.router.navigate(['/home']);
              }
            });
          } else {
            this.router.navigate(['/home']);
          }
        }
        return;
      } else if (event.urlAfterRedirects.startsWith('/shorts')) {
        this.currentPage.set('shorts');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.isFullScreenPlayerVisible.set(false);
        return;
      } else if (event.urlAfterRedirects.startsWith('/rooms')) {
        const parts = event.urlAfterRedirects.split('/');
        if (parts.length > 2 && parts[2]) {
          this.currentPage.set('rooms-view');
        } else {
          this.currentPage.set('rooms');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.isFullScreenPlayerVisible.set(false);
        return;
      } else if (event.urlAfterRedirects.startsWith('/release-notes') || event.urlAfterRedirects.startsWith('/advertise') || event.urlAfterRedirects.startsWith('/ad-booking') || event.urlAfterRedirects.startsWith('/ad-terms') || event.urlAfterRedirects.startsWith('/ad-prohibited')) {
        this.currentPage.set('home');
        this.router.navigate(['/home'], { replaceUrl: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;

      } else if (event.urlAfterRedirects.startsWith('/managegt') || event.urlAfterRedirects.startsWith('/gtanalytic')) {
        this.currentPage.set(event.urlAfterRedirects.split('/')[1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else if (url === 'language') {
        const langParam = event.urlAfterRedirects.split('/')[2];
        if (langParam) {
          const capitalizedLang = langParam.charAt(0).toUpperCase() + langParam.slice(1);
          if (this.availableLanguages.includes(capitalizedLang)) {
            this.homeScreenLanguage.set(capitalizedLang);
            localStorage.setItem('homeScreenLanguage', capitalizedLang);

            // Put the selected language at the front of preferredLanguages
            let currentPrefs = [...this.preferredLanguages()];
            if (currentPrefs.includes(capitalizedLang)) {
              currentPrefs = currentPrefs.filter(l => l !== capitalizedLang);
            }
            currentPrefs.unshift(capitalizedLang);
            this.preferredLanguages.set(currentPrefs);

            // Save to Database if user is logged in
            const userEmail = this.authService.currentUser()?.email;
            if (userEmail) {
              this.userService.syncProfile({
                email: userEmail,
                preferred_languages: currentPrefs,
                liked_songs: this.userService.likedSongs(),
                recent_plays: this.userService.recentPlays(),
                listening_preferences: this.userService.listeningPreferences()
              });
            }
          }
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
          this.closeFullScreenPlayer();
          this.openArtistPage(artistParam, artistParam);
          this.updateSEO(
            `${artistParam} Songs & Hits - GanaTube`,
            `Listen to ${artistParam}'s top hits, latest songs, and popular albums for free on GanaTube.`
          );
        } else {
          this.currentPage.set('search');
        }
        this.isSearchMode.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else if (url === 'user') {
        const parts = event.urlAfterRedirects.split('/');
        const username = parts[2];
        const playlistId = parts[3];
        
        if (playlistId) {
          this.fetchPublicPlaylist(playlistId, username);
        }
        return;
      } else if (url.startsWith('pl_')) {
        this.fetchPublicPlaylist(url, '');
        return;
      }

      // Check if it's a valid static page or one of our main pages
      if (['home', 'profile', 'search', 'library', 'socials', 'admin', 'managegt', 'gtanalytic', 'discovery', 'offline', 'curated-playlists'].includes(url) || this.pageContent[url]) {
        this.currentPage.set(url);
        
        if (url === 'search') {
          this.isSearchMode.set(true);
          const urlObj = new URL('http://localhost' + event.urlAfterRedirects);
          const q = urlObj.searchParams.get('q');
          if (q) {
             if (this.currentQuery !== q || !this.hasSearched()) {
                this.executeSearchApi(q);
             }
             if (this.searchBar && this.searchBar.query !== q) {
                this.searchBar.query = q;
             }
          }
        } else {
          this.isSearchMode.set(false);
        }
        
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.currentPage.set('home');
        this.isSearchMode.set(false);
        this.router.navigate(['/']);
      }

      if (url === 'home' || url === 'search' || url === 'profile' || url === 'library' || url === 'socials' || url === 'discovery' || url === 'offline' || url === 'curated-playlists') {
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
        if (playlistId === 'liked-songs') {
          if (!this.selectedPlaylist()) {
            this.openLikedSongs();
          }
        } else {
          if (playlistId.startsWith('artist-')) {
            if (!this.selectedPlaylist()) {
              this.openArtistPage(playlistId.replace('artist-', ''), '');
            }
          } else {
            const targetPlaylist = this.allPlaylists().find(p => p.id === playlistId);
            if (targetPlaylist && !this.selectedPlaylist()) {
              this.selectedPlaylist.set(targetPlaylist);
            }
          }
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
    
    // Close track menu
    if (this.activeMenuTrack()) {
      if (!target.closest('.track-menu-container') && !target.closest('.track-options-btn')) {
        this.closeMenu();
      }
    }
    
    // Close playlist menu
    if (this.activePlaylistMenu()) {
      if (!target.closest('.track-menu-container') && !target.closest('.desktop-lib-more') && !target.closest('.mobile-lib-more') && !target.closest('.playlist-options-btn')) {
        this.closePlaylistMenu();
      }
    }
  }

  openLibraryPage() {
    this.closeMobileMenu();
    this.router.navigate(['/library']);
  }

  openOfflineLibraryPage() {
    this.closeMobileMenu();
    this.router.navigate(['/offline']);
  }

  openSocialsPage() {
    this.closeMobileMenu();
    this.router.navigate(['/socials']);
  }

  openProfilePage() {
    this.closeMobileMenu();
    this.router.navigate(['/profile']);
  }

  openAdvertisePage(): void {
    this.router.navigate(['/home']);
    this.isSearchMode.set(false);
  }

  setMusicQuality(quality: 'Auto' | 'Data Saver' | 'Standard' | 'High' | 'Max'): void {
    this.playerService.setMusicQuality(quality);
  }

  onInactivityMinutesChange(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 1 && val <= 360) {
      this.playerService.setInactivityMinutes(val);
    }
  }

  onInactivityMinutesInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 1 && val <= 360) {
      this.playerService.inactivityMinutes.set(val);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gt_inactivity_minutes', String(val));
      }
      this.playerService.recordUserActivity();
    }
  }

  setInactivityPreset(minutes: number): void {
    this.playerService.setInactivityMinutes(minutes);
  }

  onSearchFocus(): void {
    this.isSearchMode.set(false);
  }

  resetSearchState(event?: Event): void {
    this.cachedHeroEl = null;
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

  setSearchFilter(filter: 'all' | 'songs' | 'albums' | 'playlists' | 'artists'): void {
    this.searchFilter.set(filter);
    if (this.currentQuery) {
      this.executeSearchApi(this.currentQuery);
    } else if (filter === 'playlists') {
      this.executeSearchApi('');
    }
  }

  fetchSearchArtists(query: string): void {
    const qLower = (query || '').toLowerCase().trim();
    const curatedMatches: { name: string; artistId: string; thumb?: string }[] = [];
    for (const lang of Object.keys(this.topArtistsByLang)) {
      for (const artist of this.topArtistsByLang[lang]) {
        if (artist.name.toLowerCase().includes(qLower) || qLower.includes(artist.name.toLowerCase())) {
          if (!curatedMatches.some(m => m.name.toLowerCase() === artist.name.toLowerCase())) {
            curatedMatches.push({ name: artist.name, artistId: '', thumb: artist.image });
          }
        }
      }
    }
    if (curatedMatches.length > 0) {
      this.artistResults.set(curatedMatches);
    }

    this.youtubeApi.searchArtists(query).pipe(takeUntil(this.destroy$)).subscribe({
      next: (artists) => {
        if (artists && artists.length > 0) {
          const merged = [...artists];
          for (const c of curatedMatches) {
            if (!merged.some(m => m.name.toLowerCase() === c.name.toLowerCase())) {
              merged.push(c);
            }
          }
          this.artistResults.set(merged);
        }
      },
      error: () => {}
    });
  }

  openArtistPage(artistOrName: string, fallbackName: string = ''): void {
    if (!artistOrName) return;
    const looksLikeId = /^UC[\w-]{20,}$/.test(artistOrName);

    const fallbackToArtistPlaylist = (artistName: string) => {
      this.isLoading.set(true);
      this.youtubeApi.searchMusic(artistName + ' songs', 40, 'song').pipe(takeUntil(this.destroy$)).subscribe({
        next: (songs) => {
          this.isLoading.set(false);
          if (songs && songs.length > 0) {
            const playlistMeta: PlaylistMeta = {
              id: `artist-${artistName}`,
              title: artistName,
              language: '',
              coverImage: songs[0]?.thumbnailHigh || songs[0]?.thumbnail || 'ganatubenewlogo.png',
              preloadedSongs: songs,
              searchQueries: [],
              creator: 'Artist',
              is_public: true,
              is_owner: false
            };
            this.openPlaylist(playlistMeta);
          } else {
            this.performSearch(artistName + ' songs');
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.performSearch(artistName + ' songs');
        }
      });
    };

    const loadById = (artistId: string, name: string) => {
      const id = `artist-${artistId}`;
      this.currentLoadingPlaylistId = id;
      this.isLoading.set(true);

      this.youtubeApi.getArtist(artistId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (artist) => {
          if (this.currentLoadingPlaylistId !== id) return;
          this.isLoading.set(false);

          if (artist && artist.name && artist.songs && artist.songs.length > 0) {
            const playlistMeta: PlaylistMeta = {
              id: id,
              title: artist.name || name || 'Artist',
              language: '',
              coverImage: artist.thumb || artist.songs[0]?.thumbnailHigh || artist.songs[0]?.thumbnail || 'ganatubenewlogo.png',
              preloadedSongs: artist.songs,
              searchQueries: [],
              creator: 'Artist',
              is_public: true,
              is_owner: false
            };
            this.openPlaylist(playlistMeta);
          } else if (name) {
            fallbackToArtistPlaylist(name);
          } else {
            this.toastService.error('Artist not found');
          }
        },
        error: () => {
          if (this.currentLoadingPlaylistId !== id) return;
          if (name) {
            fallbackToArtistPlaylist(name);
          } else {
            this.isLoading.set(false);
            this.toastService.error('Error loading artist');
          }
        }
      });
    };

    if (looksLikeId) {
      loadById(artistOrName, fallbackName);
    } else {
      // Name given — try resolve to artistId first, otherwise create artist playlist directly
      this.youtubeApi.searchArtists(artistOrName).pipe(takeUntil(this.destroy$)).subscribe({
        next: (artists) => {
          if (artists && artists.length > 0 && artists[0].artistId) {
            loadById(artists[0].artistId, artists[0].name || artistOrName);
          } else {
            fallbackToArtistPlaylist(artistOrName);
          }
        },
        error: () => {
          fallbackToArtistPlaylist(artistOrName);
        }
      });
    }
  }

  getAmbientSearchBg(): string {
    return this.ambientSearchBg();
  }

  onAmbientBgFound(thumbnailUrl: string): void {
    this.ambientSearchBg.set(thumbnailUrl);
  }

  // --- Auth Methods ---
  isLoggingIn = false;

  async login() {
    if (this.isLoggingIn) return;
    this.isLoggingIn = true;
    try {
      await this.authService.loginWithGoogle();
    } catch (e: any) {
      if (e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user.');
      } else if (e?.code === 'auth/popup-blocked') {
        this.toastService.error("Popup blocked! Please click the ❌ icon on the right side of your URL bar, select 'Always allow', and try logging in again.", 15000);
      } else {
        console.error('Login error:', e);
        this.toastService.error('Failed to login. Please try again.');
      }
    } finally {
      this.isLoggingIn = false;
    }
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (e) {
      console.error(e);
    }
  }

  openShortsPage() {
    this.closeMobileMenu();
    this.router.navigate(['/shorts/play']);
  }

  openDiscoveryPage() {
    this.closeMobileMenu();
    this.router.navigate(['/discovery']);
  }

  openCuratedPlaylistsPage() {
    this.closeMobileMenu();
    this.router.navigate(['/curated-playlists']);
  }

  openRoomsPage() {
    this.closeMobileMenu();
    const info = this.roomService.currentRoomInfo();
    if (info) {
      this.router.navigate(['/rooms', info.roomId]);
    } else {
      this.router.navigate(['/rooms']);
    }
  }


  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
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
    
    // Sync URL with the playing track when opening the full player
    const currentTrack = this.playerService.currentTrack();
    if (currentTrack) {
      this.location.replaceState('/play?v=' + currentTrack.videoId);
    }
  }

  closeFullScreenPlayer(): void {
    this.isFullScreenPlayerVisible.set(false);
    document.body.style.overflow = '';
  }

  toggleCarMode() {
    this.isCarModeVisible.set(!this.isCarModeVisible());
  }

  closeCarMode() {
    this.isCarModeVisible.set(false);
  }

  ngOnInit(): void {
    // Detect mobile view
    this.isMobileView.set(window.innerWidth <= 768);

    // Auto-show language select popup on mobile every session
    if (this.isMobileView()) {
      setTimeout(() => {
        if (this.currentPage() === 'home' && !this.isSearchMode() && !this.hasSearched()) {
          this.showLanguageModal.set(true);
        }
      }, 1500);
    }

    // Check PWA Install Prompt every 2 hours
    if (!this.pwaService.isInstalledPWA()) {
      const lastPrompt = localStorage.getItem('lastInstallPromptShown');
      const now = Date.now();
      if (!lastPrompt || (now - parseInt(lastPrompt, 10)) > 2 * 60 * 60 * 1000) {
        // Show the prompt
        setTimeout(() => {
          this.showInstallModal = true;
          localStorage.setItem('lastInstallPromptShown', now.toString());
        }, 3000); // Wait 3 seconds after reload to show it so it's not jarring
      }
    }

    // Load saved language if available
    const savedLang = localStorage.getItem('homeScreenLanguage');
    if (savedLang && this.availableLanguages.includes(savedLang)) {
      this.homeScreenLanguage.set(savedLang);
    }

    // Dynamic API URL for Localhost vs Live Domain (ganatube.in)
    const host = window.location.hostname;
    const adApiUrl = host === 'localhost' 
      ? 'http://localhost/manageads/api.php' 
      : 'https://manageads.ganatube.in/api.php';

    // Combined Ads Fetch: 4 requests → 1 (Performance Optimization)
    fetch(`${adApiUrl}?action=app_ads`)
      .then(res => res.json())
      .then(data => {
        if (data && data.ads) {
          const bottom = data.ads['bottom_player_banner'];
          if (bottom && bottom.isActive) this.sponsoredAd.set(bottom);
          const inFeed = data.ads['home_feed_banner'];
          if (inFeed && inFeed.isActive) this.inFeedAd.set(inFeed);
          const cover = data.ads['player_cover_ad'];
          if (cover && cover.isActive) this.playerCoverAd.set(cover);
        }
        if (data && Array.isArray(data.header_scripts)) {
          data.header_scripts.forEach((script: any) => {
            if (script && script.custom_code) {
              this.injectHeaderScript(script.custom_code);
            }
          });
        }
      })
      .catch(err => console.error('Failed to load ads', err));

    this.apiKeyMissing = false;

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const videoId = params.get('v') || params.get('play');
      if (videoId) {
        // 1. Check if the user was already playing this song before refreshing
        let savedTrack: Track | null = null;
        if (typeof localStorage !== 'undefined') {
          try {
            const raw = localStorage.getItem('gt_last_track');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.videoId === videoId && parsed.title && !parsed.title.includes('Playing from link') && !parsed.title.includes('Loading Track')) {
                savedTrack = parsed;
              }
            }
          } catch (e) {}
        }

        if (savedTrack) {
          if (this.playerService.currentTrack()?.videoId !== videoId) {
            this.playerService.playTrack(savedTrack);
          } else {
            const cur = this.playerService.currentTrack();
            if (cur && (!cur.title || cur.title.includes('Loading Track') || cur.title.includes('Playing from link'))) {
              this.playerService.updateTrackInfo(videoId, savedTrack.title, savedTrack.channelTitle);
            }
          }
          return;
        }

        // 2. Fetch exact video details by ID
        this.youtubeApi.getVideoDetails([videoId]).subscribe({
          next: (res) => {
            if (res && res.length > 0 && res[0].title && !res[0].title.includes('Playing from link') && !res[0].title.includes('Loading Track')) {
              if (this.playerService.currentTrack()?.videoId !== videoId) {
                this.playerService.playTrack(res[0]);
              } else {
                this.playerService.updateTrackInfo(videoId, res[0].title, res[0].channelTitle);
              }
            } else {
              this.fetchFallbackOEmbedAndPlay(videoId);
            }
          },
          error: () => {
            this.fetchFallbackOEmbedAndPlay(videoId);
          }
        });
      }
    });

    this.loadInitialShelves();
    this.startCarouselTimer();
    this.fetchHeroData(); // Fetch dynamic hero header from admin
  }

  private fetchFallbackOEmbedAndPlay(videoId: string) {
    let fallbackTitle = 'Loading Track...';
    let fallbackArtist = 'GanaTube';

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('gt_last_track');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.videoId === videoId && parsed.title && !parsed.title.includes('Playing from link') && !parsed.title.includes('Loading Track')) {
            fallbackTitle = parsed.title;
            fallbackArtist = parsed.channelTitle;
          }
        }
      } catch (e) {}
    }

    if (this.playerService.currentTrack()?.videoId !== videoId) {
      this.playerService.playTrack({
        videoId: videoId,
        title: fallbackTitle,
        channelTitle: fallbackArtist,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        thumbnailHigh: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        publishedAt: new Date().toISOString()
      });
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    this.http.get<any>(oembedUrl).pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      if (data && data.title) {
        let title = data.title.replace(/ - Topic/g, '').replace(/\[Official.*?\]/gi, '').replace(/\(Official.*?\)/gi, '').trim();
        let channelTitle = data.author_name || 'YouTube Music';
        if (typeof document !== 'undefined') {
          try {
            const txt = document.createElement('textarea');
            txt.innerHTML = title;
            title = txt.value;
            const txt2 = document.createElement('textarea');
            txt2.innerHTML = channelTitle;
            channelTitle = txt2.value;
          } catch (e) {}
        }
        this.playerService.updateTrackInfo(videoId, title, channelTitle);
      }
    });

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

    // Trigger feedback popup once per session after 60s if not submitted
    setTimeout(() => {
      if (!localStorage.getItem('gt_feedback_submitted')) {
        this.showFeedbackPopup.set(true);
      }
    }, 60000);

    // Login prompt popup — once every 12 hours for guests only
    setTimeout(() => {
      const user = this.authService.currentUser();
      // Skip if another popup is already open to avoid stacking
      if (user === null && !this.showInstallModal && !this.showLanguageModal()) {
        const lastPrompt = parseInt(localStorage.getItem('gt_login_prompt_shown') || '0', 10);
        const twelveHours = 12 * 60 * 60 * 1000;
        if (!lastPrompt || Date.now() - lastPrompt > twelveHours) {
          this.showLoginPrompt.set(true);
          localStorage.setItem('gt_login_prompt_shown', Date.now().toString());
        }
      }
    }, 10000);
  }

  fetchHeroData(): void {
    this.youtubeApi.getAppInitHeader().subscribe(data => {
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        this.heroData.set(data);
      }
    });
  }

  loadInitialShelves(language?: string): void {
    const lang = language || this.homeScreenLanguage();
    this.shelvesLoading.set(true);
    this.shelfLoading.set(false);
    this.loadedShelves.set([]);

    // Fetch dynamic YTMusic playlists for this language
    this.youtubeApi.searchMusic(`${lang} top hit songs playlist`, 6, 'playlist').subscribe({
      next: (results) => {
        const mapped: PlaylistMeta[] = results.map(r => ({
          id: r.videoId,
          title: r.title,
          language: lang,
          coverImage: r.thumbnailHigh || r.thumbnail,
          searchQueries: [],
          creator: r.channelTitle
        }));
        this.ytPlaylistsForHome.set(mapped);
      },
      error: () => {
        this.ytPlaylistsForHome.set([]);
      }
    });

    // Fetch algorithmic dynamic shelves
    this.displayedVideoIds.clear();
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
          songs: cs.songs,
          type: 'custom'
        }));

        // Extract 'Trending' and 'Suggested for You' correctly
        const trendingShelf = algorithmicShelves.length > 0 ? [algorithmicShelves[0]] : [];
        const suggestedShelf = algorithmicShelves.length > 1 ? [algorithmicShelves[1]] : [];
        const restOfAlgorithmicShelves = algorithmicShelves.length > 2 ? algorithmicShelves.slice(2) : [];

        // Save a reference to all pool songs for offline suggestions
        const offlinePool = customShelves.flatMap(s => s.songs || []);
        
        // Populate offline suggestions directly in 'Suggested for You' to avoid API call
        if (suggestedShelf.length > 0 && offlinePool.length > 0) {
          // Keep track of recently suggested to avoid repeats
          let recentSuggested: string[] = [];
          try {
            recentSuggested = JSON.parse(localStorage.getItem('gt_recent_suggested') || '[]');
          } catch(e) {}
          
          // Filter out recently suggested songs to give fresh recommendations
          let freshPool = offlinePool.filter(s => !recentSuggested.includes(s.videoId));
          if (freshPool.length < 10) {
            freshPool = offlinePool; // Reset if we run out of fresh songs
            recentSuggested = [];
          }
          
          // Shuffle and pick top 15
          const shuffledPool = [...freshPool].sort(() => 0.5 - Math.random()).slice(0, 15);
          
          // Save new batch to recent
          const newRecent = [...recentSuggested, ...shuffledPool.map(s => s.videoId)].slice(-50); // Keep last 50
          try {
            localStorage.setItem('gt_recent_suggested', JSON.stringify(newRecent));
          } catch(e) { console.warn('localStorage full'); }

          suggestedShelf[0].songs = shuffledPool;
          suggestedShelf[0].type = 'custom'; // Mark as custom so it doesn't fetch
        }

        this.allShelfDefinitions = [
          ...trendingShelf,
          ...suggestedShelf,
          ...restOfAlgorithmicShelves,
          ...customShelves
        ];
        
        const initialDefinitions = this.allShelfDefinitions.slice(0, 7);
        let loadedCount = 0;

        if (initialDefinitions.length === 0) {
          this.shelvesLoading.set(false);
          return;
        }

      initialDefinitions.forEach((def) => {
        if (def.songs && def.songs.length > 0) {
          // Custom section, already has songs!
          
          let dedupedSongs = def.songs.filter(s => {
            if (!s || !s.videoId) return false;
            // Never deduplicate custom shelves, always show what the admin curated
            if (def.type === 'custom') return true;
            
            if (this.displayedVideoIds.has(s.videoId)) return false;
            this.displayedVideoIds.add(s.videoId);
            return true;
          });
          
          this.loadedShelves.update(shelvesList => {
            // Guard against duplicate sections (e.g. after PWA resume)
            if (shelvesList.some(s => s.title === def.title)) return shelvesList;
            const updated = [...shelvesList];
            updated.push({ title: def.title, query: def.query, songs: dedupedSongs });
            return updated.sort((a, b) => {
              const idxA = this.allShelfDefinitions.findIndex(d => d.title === a.title);
              const idxB = this.allShelfDefinitions.findIndex(d => d.title === b.title);
              return idxA - idxB;
            });
          });
          loadedCount++;
          if (loadedCount >= initialDefinitions.length) {
            this.shelvesLoading.set(false);
          }
        } else {
          // Algorithmic shelf, needs fetching
          const fetchObservable = def.type === 'trending' 
            ? this.youtubeApi.getTrendingMusic(lang, 12)
            : this.youtubeApi.searchMusic(def.query, 15);

          fetchObservable.subscribe({
            next: (songs) => {
              if (language && language !== this.homeScreenLanguage()) {
                // Stale callback, just increment count to prevent hanging if it was the current one somehow
                loadedCount++;
                if (loadedCount >= initialDefinitions.length) {
                  this.shelvesLoading.set(false);
                }
                return; 
              }
              
              if (songs && songs.length > 0) {
                if (def.title === 'Suggested for You') {
                  songs = songs.sort(() => 0.5 - Math.random());
                }
                
                let dedupedSongs = songs.filter(s => {
                  if (!s || !s.videoId) return false;
                  if (def.type === 'custom') return true;
                  if (this.displayedVideoIds.has(s.videoId)) return false;
                  this.displayedVideoIds.add(s.videoId);
                  return true;
                });
                
                this.loadedShelves.update(shelvesList => {
                  // Guard against duplicate sections (e.g. after PWA resume)
                  if (shelvesList.some(s => s.title === def.title)) return shelvesList;
                  const updated = [...shelvesList];
                  updated.push({ title: def.title, query: def.query, songs: dedupedSongs });
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
              if (language && language !== this.homeScreenLanguage()) {
                loadedCount++;
                if (loadedCount >= initialDefinitions.length) {
                  this.shelvesLoading.set(false);
                }
                return;
              }
              loadedCount++;
              if (loadedCount >= initialDefinitions.length) {
                this.shelvesLoading.set(false);
              }
            }
          });
        }
      });
    });
    });
  }

  loadNextShelf(language?: string): void {
    if (this.shelfLoading()) {
      return;
    }

    // Title-based pending list — immune to section insertions (e.g. 'Recently Played')
    const loadedTitles = new Set(this.loadedShelves().map(s => s.title));
    const pendingDefs = this.allShelfDefinitions.filter(d => !loadedTitles.has(d.title));
    if (pendingDefs.length === 0 || this.loadedShelves().length >= this.allShelfDefinitions.length) {
      return;
    }

    // Load 3 shelves at a time for smoother lazy loading
    const batchSize = 3;
    const nextDefs = pendingDefs.slice(0, batchSize);
    
    this.loadingShelfTitle.set(nextDefs[0].title + (nextDefs.length > 1 ? ' & more...' : ''));
    this.shelfLoading.set(true);

    const observables = nextDefs.map(def => {
      if (def.songs && def.songs.length > 0) {
        return of(def.songs);
      } else {
        const fetchObservable = def.type === 'trending'
          ? this.youtubeApi.getTrendingMusic(language || this.homeScreenLanguage(), 12)
          : this.youtubeApi.searchMusic(def.query, 15);

        return fetchObservable.pipe(
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
        if (language && language !== this.homeScreenLanguage()) {
           return; // Ignore stale callback
        }
        const newShelves: any[] = [];
      results.forEach((songs: any, index: number) => {
        if (songs && songs.length > 0) {
          
          if (nextDefs[index].title === 'Suggested for You') {
            songs = songs.sort(() => 0.5 - Math.random());
          }
          
          let dedupedSongs = songs.filter((s: any) => {
            if (!s || !s.videoId) return false;
            if (this.displayedVideoIds.has(s.videoId)) return false;
            this.displayedVideoIds.add(s.videoId);
            return true;
          });

          newShelves.push({
            title: nextDefs[index].title,
            query: nextDefs[index].query,
            songs: dedupedSongs
          });
        }
      });    
        
        if (newShelves.length > 0) {
          this.loadedShelves.update(shelves => {
            // Guard against duplicate sections
            const existing = new Set(shelves.map(s => s.title));
            const toAdd = newShelves.filter(s => !existing.has(s.title));
            return toAdd.length > 0 ? [...shelves, ...toAdd] : shelves;
          });
        }
        this.shelfLoading.set(false);
        // Note: Automatic recursive loading removed to allow scroll-based lazy loading
      },
      error: (err: any) => {
        console.error('Failed to load shelf batch', err);
        if (language && language !== this.homeScreenLanguage()) return; // Ignore stale callback
        this.shelfLoading.set(false);
      }
    });
  }

  onSearch(query: string): void {
    const q = query.trim();
    if (!q) return;
    this.analyticsService.setLastSearch(q);
    this.searchHistory.add(q);
    this.executeSearchApi(q);
    this.performSearch(q);
  }

  onSuggestSearch(query: string): void {
    if (!query) return;
    if (query !== 'All') {
      this.analyticsService.setLastSearch(query);
    }
    
    // If not "All", execute search directly on the home page instead of routing
    if (query !== 'All') {
      this.executeSearchApi(query);
    } else {
      this.resetSearchState(new Event('click'));
    }
    
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
    if (track && track.videoId) {
      this.analyticsService.recordSearchClick(track.videoId, track.title || '');
      this.analyticsService.recordSearchPlay(track.videoId);
    }

    if (track.videoId.startsWith('pl_') || track.type === 'community-playlist') {
      // It's a community playlist
      this.currentLoadingPlaylistId = track.videoId;
      this.fetchPublicPlaylist(track.videoId, track.channelTitle);
      return;
    }

    if (track.type === 'album') {
      this.currentLoadingPlaylistId = track.videoId;
      this.isLoading.set(true);
      this.youtubeApi.getAlbum(track.videoId).pipe(takeUntil(this.destroy$)).subscribe(album => {
        this.isLoading.set(false);
        if (this.currentLoadingPlaylistId !== track.videoId) return;
        
        if (album) {
          album.is_owner = false;
          album.is_public = true;
          album.language = 'English';
          if (!album.searchQueries) album.searchQueries = [];
          this.openPlaylist(album);
        }
      });
      return;
    }

    if (track.type === 'playlist') {
      this.currentLoadingPlaylistId = track.videoId;
      this.isLoading.set(true);
      this.youtubeApi.getYTPlaylist(track.videoId).pipe(takeUntil(this.destroy$)).subscribe(playlist => {
        this.isLoading.set(false);
        if (this.currentLoadingPlaylistId !== track.videoId) return;
        
        if (playlist) {
          playlist.is_owner = false;
          playlist.is_public = true;
          playlist.language = 'English';
          if (!playlist.searchQueries) playlist.searchQueries = [];
          this.openPlaylist(playlist);
        }
      });
      return;
    }

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
    if (!query) return;
    this.router.navigate(['/search'], { queryParams: { q: query } });
  }

  executeSearchApi(query: string): void {
    this.currentQuery = query;
    this.analyticsService.setLastSearch(query);
    this.lazyLoadPage = 0;
    this.noMoreResultsCount = 0;
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.results.set([]);
    this.hasMoreSongs.set(true);

    if (this.searchFilter() === 'albums') {
      this.youtubeApi.searchMusic(query, 50, 'album').pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.results.set(res);
          this.isLoading.set(false);
          this.analyticsService.recordSearch(query, 'albums', (res || []).length);
        },
        error: () => {
          this.results.set([]);
          this.isLoading.set(false);
          this.analyticsService.recordSearch(query, 'albums', 0);
        },
      });
      return;
    }

    if (this.searchFilter() === 'playlists') {
      // Fetch Community Playlists & YouTube Playlists in parallel
      const url = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost/manageads/playlist-api.php' : 'https://manageads.ganatube.in/playlist-api.php';
      
      const communityPromise = fetch(`${url}?action=getAllPublicPlaylists&q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            return data.data.map((pl: any) => ({
              videoId: pl.playlist_id,
              title: pl.playlist_name,
              thumbnail: (pl.songs && pl.songs.length > 0 && pl.songs[0].thumbnail) ? pl.songs[0].thumbnail : 'ganatubenewlogo.png',
              thumbnailHigh: (pl.songs && pl.songs.length > 0 && pl.songs[0].thumbnailHigh) ? pl.songs[0].thumbnailHigh : 'ganatubenewlogo.png',
              channelTitle: pl.owner,
              publishedAt: pl.created_at,
              type: 'community-playlist'
            }));
          }
          return [];
        }).catch(() => []);

      const ytPromise = new Promise<YouTubeSearchResult[]>((resolve) => {
        this.youtubeApi.searchMusic(query, 50, 'playlist').pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => resolve(res),
          error: () => resolve([])
        });
      });

      Promise.all([communityPromise, ytPromise]).then(([communityResults, ytResults]) => {
        if (this.currentQuery !== query) return;
        // Interleave or just concat
        const totalList = [...communityResults, ...ytResults];
        this.results.set(totalList);
        this.isLoading.set(false);
        this.analyticsService.recordSearch(query, 'playlists', totalList.length);
      });
      return;
    }

    if (this.searchFilter() === 'artists') {
      this.isLoading.set(true);
      this.artistResults.set([]);
      this.results.set([]);

      // 1. Fetch from backend artist-search API
      const backendArtistPromise = new Promise<{ name: string; artistId: string; thumb?: string }[]>((resolve) => {
        this.youtubeApi.searchArtists(query).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => resolve(res || []),
          error: () => resolve([])
        });
      });

      // 2. Fetch from songs search as guaranteed fallback
      const songsPromise = new Promise<YouTubeSearchResult[]>((resolve) => {
        this.youtubeApi.searchMusic(query, 30, 'song').pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => resolve(res || []),
          error: () => resolve([])
        });
      });

      Promise.all([backendArtistPromise, songsPromise]).then(([apiArtists, songs]) => {
        if (this.currentQuery !== query) return;

        // Extract artists from songs
        const songArtistNames = new Set<string>();
        const fallbackArtistsFromSongs: { name: string; artistId: string; thumb?: string }[] = [];
        for (const s of songs || []) {
          let cName = (s.channelTitle || '').trim()
            .replace(/\s*-\s*Topic$/i, '')
            .replace(/\s*VEVO\s*/gi, '')
            .replace(/Official/gi, '')
            .trim();
          if (cName && !songArtistNames.has(cName.toLowerCase()) && cName.toLowerCase() !== 'artist' && cName.toLowerCase() !== 'various artists') {
            songArtistNames.add(cName.toLowerCase());
            fallbackArtistsFromSongs.push({
              name: cName,
              artistId: '',
              thumb: s.thumbnailHigh || s.thumbnail || ''
            });
          }
        }

        // Check curated top artists in local data (topArtistsByLang)
        const qLower = (query || '').toLowerCase().trim();
        const curatedMatches: { name: string; artistId: string; thumb?: string }[] = [];
        for (const lang of Object.keys(this.topArtistsByLang)) {
          for (const artist of this.topArtistsByLang[lang]) {
            if (artist.name.toLowerCase().includes(qLower) || qLower.includes(artist.name.toLowerCase())) {
              if (!curatedMatches.some(m => m.name.toLowerCase() === artist.name.toLowerCase())) {
                curatedMatches.push({ name: artist.name, artistId: '', thumb: artist.image });
              }
            }
          }
        }

        // Merge: apiArtists -> curatedMatches -> fallbackArtistsFromSongs
        const mergedList: { name: string; artistId: string; thumb?: string }[] = [];
        const seenNames = new Set<string>();

        const addCandidate = (item: { name: string; artistId: string; thumb?: string }) => {
          if (!item || !item.name) return;
          const key = item.name.toLowerCase().trim();
          if (!seenNames.has(key)) {
            seenNames.add(key);
            mergedList.push(item);
          }
        };

        (apiArtists || []).forEach(addCandidate);
        curatedMatches.forEach(addCandidate);
        fallbackArtistsFromSongs.forEach(addCandidate);

        this.artistResults.set(mergedList);
        this.results.set(songs || []);
        this.isLoading.set(false);
        this.analyticsService.recordSearch(query, 'artists', mergedList.length);
      });
      return;
    }

    // Default YouTube Search (Songs / All)
    if (this.searchFilter() === 'all') {
      // Optimized streaming: render Songs the moment they arrive, then enrich
      // with Albums & Playlists in the background instead of blocking on all 4 requests.
      let songsList: YouTubeSearchResult[] = [];
      let albumsList: YouTubeSearchResult[] = [];
      let plsList: YouTubeSearchResult[] = [];

      const merge = () => {
        const topPlaylist = plsList[0] || null;
        const restPlaylists = plsList.slice(1);
        const combined = topPlaylist
          ? [topPlaylist, ...songsList, ...albumsList, ...restPlaylists]
          : [...songsList, ...albumsList, ...plsList];
        this.results.set(combined);
      };

      // 1. Songs first — fastest perceived results
      this.youtubeApi.searchMusic(query, 50, 'song').pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          if (this.currentQuery !== query) return; // stale response guard
          songsList = res || [];
          this.hasMoreSongs.set(songsList.length >= 40);
          merge();
          this.isLoading.set(false);
          this.analyticsService.recordSearch(query, 'songs', songsList.length);
        },
        error: () => {
          if (this.currentQuery !== query) return;
          songsList = [];
          merge();
          this.isLoading.set(false);
        },
      });

      // 4. Artist matches (with images)
      this.fetchSearchArtists(query);

      // 2. Album matches
      const albumsPromise = new Promise<YouTubeSearchResult[]>((resolve) => {
        this.youtubeApi.searchMusic(query, 20, 'album').pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => resolve(res),
          error: () => resolve([])
        });
      });

      // 3. Playlist matches (community + YT Music)
      const playlistUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost/manageads/playlist-api.php' : 'https://manageads.ganatube.in/playlist-api.php';

      const communityPlaylistPromise = fetch(`${playlistUrl}?action=getAllPublicPlaylists&q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data && data.data.length > 0) {
            return data.data.slice(0, 6).map((pl: any) => ({
              videoId: pl.playlist_id,
              title: pl.playlist_name,
              thumbnail: (pl.songs && pl.songs.length > 0 && pl.songs[0].thumbnail) ? pl.songs[0].thumbnail : 'ganatubenewlogo.png',
              thumbnailHigh: (pl.songs && pl.songs.length > 0 && pl.songs[0].thumbnailHigh) ? pl.songs[0].thumbnailHigh : 'ganatubenewlogo.png',
              channelTitle: pl.owner,
              publishedAt: pl.created_at,
              type: 'community-playlist'
            })) as YouTubeSearchResult[];
          }
          return [] as YouTubeSearchResult[];
        }).catch(() => [] as YouTubeSearchResult[]);

      const ytPlaylistsPromise = new Promise<YouTubeSearchResult[]>((resolve) => {
        this.youtubeApi.searchMusic(query, 12, 'playlist').pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => resolve((res || []).map(r => ({ ...r, type: 'playlist' }))),
          error: () => resolve([])
        });
      });

      Promise.all([albumsPromise, communityPlaylistPromise, ytPlaylistsPromise]).then(([albums, communityPls, ytPls]) => {
        if (this.currentQuery !== query) return; // stale response guard
        albumsList = albums;
        plsList = [...communityPls, ...ytPls];
        merge();
      });
    } else {
      // Songs-only filter
      this.youtubeApi.searchMusic(query, 50, 'song').pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.results.set(res || []);
          this.hasMoreSongs.set((res || []).length >= 40);
          this.isLoading.set(false);
        },
        error: () => {
          this.results.set([]);
          this.isLoading.set(false);
        },
      });
    }
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

  private scrollRafId: number | null = null;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    // Debounce scroll handler via requestAnimationFrame for buttery smooth scrolling
    if (this.scrollRafId !== null) return;
    this.scrollRafId = requestAnimationFrame(() => {
      this.scrollRafId = null;
      this.handleScroll();
    });
  }

  private cachedHeroEl: HTMLElement | null = null;
  private cachedHeroImgs: HTMLElement[] = [];
  private lastScrolledState: boolean | null = null;

  private handleScroll(): void {
    const scrollOffset = document.documentElement.scrollTop || document.body.scrollTop;
    
    // Only update signal when value actually changes
    const isNowScrolled = scrollOffset > 50;
    if (this.lastScrolledState !== isNowScrolled) {
      this.lastScrolledState = isNowScrolled;
      this.isScrolled.set(isNowScrolled);
    }

    // Auto-hide Navbar logic on scroll
    if (this.isNavbarAutoHide() && !this.isMobileMenuOpen() && !this.isSearchMode()) {
      const delta = scrollOffset - this.lastScrollOffset;
      if (Math.abs(delta) > 8) {
        if (delta > 0 && scrollOffset > 70) {
          // Scrolling down into feed -> hide navbar
          if (!this.isNavbarHidden()) {
            this.isNavbarHidden.set(true);
          }
        } else if (delta < 0 || scrollOffset <= 50) {
          // Scrolling up (down-scroll gesture) or near top -> show navbar
          if (this.isNavbarHidden()) {
            this.isNavbarHidden.set(false);
          }
        }
      }
    } else if (this.isNavbarHidden()) {
      this.isNavbarHidden.set(false);
    }
    this.lastScrollOffset = scrollOffset;

    // Parallax: use cached DOM references
    if (!this.cachedHeroEl) {
      this.cachedHeroEl = document.querySelector('.hero-section') as HTMLElement;
      if (this.cachedHeroEl) {
        this.cachedHeroImgs = Array.from(document.querySelectorAll('.hero-image-content img')) as HTMLElement[];
      }
    }
    
    if (this.cachedHeroEl) {
      const heroHeight = this.cachedHeroEl.offsetHeight || 500;
      const scrollProgress = scrollOffset / heroHeight;
      const ratio = Math.min(scrollProgress * 1.5, 1);
      
      for (let i = 0; i < this.cachedHeroImgs.length; i++) {
        const scale = Math.max(1 - (scrollProgress * 0.2), 0.8);
        const translateY = scrollOffset * 0.4;
        this.cachedHeroImgs[i].style.transform = `translateY(${translateY}px) scale(${scale})`;
      }
      
      this.cachedHeroEl.style.opacity = `${1 - ratio}`;
    }

    if (this.isLoading() || this.isLazyLoading() || this.shelfLoading() || this.shelvesLoading()) {
      return;
    }

    const pos = scrollOffset + window.innerHeight;
    const max = document.documentElement.scrollHeight;
    
    // True infinite scroll: trigger much earlier (2500px before bottom)
    if (pos >= max - 2500) {
      if (this.hasSearched()) {
        this.loadMoreResults();
      } else if (this.currentPage() === 'home' && this.loadedShelves().length < this.allShelfDefinitions.length) {
        this.loadNextShelf(this.homeScreenLanguage());
      }
    }
  }

  setLanguage(lang: string, event?: Event): void {
    this.cachedHeroEl = null;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.router.navigate(['/language', lang.toLowerCase()]);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.isMobileView.set(window.innerWidth <= 768);
  }

  openLanguageModal(): void {
    this.showLanguageModal.set(true);
  }

  closeLanguageModal(): void {
    this.showLanguageModal.set(false);
  }

  onLanguageSelect(lang: string): void {
    this.closeLanguageModal();
    this.setLanguage(lang);
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
    
    const targetUrl = `/playlist/${encodeURIComponent(playlist.id)}`;
    if (!this.router.url.includes(targetUrl)) {
      this.router.navigate(['/playlist', playlist.id]);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openCustomPlaylist(pl: any): void {
    const email = this.authService.currentUser()?.email || 'user';
    const username = email.split('@')[0];
    const playlistId = pl.playlist_id || pl.id;
    
    // Create temporary PlaylistMeta
    const playlistMeta: PlaylistMeta = {
      id: playlistId,
      title: pl.name,
      language: this.homeScreenLanguage(),
      coverImage: pl.tracks.length > 0 && pl.tracks[0].thumbnailHigh ? pl.tracks[0].thumbnailHigh : 
                 (pl.tracks.length > 0 && pl.tracks[0].thumbnail ? pl.tracks[0].thumbnail : 'ganatubenewlogo.png'),
      preloadedSongs: pl.tracks,
      searchQueries: [],
      creator: pl.owner || (this.authService.currentUser()?.displayName || username),
      is_public: pl.is_public,
      is_owner: pl.is_owner !== undefined ? pl.is_owner : true,
      is_saved: pl.is_saved,
      playCount: pl.play_count || 0
    };
    
    this.selectedPlaylist.set(playlistMeta);
    this.currentPage.set('playlist');
    this.isSearchMode.set(false);
    
    const targetUrl = `/playlist/${encodeURIComponent(playlistId)}`;
    if (!this.router.url.includes(targetUrl)) {
      this.router.navigate(['/playlist', playlistId]);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async fetchPublicPlaylist(playlistId: string, username: string) {
    // Wait for auth to initialize if it's currently undefined (loading)
    if (this.authService.currentUser() === undefined) {
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (this.authService.currentUser() !== undefined) {
            clearInterval(interval);
            resolve(true);
          }
        }, 50);
        // Timeout after 3 seconds just in case
        setTimeout(() => {
          clearInterval(interval);
          resolve(false);
        }, 3000);
      });
    }

    const email = this.authService.currentUser()?.email || '';
    // Ensure we track this load
    this.currentLoadingPlaylistId = playlistId;
    
    try {
      const url = this.userService['apiUrl'].replace('user-api.php', 'playlist-api.php');
      const response = await fetch(`${url}?action=getPublicPlaylist&playlist_id=${playlistId}&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      // If user navigated or clicked another playlist while loading, ignore this result
      if (this.currentLoadingPlaylistId !== playlistId) return;
      
      if (data.status === 'success' && data.data) {
        const pl = data.data;
        const playlistMeta: PlaylistMeta = {
          id: pl.playlist_id,
          title: pl.playlist_name,
          language: this.homeScreenLanguage(),
          coverImage: pl.songs && pl.songs.length > 0 && pl.songs[0].thumbnailHigh ? pl.songs[0].thumbnailHigh : 
                     (pl.songs && pl.songs.length > 0 && pl.songs[0].thumbnail ? pl.songs[0].thumbnail : 'ganatubenewlogo.png'),
          preloadedSongs: pl.songs || [],
          searchQueries: [],
          creator: (email && pl.owner_email === email) ? (this.authService.currentUser()?.displayName || pl.owner) : pl.owner,
          is_public: pl.is_public,
          is_owner: (email && pl.owner_email === email) ? true : false,
          playCount: pl.play_count || 0
        };
        
        this.selectedPlaylist.set(playlistMeta);
        this.currentPage.set('playlist');
        this.isSearchMode.set(false);
        
        const targetUrl = `/playlist/${playlistId}`;
        if (!this.router.url.includes(targetUrl)) {
          this.router.navigate(['/playlist', playlistId]);
        }
      } else {
        // Fallback if not found or private
        if (this.router.url.includes(playlistId)) {
          this.router.navigate(['/home']);
        }
        this.toastService.error("Playlist not found or is private");
      }
    } catch(e) {
      if (this.currentLoadingPlaylistId !== playlistId) return;
      
      if (this.router.url.includes(playlistId)) {
        this.router.navigate(['/home']);
      }
      this.toastService.error("Error loading playlist");
    }
  }

  isAdminPage(): boolean {
    const page = this.currentPage();
    return page === 'managegt' || page === 'gtanalytic';
  }

  likedSongsCount(): number {
    return this.userService.likedSongs().length;
  }

  recentPlaysCount(): number {
    return this.userService.recentPlays ? this.userService.recentPlays().length : 0;
  }

  openLikedSongs(): void {
    const rawLiked = [...this.userService.likedSongs()].reverse();
    const likedSongs = rawLiked.map(song => {
      if (typeof song === 'string') {
        return {
          videoId: song,
          title: 'Loading...',
          channelTitle: 'GanaTube',
          thumbnail: `https://i.ytimg.com/vi/${song}/mqdefault.jpg`,
          thumbnailHigh: `https://i.ytimg.com/vi/${song}/maxresdefault.jpg`,
          publishedAt: ''
        };
      }
      // Always upgrade thumbnailHigh to maxresdefault for best quality
      const s = {...song};
      if (s.videoId) {
        s.thumbnailHigh = `https://i.ytimg.com/vi/${s.videoId}/maxresdefault.jpg`;
      }
      return s;
    });
    const playlistMeta: PlaylistMeta = {
      id: 'liked-songs',
      title: 'Liked Songs',
      language: this.homeScreenLanguage(),
      coverImage: likedSongs.length > 0 && likedSongs[0].thumbnail ? likedSongs[0].thumbnail : 'ganatubenewlogo.png',
      preloadedSongs: likedSongs,
      searchQueries: []
    };
    this.selectedPlaylist.set(playlistMeta);
    this.currentPage.set('playlist');
    this.isSearchMode.set(false);
    
    // Fetch missing details
    const missingIds = rawLiked.filter(s => typeof s === 'string') as string[];
    if (missingIds.length > 0) {
      this.youtubeApi.getVideoDetails(missingIds).subscribe(details => {
        if (details && details.length > 0) {
          const current = this.selectedPlaylist();
          if (current?.id === 'liked-songs') {
            const detailsMap = new Map(details.map(d => [d.videoId, d]));
            const updatedSongs = current.preloadedSongs!.map(s => {
              if (s.title === 'Loading...' && detailsMap.has(s.videoId)) {
                return detailsMap.get(s.videoId)!;
              }
              return s;
            });
            this.selectedPlaylist.set({
              ...current,
              preloadedSongs: updatedSongs
            });
          }
        }
      });
    }
    
    const targetUrl = '/playlist/liked-songs';
    if (!this.router.url.includes(targetUrl)) {
      this.router.navigate(['/playlist', 'liked-songs']);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openRecentlyPlayed(): void {
    const rawRecent = this.userService.recentPlays();
    const recentPlays = rawRecent.map(song => {
      if (typeof song === 'string') {
        return {
          videoId: song,
          title: 'Loading...',
          channelTitle: 'GanaTube',
          thumbnail: `https://i.ytimg.com/vi/${song}/mqdefault.jpg`,
          thumbnailHigh: `https://i.ytimg.com/vi/${song}/maxresdefault.jpg`,
          publishedAt: ''
        };
      }
      const s = {...song};
      if (s.videoId) {
        s.thumbnailHigh = `https://i.ytimg.com/vi/${s.videoId}/maxresdefault.jpg`;
      }
      return s;
    });
    const playlistMeta: PlaylistMeta = {
      id: 'recently-played',
      title: 'Recently Played',
      language: this.homeScreenLanguage(),
      coverImage: recentPlays.length > 0 && recentPlays[0].thumbnail ? recentPlays[0].thumbnail : 'ganatubenewlogo.png',
      preloadedSongs: recentPlays,
      searchQueries: []
    };
    this.selectedPlaylist.set(playlistMeta);
    this.currentPage.set('playlist');
    this.isSearchMode.set(false);
    
    // Fetch missing details
    const missingIds = rawRecent.filter(s => typeof s === 'string') as string[];
    if (missingIds.length > 0) {
      this.youtubeApi.getVideoDetails(missingIds).subscribe(details => {
        if (details && details.length > 0) {
          const current = this.selectedPlaylist();
          if (current?.id === 'recently-played') {
            const detailsMap = new Map(details.map(d => [d.videoId, d]));
            const updatedSongs = current.preloadedSongs!.map(s => {
              if (s.title === 'Loading...' && detailsMap.has(s.videoId)) {
                return detailsMap.get(s.videoId)!;
              }
              return s;
            });
            this.selectedPlaylist.set({
              ...current,
              preloadedSongs: updatedSongs
            });
          }
        }
      });
    }
    
    const targetUrl = '/playlist/recently-played';
    if (!this.router.url.includes(targetUrl)) {
      this.router.navigate(['/playlist', 'recently-played']);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closePlaylist(): void {
    this.selectedPlaylist.set(null);
    if ((window as any).hasNavigatedInApp) {
      this.location.back();
    } else {
      this.currentPage.set('home');
      this.router.navigate(['/home']);
    }
  }


  loadMoreResults(): void {
    if (!this.currentQuery || this.isLazyLoading()) {
      return;
    }

    this.isLazyLoading.set(true);
    this.lazyLoadPage++;

    // Generate query variations for paginated mock feel
    let queryVariation = this.currentQuery;
    const variations = ['music', 'song', 'audio', 'lyrical', 'hits', 'official', 'new', 'trending'];
    if (this.lazyLoadPage > 0) {
      const idx = (this.lazyLoadPage - 1) % variations.length;
      queryVariation = `${this.currentQuery} ${variations[idx]}`;
    }

    this.youtubeApi.searchMusic(queryVariation, 50).pipe(takeUntil(this.destroy$)).subscribe({
      next: (newItems) => {
        const currentItems = this.results();
        const existingIds = new Set(currentItems.map(item => item.videoId));
        const uniqueNewItems = newItems.filter(item => !existingIds.has(item.videoId));

        if (uniqueNewItems.length === 0) {
          this.noMoreResultsCount++;
          if (this.noMoreResultsCount >= 2) {
            this.hasMoreSongs.set(false);
          }
        } else {
          this.noMoreResultsCount = 0;
          this.results.set([...currentItems, ...uniqueNewItems]);
        }
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
    this.sentinelObserver?.disconnect();
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
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
