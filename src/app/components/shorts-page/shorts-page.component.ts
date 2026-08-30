import { Component, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild, HostListener, NgZone } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';
import { UserService } from '../../services/user.service';
import { AlgorithmService } from '../../services/algorithm.service';
import { ShortsAlgorithmService } from '../../services/shorts-algorithm.service';
import { HeartBurstService } from '../../services/heart-burst.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { LucideHeart, LucideShare2, LucidePlay, LucidePause, LucideMoreVertical, LucideChevronLeft, LucideMusic, LucideLoader2, LucideSearch, LucideX, LucideFlame } from '@lucide/angular';

interface ShortItem extends YouTubeSearchResult {
  dropStartTime: number;
  isLiked?: boolean;
}

declare var window: any;

@Component({
  selector: 'app-shorts-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideHeart, LucideShare2, LucidePlay, LucidePause, LucideMoreVertical, LucideChevronLeft, LucideMusic, LucideLoader2, LucideSearch, LucideX, LucideFlame],
  templateUrl: './shorts-page.component.html',
  styleUrls: ['./shorts-page.component.scss']
})
export class ShortsPageComponent implements OnInit, OnDestroy {
  @ViewChild('shortsContainer') shortsContainer!: ElementRef;
  
  queue = signal<ShortItem[]>([]);
  currentIndex = signal<number>(0);
  
  // Dual IFrame setup
  playerA: any = null;
  playerB: any = null;
  activePlayerId = computed<'A' | 'B'>(() => this.currentIndex() % 2 === 0 ? 'A' : 'B');
  
  isApiLoaded = false;
  isLoading = signal<boolean>(true);
  isBuffering = signal<boolean>(false); // Shows loading when user scrolls fast
  isFullSongMode = signal<boolean>(false);
  isPaused = signal<boolean>(false);
  
  // Custom Query & Menu
  showMenuId = signal<number | null>(null);
  showCustomQueryModal = signal<boolean>(false);
  customQueryText = signal<string>('');
  
  private heartIdCounter = 0;
  private lastTap = 0;
  private singleTapTimer: any;
  
  private currentPlayStartTime = 0;
  private rapidSkipCount = 0;
  private playbackTimer: any;
  private scrollDebounceTimer: any;
  private isFetching = false;
  private seenVideoIds = new Set<string>(); // Global dedup across ALL fetches
  private fetchPageToken = 0; // Rotate queries to avoid repeats
  private backgroundQueries = ['Hindi viral reels songs 2026', 'Trending Hindi shorts audio', 'Bollywood party hit songs', 'Hindi lofi chill beats'];
  private allQueries: string[] = [];
  private playersReady = { A: false, B: false };
  
  constructor(
    private youtubeApi: YoutubeApiService,
    private playerService: PlayerService,
    private userService: UserService,
    private algorithmService: AlgorithmService,
    private shortsAlgorithmService: ShortsAlgorithmService,
    private heartBurstService: HeartBurstService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // Pause main player if it's playing
    if (this.playerService.isPlaying()) {
      this.playerService.pause();
    }
    
    // Build query pool once
    this.buildQueryPool();
    this.initYouTubeApi();
    
    this.route.queryParamMap.subscribe(params => {
      const videoId = params.get('v');
      if (videoId) {
        this.fetchSpecificAndQueue(videoId);
      } else {
        // Kick off 2 parallel fetches for instant content
        this.fetchRandomQueue(10);
        this.fetchRandomQueue(10);
      }
    });
  }

  ngOnDestroy() {
    this.recordCurrentEngagement();
    this.clearPlaybackTimer();
    if (this.scrollDebounceTimer) clearTimeout(this.scrollDebounceTimer);
    if (this.playerA) this.playerA.destroy();
    if (this.playerB) this.playerB.destroy();
  }

  private buildQueryPool() {
    const langs = this.userService.preferredLanguages();
    
    // Get algorithmic queries based on user's listening history and taste profile
    this.allQueries = this.shortsAlgorithmService.getAlgorithmicShortsQueries(langs);
    
    // Fallback if empty
    if (!this.allQueries || this.allQueries.length === 0) {
      this.allQueries = [...this.backgroundQueries];
      this.allQueries.sort(() => Math.random() - 0.5);
    }
  }

