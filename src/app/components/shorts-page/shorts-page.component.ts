import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';
import { UserService } from '../../services/user.service';
import { LucideHeart, LucideShare2, LucidePlay, LucideMoreVertical, LucideChevronLeft, LucideMusic } from '@lucide/angular';

interface ShortItem extends YouTubeSearchResult {
  dropStartTime: number;
  isLiked?: boolean;
}

declare var window: any;

@Component({
  selector: 'app-shorts-page',
  standalone: true,
  imports: [CommonModule, LucideHeart, LucideShare2, LucidePlay, LucideMoreVertical, LucideChevronLeft, LucideMusic],
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
  activePlayerId = signal<'A' | 'B'>('A');
  
  isApiLoaded = false;
  isLoading = signal<boolean>(true);
  needsInteraction = signal<boolean>(true); // Require tap-to-play
  floatingHearts = signal<{id: number, x: number, y: number}[]>([]);
  private heartIdCounter = 0;
  private lastTap = 0;
  
  private playbackTimer: any;
  private backgroundQueries = ['trending music', 'latest hit songs', 'party songs', 'lofi beats', 'bollywood hits', 'punjabi hits'];
  
  constructor(
    private youtubeApi: YoutubeApiService,
    private playerService: PlayerService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    // Pause main player if it's playing
    if (this.playerService.isPlaying()) {
      this.playerService.pause();
    }
    
    this.initYouTubeApi();
    
    this.route.queryParamMap.subscribe(params => {
      const videoId = params.get('v');
      if (videoId) {
        // Fetch specific video first, then randoms
        this.fetchSpecificAndQueue(videoId);
      } else {
        this.fetchRandomQueue();
      }
    });
  }

  ngOnDestroy() {
    this.clearPlaybackTimer();
    if (this.playerA) {
      this.playerA.destroy();
    }
    if (this.playerB) {
      this.playerB.destroy();
    }
  }

  private initYouTubeApi() {
    if (window.YT && window.YT.Player) {
      this.isApiLoaded = true;
      this.createPlayers();
    } else {
      const checkApi = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkApi);
          this.isApiLoaded = true;
          this.createPlayers();
        }
      }, 500);
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
        modestbranding: 1
      },
      events: {
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
        modestbranding: 1
      },
      events: {
        onStateChange: (e: any) => this.onPlayerStateChange(e, 'B')
      }
    });
  }

  private fetchSpecificAndQueue(videoId: string) {
    this.youtubeApi.searchMusic(videoId, 1).subscribe(res => {
      if (res && res.length > 0) {
        const item: ShortItem = {
          ...res[0],
          dropStartTime: this.calculateDropTime()
        };
        this.queue.set([item]);
        this.playCurrent();
        this.fetchRandomQueue(5); // Fetch 5 in background
      }
    });
  }

  private getDynamicQueries(): string[] {
    const langs = this.userService.preferredLanguages();
    if (langs && langs.length > 0) {
      return langs.map(l => `${l} trending shorts hit songs`);
    }
    return this.backgroundQueries;
  }

  private fetchRandomQueue(limit = 5) {
    const queries = this.getDynamicQueries();
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    this.youtubeApi.searchMusic(randomQuery, limit).subscribe(res => {
      const items: ShortItem[] = res.map(track => ({
        ...track,
        dropStartTime: this.calculateDropTime()
      }));
      
      const currentQ = this.queue();
      this.queue.set([...currentQ, ...items]);
      
      if (currentQ.length === 0) {
        this.playCurrent();
      } else {
        // If we were waiting for items, preload next now
        this.preloadNext();
      }
    });
  }

  private calculateDropTime(): number {
    // Random start time between 45s and 75s to simulate "drop"
    return Math.floor(Math.random() * 30) + 45;
  }

  private playCurrent() {
    if (!this.playerA || !this.playerB || this.queue().length === 0) {
      setTimeout(() => this.playCurrent(), 500);
      return;
    }

    this.isLoading.set(false);
    this.clearPlaybackTimer();

    if (this.needsInteraction()) {
      return; // Do not autoplay until user taps
    }

    const currentItem = this.queue()[this.currentIndex()];
    const activePlayer = this.activePlayerId() === 'A' ? this.playerA : this.playerB;
    
    // Load and play
    if (activePlayer && activePlayer.loadVideoById) {
      activePlayer.loadVideoById({
        videoId: currentItem.videoId,
        startSeconds: currentItem.dropStartTime
      });
      activePlayer.setVolume(100);
      
      // Start 30s timer
      this.playbackTimer = setTimeout(() => {
        this.scrollToNext();
      }, 30000);
    }

    this.preloadNext();
  }

  private preloadNext() {
    const nextIndex = this.currentIndex() + 1;
    
    // Smart optimized fetch: if less than 3 songs left in queue, fetch 5 more
    if (this.queue().length - this.currentIndex() <= 3) {
      this.fetchRandomQueue(5);
    }

    if (nextIndex >= this.queue().length) {
      return; // Waiting for fetch to complete
    }

    const nextItem = this.queue()[nextIndex];
    const idlePlayer = this.activePlayerId() === 'A' ? this.playerB : this.playerA;

    if (idlePlayer && idlePlayer.cueVideoById) {
      idlePlayer.cueVideoById({
        videoId: nextItem.videoId,
        startSeconds: nextItem.dropStartTime
      });
    }
  }

  private onPlayerStateChange(event: any, playerId: 'A' | 'B') {
    // If a player ends unexpectedly, scroll to next
    if (event.data === window.YT.PlayerState.ENDED && this.activePlayerId() === playerId) {
      this.scrollToNext();
    }
  }

  scrollToNext() {
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex < this.queue().length) {
      this.currentIndex.set(nextIndex);
      // Switch active player
      this.activePlayerId.set(this.activePlayerId() === 'A' ? 'B' : 'A');
      
      // Stop previous
      const idlePlayer = this.activePlayerId() === 'A' ? this.playerB : this.playerA;
      if (idlePlayer && idlePlayer.stopVideo) {
        idlePlayer.stopVideo();
      }
      
      this.playCurrent();
      
      // Physically scroll container
      if (this.shortsContainer) {
        const itemHeight = this.shortsContainer.nativeElement.clientHeight;
        this.shortsContainer.nativeElement.scrollTo({
          top: nextIndex * itemHeight,
          behavior: 'smooth'
        });
      }
    }
  }

  // Handle manual scroll (swipe up/down)
  @HostListener('scroll', ['$event'])
  onScroll(event: any) {
    if (!this.shortsContainer) return;
    
    const container = this.shortsContainer.nativeElement;
    const itemHeight = container.clientHeight;
    const scrollPos = container.scrollTop;
    
    const newIndex = Math.round(scrollPos / itemHeight);
    
    if (newIndex !== this.currentIndex() && newIndex >= 0 && newIndex < this.queue().length) {
      // User swiped to a new item
      this.currentIndex.set(newIndex);
      this.activePlayerId.set(this.activePlayerId() === 'A' ? 'B' : 'A');
      
      const idlePlayer = this.activePlayerId() === 'A' ? this.playerB : this.playerA;
      if (idlePlayer && idlePlayer.stopVideo) {
        idlePlayer.stopVideo();
      }
      
      this.playCurrent();
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
    this.needsInteraction.set(false);
    // Unmute players to unlock AudioContext
    if (this.playerA && this.playerA.unMute) this.playerA.unMute();
    if (this.playerB && this.playerB.unMute) this.playerB.unMute();
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

    // Remove the heart after animation (1s)
    setTimeout(() => {
      this.floatingHearts.update(hearts => hearts.filter(h => h.id !== newHeart.id));
    }, 1000);
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
        alert('Link copied to clipboard!'); // Simple fallback
      });
    }
  }
}
