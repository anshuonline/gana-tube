import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService, Track } from '../../services/player.service';
import { YoutubeApiService } from '../../services/youtube-api.service';
import { 
  LucideChevronDown, 
  LucidePlay, 
  LucidePause, 
  LucideSkipForward, 
  LucideSkipBack, 
  LucideMic2,
  LucideMoreVertical,
  LucideHeart,
  LucideCar,
  LucideRepeat
} from '@lucide/angular';
import { AlgorithmService } from '../../services/algorithm.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { TrackMenuComponent } from '../track-menu/track-menu.component';

@Component({
  selector: 'app-full-screen-player',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    LucideChevronDown, 
    LucidePlay, 
    LucidePause, 
    LucideSkipForward, 
    LucideSkipBack, 
    LucideMic2,
    LucideMoreVertical,
    LucideHeart,
    LucideCar,
    LucideRepeat,
    TrackMenuComponent
  ],
  templateUrl: './full-screen-player.component.html',
  styleUrls: ['./full-screen-player.component.scss']
})
export class FullScreenPlayerComponent implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Output() closePlayer = new EventEmitter<void>();
  @Output() openPlaylist = new EventEmitter<any>();
  @Output() openCarMode = new EventEmitter<void>();
  @ViewChild('lyricsContainer') lyricsContainer!: ElementRef;

  public playerService = inject(PlayerService);
  private youtubeApi = inject(YoutubeApiService);
  public algorithmService = inject(AlgorithmService);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  @Input() playerCoverAd: any = null;
  @Input() safePlayerCoverAdUrl: any = null;

  activeView: 'artwork' | 'queue' | 'lyrics' | 'related' = 'artwork';
  showMenu = false;
  menuX = 0;
  menuY = 0;
  lyrics: string | null = null; // Plain text fallback
  parsedLyrics: { time: number, text: string }[] = [];
  activeLineIndex: number = -1;
  lyricsLoading = false;
  showToast = false;
  
  relatedTracks: Track[] = [];
  relatedLoading = false;
  
  showCoverAd = false;
  private adTimers: any[] = [];

  constructor() {
    // Automatically fetch lyrics when track changes if lyrics view is open
    effect(() => {
      const track = this.playerService.currentTrack();
      if (track && this.activeView === 'lyrics') {
        this.fetchLyrics();
      }
      
      // Manage Ad Timers
      if (track) {
        this.clearAdTimers();
        this.showCoverAd = false;
        
        const loopAd = () => {
          // Wait 5 seconds before showing ad
          const t1 = setTimeout(() => {
            if (this.playerCoverAd && this.playerCoverAd.isActive && this.isVisible) {
              this.showCoverAd = true;
            }
            
            // Wait 5 seconds before hiding (total cycle = 10s)
            const t2 = setTimeout(() => {
              this.showCoverAd = false;
              
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

    // Automatically track active lyric line based on playback time
    effect(() => {
      const time = this.playerService.currentTime();
      if (this.parsedLyrics.length > 0 && this.activeView === 'lyrics') {
        let newIndex = -1;
        for (let i = 0; i < this.parsedLyrics.length; i++) {
          if (time >= this.parsedLyrics[i].time) {
            newIndex = i;
          } else {
            break; // Since it's sorted, we can stop early
          }
        }
        if (newIndex !== this.activeLineIndex) {
          this.activeLineIndex = newIndex;
          this.scrollToActiveLine();
        }
      }
    });
  }

  ngOnInit(): void {
    // Show guide after 1 second if it's the first time
    const hasSeenGuide = localStorage.getItem('ganatube_has_seen_double_tap_guide');
    if (!hasSeenGuide) {
      setTimeout(() => {
        this.showDoubleTapGuide = true;
        // Auto hide after 4 seconds if not interacted
        setTimeout(() => {
          this.hideGuide(null);
        }, 4000);
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    this.clearAdTimers();
  }

  clearAdTimers(): void {
    this.adTimers.forEach(t => clearTimeout(t));
    this.adTimers = [];
  }

  // Double Tap & Guide Logic
  showDoubleTapGuide = false;
  showLikeAnimation = false;
  lastTapTime = 0;
  heartX = 50; // percentage
  heartY = 50; // percentage

  hideGuide(event: Event | null): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.showDoubleTapGuide) {
      this.showDoubleTapGuide = false;
      localStorage.setItem('ganatube_has_seen_double_tap_guide', 'true');
    }
  }

  onCoverClick(event: MouseEvent): void {
    this.hideGuide(event);
    
    const now = Date.now();
    const DOUBLE_CLICK_TIME = 400; // ms
    if (now - this.lastTapTime < DOUBLE_CLICK_TIME) {
      // Double tap detected
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      this.heartX = ((event.clientX - rect.left) / rect.width) * 100;
      this.heartY = ((event.clientY - rect.top) / rect.height) * 100;

      this.triggerLikeAnimation();
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;
    }
  }

  triggerLikeAnimation(): void {
    if (!this.isCurrentTrackLiked()) {
      this.toggleLike();
    }
    
    this.showLikeAnimation = true;
    setTimeout(() => {
      this.showLikeAnimation = false;
    }, 800);
  }

  close(): void {
    this.closePlayer.emit();
    this.showMenu = false;
  }

  toggleMenu(event: MouseEvent): void {
    if (!this.showMenu) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      this.menuX = rect.right;
      this.menuY = rect.bottom;
    }
    this.showMenu = !this.showMenu;
  }

  isCurrentTrackLiked(): boolean {
    const track = this.playerService.currentTrack();
    if (!track) return false;
    return this.algorithmService.isLiked(track.videoId);
  }

  toggleLike(): void {
    const track = this.playerService.currentTrack();
    if (track) {
      const user = this.authService.currentUser();
      if (user && user.email) {
        this.userService.toggleLike(user.email, track, this.userService.preferredLanguages());
      }
      this.algorithmService.toggleLike(track);
    }
    this.showMenu = false;
  }

  toggleView(view: 'artwork' | 'queue' | 'lyrics' | 'related'): void {
    if (this.activeView === view) {
      this.activeView = 'artwork';
    } else {
      this.activeView = view;
      if (view === 'lyrics') {
        this.fetchLyrics();
      } else if (view === 'related') {
        this.fetchRelated();
      }
    }
  }

  fetchLyrics(): void {
    const track = this.playerService.currentTrack();
    if (!track) return;
    
    this.lyricsLoading = true;
    this.lyrics = null;
    this.parsedLyrics = [];
    this.activeLineIndex = -1;
    
    // Better cleaning: remove common noise words from title
    let cleanTitle = track.title
      .replace(/\(Official.*?\)/gi, '')
      .replace(/\[Official.*?\]/gi, '')
      .replace(/\(Lyric.*?\)/gi, '')
      .replace(/\[Lyric.*?\]/gi, '')
      .replace(/\(Audio.*?\)/gi, '')
      .replace(/\[Audio.*?\]/gi, '')
      .replace(/\(Music Video.*?\)/gi, '')
      .replace(/\[Music Video.*?\]/gi, '')
      .replace(/\(Full.*?\)/gi, '')
      .replace(/\[Full.*?\]/gi, '')
      .replace(/\(HD.*?\)/gi, '')
      .replace(/\[HD.*?\]/gi, '')
      .replace(/Official Video/gi, '')
      .replace(/Video Song/gi, '')
      .replace(/Full Song/gi, '')
      .replace(/Lyrical/gi, '')
      .replace(/\|.*/g, '')
      .trim();
    
    let cleanArtist = (track.channelTitle || '')
      .replace(/ - Topic/g, '')
      .replace(/VEVO$/i, '')
      .trim();
    
    const query = `${cleanTitle} ${cleanArtist}`;
    
    this.youtubeApi.getSyncedLyrics(query).subscribe(res => {
      if (res && res.syncedLyrics) {
        this.parseLrc(res.syncedLyrics);
        this.lyricsLoading = false;
      } else if (res && res.plainLyrics) {
        this.lyrics = res.plainLyrics.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
        this.lyricsLoading = false;
      } else {
        // Fallback to ytmusic-api static lyrics
        this.youtubeApi.getLyrics(track.videoId).subscribe(ly => {
          this.lyrics = ly;
          this.lyricsLoading = false;
        });
      }
    });
  }

  parseLrc(lrc: string): void {
    const lines = lrc.split('\n');
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    
    this.parsedLyrics = [];
    
    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);
        const text = match[4].trim();
        
        // Skip empty lines to keep it clean, or keep them for instrumental breaks
        if (text) {
          const time = min * 60 + sec + ms / 1000;
          this.parsedLyrics.push({ time, text });
        }
      }
    }
  }

  fetchRelated(): void {
    const track = this.playerService.currentTrack();
    if (!track) return;
    
    this.relatedLoading = true;
    this.relatedTracks = [];
    
    const query = `${track.channelTitle} ${track.title} similar songs`;
    this.youtubeApi.searchMusic(query).subscribe(res => {
      this.relatedTracks = res || [];
      this.relatedLoading = false;
    }, err => {
      console.error('Error fetching related tracks', err);
      this.relatedLoading = false;
    });
  }

  playRelatedTrack(track: Track): void {
    this.playerService.playTrack(track);
  }

  scrollToActiveLine(): void {
    if (!this.lyricsContainer) return;
    setTimeout(() => {
      const el = this.lyricsContainer.nativeElement as HTMLElement;
      const activeLine = el.querySelector('.lyric-line.active') as HTMLElement;
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  playQueueTrack(index: number): void {
    const queue = this.playerService.queue();
    this.playerService.setQueue(queue, index);
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  onSeek(event: any): void {
    const time = event.target.value;
    if ((this.playerService as any).ytPlayer) {
      (this.playerService as any).ytPlayer.seekTo(time, true);
    }
  }

  copyShareLink(): void {
    const track = this.playerService.currentTrack();
    if (!track) return;
    
    const url = `${window.location.origin}/?play=${track.videoId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast = true;
      setTimeout(() => this.showToast = false, 3000);
    });
    this.showMenu = false;
  }
}