  private initYouTubeApi() {
    if (window.YT && window.YT.Player) {
      this.isApiLoaded = true;
      this.createPlayers();
    } else {
      // Poll quickly for API availability
      const checkApi = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkApi);
          this.isApiLoaded = true;
          this.createPlayers();
        }
      }, 100); // Check every 100ms instead of 500ms
    }
  }

  private createPlayers() {
    if (!this.isApiLoaded || this.playerA || this.playerB) return;
    
    // Create Player A
    this.playerA = new window.YT.Player('shorts-player-a', {
      height: '1',
      width: '1',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1
      },
      events: {
        onReady: () => {
          this.playersReady.A = true;
          this.tryFirstPlay();
        },
        onStateChange: (e: any) => this.onPlayerStateChange(e, 'A')
      }
    });

    // Create Player B
    this.playerB = new window.YT.Player('shorts-player-b', {
      height: '1',
      width: '1',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1
      },
      events: {
        onReady: () => {
          this.playersReady.B = true;
        },
        onStateChange: (e: any) => this.onPlayerStateChange(e, 'B')
      }
    });
  }

  // Called when Player A is ready AND we have queue items
  private tryFirstPlay() {
    if (this.playersReady.A && this.queue().length > 0) {
      this.playCurrent();
    }
  }

  private fetchSpecificAndQueue(videoId: string) {
    this.seenVideoIds.add(videoId);
    this.youtubeApi.searchMusic(videoId, 1).subscribe(res => {
      if (res && res.length > 0) {
        const item: ShortItem = {
          ...res[0],
          dropStartTime: 45
        };
        this.queue.set([item]);
        this.tryFirstPlay();
        // Fetch background content
        this.fetchRandomQueue(10);
        this.fetchRandomQueue(10);
      }
    });
  }

  private getNextQuery(): string {
    const query = this.allQueries[this.fetchPageToken % this.allQueries.length];
    this.fetchPageToken++;
    return query;
  }

  private checkIsLiked(videoId: string): boolean {
    const playlists = this.userService.customPlaylists();
    const likedShorts = playlists.find(p => p.name === 'Liked Shorts');
    const likedSongs = playlists.find(p => p.name === 'Liked Songs');
    
    let isLiked = false;
    if (likedShorts && likedShorts.tracks) {
      isLiked = isLiked || likedShorts.tracks.some((t: any) => t.videoId === videoId);
    }
    if (likedSongs && likedSongs.tracks) {
      isLiked = isLiked || likedSongs.tracks.some((t: any) => t.videoId === videoId);
    }
    return isLiked;
  }

  private fetchRandomQueue(limit = 10) {
    if (this.isFetching) return;
    this.isFetching = true;
    
    const randomQuery = this.getNextQuery();
    const preferredLangs = this.userService.preferredLanguages();
    
    this.youtubeApi.searchMusic(randomQuery, limit).subscribe({
      next: (res) => {
        this.isFetching = false;
        
        let items: ShortItem[] = res
          .filter(track => !this.seenVideoIds.has(track.videoId))
          .filter(track => this.shortsAlgorithmService.isValidLanguageTrack(track.title, track.channelTitle, preferredLangs))
          .map(track => {
            this.seenVideoIds.add(track.videoId); // Mark as seen globally
            return {
              ...track,
              dropStartTime: 45,
              isLiked: this.checkIsLiked(track.videoId)
            };
          });
        
        // Use the advanced algorithm to rank and inject wildcards
        items = this.shortsAlgorithmService.rankCandidates(items, limit) as ShortItem[];
        
        const interleaved = this.interleaveItems(items);
        
        const currentQ = this.queue();
        this.queue.set([...currentQ, ...interleaved]);
        
        if (currentQ.length === 0 && interleaved.length > 0) {
          this.tryFirstPlay();
        } else if (interleaved.length > 0) {
          this.preloadNext();
        }
        
        // If we got very few new items (most were dupes/filtered), fetch again immediately
        if (interleaved.length < 3) {
          this.fetchRandomQueue(15);
        }
      },
      error: () => {
        this.isFetching = false;
        // Retry after a brief delay
        setTimeout(() => this.fetchRandomQueue(limit), 1000);
      }
    });
  }

  private interleaveItems(items: ShortItem[]): ShortItem[] {
    if (items.length <= 1) return items;
    
    const result: ShortItem[] = [];
    const remaining = [...items].sort(() => Math.random() - 0.5);
    let lastArtist = '';
    
    while (remaining.length > 0) {
      let idx = remaining.findIndex(item => item.channelTitle !== lastArtist);
      if (idx === -1) idx = 0;
      
      const picked = remaining.splice(idx, 1)[0];
      result.push(picked);
      lastArtist = picked.channelTitle;
    }
    
    return result;
  }

  private playCurrent() {
    const q = this.queue();
    if (q.length === 0) return;
    
    // Players not ready yet - wait
    if (!this.playerA || !this.playerB || !this.playersReady.A) {
      setTimeout(() => this.playCurrent(), 200);
      return;
    }

    this.isLoading.set(false);
    this.clearPlaybackTimer();

    const currentItem = q[this.currentIndex()];
    if (!currentItem) return;
    
    const activePlayer = this.activePlayerId() === 'A' ? this.playerA : this.playerB;
    const idlePlayer = this.activePlayerId() === 'A' ? this.playerB : this.playerA;
    
    // Stop the idle player
    try {
      if (idlePlayer && idlePlayer.stopVideo) {
        idlePlayer.stopVideo();
      }
    } catch(e) { /* ignore */ }
    
    // Always use loadVideoById - it's the most reliable and fastest method
    // The YouTube IFrame API handles buffering internally and starts playing ASAP
    try {
      if (activePlayer && activePlayer.loadVideoById) {
        const startSecs = this.isFullSongMode() ? 0 : currentItem.dropStartTime;
        activePlayer.loadVideoById({
          videoId: currentItem.videoId,
          startSeconds: startSecs
        });
        activePlayer.unMute();
        activePlayer.setVolume(100);
        
        this.isBuffering.set(false);
        this.isPaused.set(false);
        this.currentPlayStartTime = Date.now();
        
        if (!this.isFullSongMode()) {
          // Start 30s timer for auto-advance in Shorts mode
          this.playbackTimer = setTimeout(() => {
            this.scrollToNext();
          }, 30000);
        }
      }
    } catch(e) {
      console.error('Player error:', e);
    }

    // Preload next song in the background
    this.preloadNext();
  }

  private preloadNext() {
    const nextIndex = this.currentIndex() + 1;
    
    // Aggressive fetch: if fewer than 5 items ahead, fetch more
    if (this.queue().length - this.currentIndex() <= 5) {
      this.fetchRandomQueue(10);
    }

    if (nextIndex >= this.queue().length) {
      return; // Still fetching
    }

    const nextItem = this.queue()[nextIndex];
    const idlePlayer = this.activePlayerId() === 'A' ? this.playerB : this.playerA;

    // Cue next video (downloads metadata + thumbnail, starts buffering)
    try {
      if (idlePlayer && idlePlayer.cueVideoById) {
        const startSecs = this.isFullSongMode() ? 0 : nextItem.dropStartTime;
        idlePlayer.cueVideoById({
          videoId: nextItem.videoId,
          startSeconds: startSecs
        });
      }
    } catch(e) { /* ignore */ }
  }

  private onPlayerStateChange(event: any, playerId: 'A' | 'B') {
    // Only handle events for the active player
    if (this.activePlayerId() !== playerId) return;
    
    if (event.data === window.YT.PlayerState.PLAYING) {
      // Song started playing - hide buffering
      this.ngZone.run(() => {
        this.isBuffering.set(false);
      });
    }
    
    if (event.data === window.YT.PlayerState.BUFFERING) {
      this.ngZone.run(() => {
        this.isBuffering.set(true);
      });
    }
    
    // Song ended naturally
    if (event.data === window.YT.PlayerState.ENDED) {
      this.scrollToNext();
    }
  }

  scrollToNext() {
    this.recordCurrentEngagement();
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex < this.queue().length) {
      this.currentIndex.set(nextIndex);
      
      // Physically scroll container
      if (this.shortsContainer) {
        const itemHeight = this.shortsContainer.nativeElement.clientHeight;
        this.shortsContainer.nativeElement.scrollTo({
          top: nextIndex * itemHeight,
          behavior: 'smooth'
        });
      }
      
      // Play immediately - don't wait for scroll animation
      this.playCurrent();
    }
  }

  private recordCurrentEngagement() {
    const q = this.queue();
    const currentItem = q[this.currentIndex()];
    if (!currentItem || this.currentPlayStartTime === 0) return;
    
    const listenSecs = Math.max(0, Math.floor((Date.now() - this.currentPlayStartTime) / 1000));
    this.shortsAlgorithmService.trackEngagement(currentItem, listenSecs, 30);
    
    // CONTINUOUS PREDICTION: Rebuild query pool instantly after every single interaction
    this.buildQueryPool();
    
    if (listenSecs < 4) {
      this.rapidSkipCount++;
      if (this.rapidSkipCount >= 3) {
        // User skipped 3 shorts quickly — switch query pool vibe and purge upcoming preloaded queue
        this.rapidSkipCount = 0;
        this.fetchPageToken += 2;
        
        // Purge upcoming queue (keep only history, current, and the very next one which is already preloading)
        const currentIdx = this.currentIndex();
        if (q.length > currentIdx + 2) {
          this.queue.set(q.slice(0, currentIdx + 2));
        }
        
        this.fetchRandomQueue(15);
      }
    } else {
      this.rapidSkipCount = 0;
      
      // CONTINUOUS BACKGROUND PRELOAD: 
      // If user listened to this song deeply (>15s), they like this vibe!
      // Instantly drop the far-future preloaded queue and fetch MORE of this vibe in the background!
      if (listenSecs >= 15) {
         const currentIdx = this.currentIndex();
         if (q.length > currentIdx + 3) {
           this.queue.set(q.slice(0, currentIdx + 3));
           this.fetchRandomQueue(10);
         }
      }
    }
    
    this.currentPlayStartTime = 0;
  }

  // Handle manual scroll (swipe up/down) with debouncing for fast scrollers
  @HostListener('scroll', ['$event'])
  onScroll(event: any) {
    if (!this.shortsContainer) return;
    
    const container = this.shortsContainer.nativeElement;
    const itemHeight = container.clientHeight;
    const scrollPos = container.scrollTop;
    
    // Calculate which item is currently most visible
    const newIndex = Math.round(scrollPos / itemHeight);
    
    if (newIndex !== this.currentIndex() && newIndex >= 0 && newIndex < this.queue().length) {
      this.recordCurrentEngagement();
      // Show buffering immediately when user scrolls fast
      this.isBuffering.set(true);
      this.currentIndex.set(newIndex);
      
      // Debounce: wait 150ms for user to stop scrolling before playing
      if (this.scrollDebounceTimer) clearTimeout(this.scrollDebounceTimer);
      this.scrollDebounceTimer = setTimeout(() => {
        this.playCurrent();
      }, 150);
    }
  }

  private clearPlaybackTimer() {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  goBack() {
    this.location.back();
  }

  startInteraction() {
    this.playCurrent();
  }

  toggleFullSongMode() {
    this.isFullSongMode.set(!this.isFullSongMode());
    // Restart current track immediately with the new mode settings
    this.playCurrent();
  }

  handleTap(event: any, item: ShortItem) {
    this.showMenuId.set(null); // Close menu on any tap
    const currentTime = new Date().getTime();
    const tapLength = currentTime - this.lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      clearTimeout(this.singleTapTimer);
      this.triggerLikeAnimation(event, item);
      this.lastTap = 0;
    } else {
      this.lastTap = currentTime;
      this.singleTapTimer = setTimeout(() => {
        this.togglePause();
      }, 300);
    }
  }

  togglePause() {
    const activePlayer = this.activePlayerId() === 'A' ? this.playerA : this.playerB;
    if (!activePlayer) return;
    
    if (this.isPaused()) {
      activePlayer.playVideo();
      this.isPaused.set(false);
      // Resume timer if not in full song mode
      if (!this.isFullSongMode()) {
        this.clearPlaybackTimer();
        this.playbackTimer = setTimeout(() => {
          this.scrollToNext();
        }, 30000);
      }
    } else {
      activePlayer.pauseVideo();
      this.isPaused.set(true);
      this.clearPlaybackTimer();
    }
  }

  triggerLikeAnimation(event: any, item: ShortItem) {
    if (!item.isLiked) {
      this.likeTrack(item);
    }
    
    let clientX = 0;
    let clientY = 0;

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    this.heartBurstService.trigger({ x: clientX, y: clientY });
  }

  // --- Menu and Custom Query Logic ---
  toggleMenu(event: Event, index: number) {
    event.stopPropagation();
    if (this.showMenuId() === index) {
      this.showMenuId.set(null);
    } else {
      this.showMenuId.set(index);
    }
  }

  openCustomQuery(event: Event) {
    event.stopPropagation();
    this.showMenuId.set(null);
    this.showCustomQueryModal.set(true);
  }

  closeCustomQuery() {
    this.showCustomQueryModal.set(false);
    this.customQueryText.set('');
  }

  submitCustomQuery() {
    const query = this.customQueryText().trim();
    if (!query) return;
    
    this.closeCustomQuery();
    this.isLoading.set(true);
    
    // Stop current players
    this.clearPlaybackTimer();
    try {
      if (this.playerA && this.playerA.stopVideo) this.playerA.stopVideo();
      if (this.playerB && this.playerB.stopVideo) this.playerB.stopVideo();
    } catch(e) {}

    // Reset queue and state
    this.queue.set([]);
    this.currentIndex.set(0);
    this.seenVideoIds.clear();
    this.isFetching = false;
    
    // Inject the new query at the front of the pool
    this.allQueries = [query, ...this.allQueries];
    this.fetchPageToken = 0;

    // Fetch new shorts immediately
    this.fetchRandomQueue(10);
  }
  
  markNotInterested(event: Event, index: number) {
    event.stopPropagation();
    this.showMenuId.set(null);
    // For now, just skip to next video
    this.scrollToNext();
  }

  playFullSong(event: Event, item: ShortItem) {
    event.stopPropagation();
    this.showMenuId.set(null);
    this.playerService.playTrack(item);
    this.router.navigate(['/play'], { queryParams: { v: item.videoId } });
  }

  searchArtist(event: Event, artistName: string) {
    event.stopPropagation();
    this.router.navigate(['/search'], { queryParams: { q: artistName } });
  }

  async likeTrack(item: ShortItem) {
    const user = this.authService.currentUser();
    if (!user || !user.email) {
      // Just toggle visually if they aren't logged in, or don't do anything
      item.isLiked = !item.isLiked;
      return;
    }
    const email = user.email;

    item.isLiked = !item.isLiked;

    if (item.isLiked) {
      this.shortsAlgorithmService.rewardLike(item);
      
      // CONTINUOUS PREDICTION & BACKGROUND PRELOAD:
      // Instantly rebuild query pool and fetch new predictive shorts based on this LIKE interaction
      this.buildQueryPool();
      const q = this.queue();
      const currentIdx = this.currentIndex();
      if (q.length > currentIdx + 3) {
        this.queue.set(q.slice(0, currentIdx + 3));
      }
      this.fetchRandomQueue(10);
    }

    const targetPlaylist = this.isFullSongMode() ? 'Liked Songs' : 'Liked Shorts';

    let playlists = this.userService.customPlaylists();
    let playlistObj = playlists.find(p => p.name === targetPlaylist);
    
    if (!playlistObj) {
      await this.userService.createPlaylist(email, targetPlaylist);
      playlists = this.userService.customPlaylists();
      playlistObj = playlists.find(p => p.name === targetPlaylist);
    }

    if (playlistObj) {
      // addToPlaylist inherently toggles (removes if present, adds if not)
      this.userService.addToPlaylist(email, targetPlaylist, item);
    }
  }

  shareTrack(item: ShortItem) {
    const shareUrl = `https://ganatube.in/shorts/play?v=${item.videoId}`;
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `Listen to ${item.title} on GanaTube!`,
        url: shareUrl
      }).catch(err => console.log('Error sharing', err));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        // Silently copied
      });
    }
  }
}
