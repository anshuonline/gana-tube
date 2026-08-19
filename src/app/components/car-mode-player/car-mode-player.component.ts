import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, ChangeDetectorRef, effect, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService, Track } from '../../services/player.service';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { 
  LucideChevronDown, 
  LucidePlay, 
  LucidePause, 
  LucideSkipForward, 
  LucideSkipBack, 
  LucideMic,
  LucideHeart,
  LucideX,
  LucideRefreshCw,
  LucideRepeat
} from '@lucide/angular';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-car-mode-player',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    LucideChevronDown, 
    LucidePlay, 
    LucidePause, 
    LucideSkipForward, 
    LucideSkipBack, 
    LucideMic,
    LucideHeart,
    LucideX,
    LucideRefreshCw,
    LucideRepeat
  ],
  templateUrl: './car-mode-player.component.html',
  styleUrls: ['./car-mode-player.component.scss']
})
export class CarModePlayerComponent implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Output() closeMode = new EventEmitter<void>();

  public playerService = inject(PlayerService);
  private youtubeApi = inject(YoutubeApiService);
  private authService = inject(AuthService);
  public userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  @Input() playerCoverAd: any = null;
  @Input() safePlayerCoverAdUrl: any = null;

  isListening = false;
  searchQuery = '';
  searchResults: YouTubeSearchResult[] = [];
  isSearching = false;
  showSearchResults = false;
  imageLoadError = false;
  
  showCoverAd = false;
  private adTimers: any[] = [];
  
  private recognition: any;

  constructor() {
    effect(() => {
      const track = this.playerService.currentTrack();
      this.imageLoadError = false;
      
      // Manage Ad Timers
      if (track) {
        this.clearAdTimers();
        this.showCoverAd = false;
        
        const loopAd = () => {
          // Wait 5 seconds before showing ad
          const t1 = setTimeout(() => {
            if (this.playerCoverAd && this.playerCoverAd.isActive && this.isVisible) {
              this.showCoverAd = true;
              this.cdr.detectChanges();
            }
            
            // Wait 5 seconds before hiding (total cycle = 10s)
            const t2 = setTimeout(() => {
              this.showCoverAd = false;
              this.cdr.detectChanges();
              
              // Start next cycle
              loopAd();
            }, 5000);
            this.adTimers.push(t2);
          }, 5000);
          this.adTimers.push(t1);
        };
        
        loopAd();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.setupSpeechRecognition();
  }

  onImageError() {
    this.imageLoadError = true;
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.clearAdTimers();
  }
  
  clearAdTimers(): void {
    this.adTimers.forEach(t => clearTimeout(t));
    this.adTimers = [];
  }

  setupSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.searchQuery = 'Listening...';
          this.cdr.detectChanges();
        };

        this.recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          this.searchQuery = transcript;
          this.isListening = false;
          this.cdr.detectChanges();
          this.performSearch(transcript);
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          this.isListening = false;
          this.searchQuery = '';
          this.cdr.detectChanges();
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.cdr.detectChanges();
        };
      } else {
        console.warn('Speech recognition not supported in this browser.');
      }
    }
  }

  startVoiceSearch() {
    if (this.recognition) {
      if (this.isListening) {
        this.recognition.stop();
      } else {
        try {
          this.recognition.start();
        } catch(e) {
          console.error(e);
        }
      }
    } else {
      alert("Voice search is not supported in your browser. Please type your search manually.");
    }
  }

  performSearch(query: string) {
    if (!query.trim()) return;
    this.isSearching = true;
    this.showSearchResults = true;
    this.searchResults = [];

    this.youtubeApi.searchMusic(query, 50).subscribe({
      next: (results) => {
        // Filter out multiple versions of the same song
        const unique = [];
        const titles = new Set();
        for (const r of results) {
          // Normalize title to catch duplicates (e.g. removing "Official Video", "Lyrical")
          let norm = r.title.toLowerCase().replace(/[\(\[].*?[\)\]]/g, '').trim();
          if (!titles.has(norm)) {
            titles.add(norm);
            unique.push(r);
          }
        }
        this.searchResults = unique;
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Search error', err);
        this.isSearching = false;
        this.cdr.detectChanges();
      }
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.showSearchResults = false;
    this.searchResults = [];
  }

  playSearchResult(track: YouTubeSearchResult) {
    // In Car Mode, play the clicked search result and queue the rest of the search results
    const index = this.searchResults.indexOf(track);
    this.playerService.queue.set([...this.searchResults]);
    this.playerService.currentIndex.set(index !== -1 ? index : 0);
    this.playerService.playTrack(track);
    
    // Hide search results view so it shows the Up Next queue (which now contains the search results)
    // but keep the searchQuery text so the user knows what they searched for.
    this.showSearchResults = false;
  }

  playQueueTrack(index: number) {
    this.playerService.playTrack(this.playerService.queue()[index]);
  }

  isCurrentTrackLiked(): boolean {
    const current = this.playerService.currentTrack();
    if (!current) return false;
    return this.userService.likedSongs().some(s => s.videoId === current.videoId);
  }

  isLiked(track: Track): boolean {
    const user = this.authService.currentUser();
    if (user && user.email) {
      return this.userService.likedSongs().some(s => (typeof s === 'string' ? s : s.videoId) === track.videoId);
    }
    return this.algorithmService.isLiked(track.videoId);
  }

  async toggleLike(track?: Track, event?: Event) {
    if (event) event.stopPropagation();
    
    const targetTrack = track || this.playerService.currentTrack();
    if (!targetTrack) return;
    
    const user = this.authService.currentUser();
    if (user && user.email) {
      await this.userService.toggleLike(user.email, targetTrack, this.userService.preferredLanguages());
    }
    this.algorithmService.toggleLike(targetTrack);
  }

  isScrubbing = signal<boolean>(false);
  scrubPercent = signal<number>(0);
  scrubTarget: HTMLElement | null = null;

  get progressPercent(): number {
    const duration = this.playerService.duration();
    if (!duration) return 0;
    return Math.min(100, (this.playerService.currentTime() / duration) * 100);
  }

  get displayProgressPercent(): number {
    return this.isScrubbing() ? this.scrubPercent() : this.progressPercent;
  }

  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onWindowMove(event: MouseEvent | TouchEvent): void {
    if (!this.isScrubbing()) return;
    this.calculateScrub(event);
  }

  @HostListener('window:mouseup', ['$event'])
  @HostListener('window:touchend', ['$event'])
  onWindowUp(event: MouseEvent | TouchEvent): void {
    if (!this.isScrubbing()) return;
    this.isScrubbing.set(false);
    this.calculateScrub(event, true);
    this.scrubTarget = null;
  }

  onScrubStart(event: MouseEvent | TouchEvent): void {
    const target = event.currentTarget as HTMLElement;
    this.scrubTarget = target;
    this.isScrubbing.set(true);
    this.calculateScrub(event);
  }

  calculateScrub(event: MouseEvent | TouchEvent, doSeek = false): void {
    if (!this.scrubTarget) return;
    
    // Prevent scrolling while seeking on mobile
    if (event.type === 'touchmove') {
        event.preventDefault();
    }

    const rect = this.scrubTarget.getBoundingClientRect();
    let clientX = 0;
    
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX;
    }
    
    let ratio = (clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(ratio, 1));
    this.scrubPercent.set(ratio * 100);

    if (doSeek) {
      const seekTime = ratio * this.playerService.duration();
      this.playerService.seekTo(seekTime);
    }
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onSeek(event: MouseEvent) {
    // Retained for backward compatibility if needed, actual logic handled by onScrubStart
    const track = event.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const seekTime = ratio * this.playerService.duration();
    this.playerService.seekTo(Math.max(0, Math.min(seekTime, this.playerService.duration())));
  }

  close() {
    this.closeMode.emit();
  }
}
