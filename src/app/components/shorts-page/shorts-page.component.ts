import { Component, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild, HostListener, NgZone } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';
import { UserService } from '../../services/user.service';
import { LucideHeart, LucideShare2, LucidePlay, LucideMoreVertical, LucideChevronLeft, LucideMusic, LucideLoader2 } from '@lucide/angular';

interface ShortItem extends YouTubeSearchResult {
  dropStartTime: number;
  isLiked?: boolean;
}

declare var window: any;

@Component({
  selector: 'app-shorts-page',
  standalone: true,
  imports: [CommonModule, LucideHeart, LucideShare2, LucidePlay, LucideMoreVertical, LucideChevronLeft, LucideMusic, LucideLoader2],
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
  floatingHearts = signal<{id: number, x: number, y: number}[]>([]);
  private heartIdCounter = 0;
  private lastTap = 0;
  
  private playbackTimer: any;
  private scrollDebounceTimer: any;
  private isFetching = false;
  private seenVideoIds = new Set<string>(); // Global dedup across ALL fetches
  private fetchPageToken = 0; // Rotate queries to avoid repeats
  private backgroundQueries = ['trending music', 'latest hit songs', 'party songs', 'lofi beats', 'bollywood hits', 'punjabi hits'];
  private allQueries: string[] = [];
  private playersReady = { A: false, B: false };
  
  constructor(
    private youtubeApi: YoutubeApiService,
    private playerService: PlayerService,
    private userService: UserService,
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
    this.clearPlaybackTimer();
    if (this.scrollDebounceTimer) clearTimeout(this.scrollDebounceTimer);
    if (this.playerA) this.playerA.destroy();
    if (this.playerB) this.playerB.destroy();
  }

  private buildQueryPool() {
    const langs = this.userService.preferredLanguages();
    const keywords = ['trending', 'hits', 'top songs', 'popular', 'new release', 'viral', 'best of', 'mashup', 'remix', 'party mix'];
    
    if (langs && langs.length > 0) {
      langs.forEach(l => {
        keywords.forEach(k => {
          this.allQueries.push(`${l} ${k}`);
        });
      });
    } else {
      this.allQueries = [...this.backgroundQueries];
    }
    
    // Shuffle the pool
    this.allQueries.sort(() => Math.random() - 0.5);
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

  private fetchRandomQueue(limit = 10) {
    if (this.isFetching) return;
    this.isFetching = true;
    
    const randomQuery = this.getNextQuery();
    
    this.youtubeApi.searchMusic(randomQuery, limit).subscribe({
      next: (res) => {
        this.isFetching = false;
        
        const items: ShortItem[] = res
          .filter(track => !this.seenVideoIds.has(track.videoId))
          .map(track => {
            this.seenVideoIds.add(track.videoId); // Mark as seen globally
            return {
              ...track,
              dropStartTime: 45
            };
          });
        
        // Shuffle for variety
        items.sort(() => Math.random() - 0.5);
        
        const currentQ = this.queue();
        this.queue.set([...currentQ, ...items]);
        
        if (currentQ.length === 0 && items.length > 0) {
          this.tryFirstPlay();
        } else if (items.length > 0) {
          this.preloadNext();
        }
        
        // If we got very few new items (most were dupes), fetch again immediately
        if (items.length < 3) {
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
        activePlayer.loadVideoById({
          videoId: currentItem.videoId,
          startSeconds: currentItem.dropStartTime
        });
        activePlayer.unMute();
        activePlayer.setVolume(100);
        
        this.isBuffering.set(false);
        
        // Start 30s timer for auto-advance
        this.playbackTimer = setTimeout(() => {
          this.scrollToNext();
        }, 30000);
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
        idlePlayer.cueVideoById({
          videoId: nextItem.videoId,
          startSeconds: nextItem.dropStartTime
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

  playFullSong(item: ShortItem) {
    this.playerService.playTrack(item);
    this.router.navigate(['/']); // Go home where full player is visible
  }

  handleTap(event: any, item: ShortItem) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - this.lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      this.triggerLikeAnimation(event, item);
    }
    this.lastTap = currentTime;
  }

  triggerLikeAnimation(event: any, item: ShortItem) {
    item.isLiked = true;
    
    // Get coordinates relative to the container
    let clientX = 0;
    let clientY = 0;

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const newHeart = { id: this.heartIdCounter++, x: clientX, y: clientY };
    this.floatingHearts.update(hearts => [...hearts, newHeart]);

    // Remove the heart after animation (1.6s)
    setTimeout(() => {
      this.floatingHearts.update(hearts => hearts.filter(h => h.id !== newHeart.id));
    }, 1600);
  }

  likeTrack(item: ShortItem) {
    item.isLiked = !item.isLiked;
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
