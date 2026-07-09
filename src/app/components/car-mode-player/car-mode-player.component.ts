import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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

  isListening = false;
  searchQuery = '';
  searchResults: YouTubeSearchResult[] = [];
  isSearching = false;
  showSearchResults = false;
  
  private recognition: any;

  ngOnInit(): void {
    this.setupSpeechRecognition();
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
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

    this.youtubeApi.searchMusic(query, 10).subscribe({
      next: (results) => {
        this.searchResults = results;
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
    // In Car Mode, if they tap a search result, play it immediately and clear search.
    // Replace the current queue with just this track, or play it next.
    // For simplicity, let's play it right away.
    this.playerService.queue.set([track]);
    this.playerService.currentIndex.set(0);
    this.playerService.playTrack(track);
    this.clearSearch();
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
    return this.userService.likedSongs().some(s => s.videoId === track.videoId);
  }

  async toggleLike(track?: Track, event?: Event) {
    if (event) event.stopPropagation();
    
    const targetTrack = track || this.playerService.currentTrack();
    if (!targetTrack) return;
    
    const user = this.authService.currentUser();
    if (user && user.email) {
      await this.userService.toggleLike(user.email, targetTrack, this.userService.preferredLanguages());
    }
  }

  close() {
    this.closeMode.emit();
  }
}
