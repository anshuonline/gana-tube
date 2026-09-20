import { Component, Output, EventEmitter, OnInit, OnDestroy, Input, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap } from 'rxjs/operators';
import { LucideSearch, LucideX, LucideMic, LucideLoader2, LucideClock, LucideTrash2, LucideArrowUpLeft } from '@lucide/angular';
import { YoutubeApiService } from '../../services/youtube-api.service';
import { SearchHistoryService } from '../../services/search-history.service';

// Declare SpeechRecognition for TypeScript
declare var SpeechRecognition: any;
declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSearch, LucideX, LucideMic, LucideLoader2, LucideClock, LucideTrash2, LucideArrowUpLeft],
  template: `
    <div class="search-wrapper">
      <div class="search-bar" [class.focused]="isFocused">
        <svg lucideSearch class="search-icon left-icon" [attr.size]="20"></svg>
        <input
          #searchInput
          id="music-search-input"
          type="text"
          [(ngModel)]="query"
          (ngModelChange)="onQueryChange($event)"
          (focus)="onInputFocus()"
          (blur)="onInputBlur()"
          placeholder="What do you want to listen to?"
          class="search-input"
          autocomplete="off"
          (keydown.enter)="onSearch()"
        />
        <button *ngIf="query" class="clear-btn" (click)="clearQuery()" title="Clear">
          <svg lucideX [attr.size]="20"></svg>
        </button>
        
        <div class="divider"></div>

        <button 
          class="voice-btn search-submit-btn" 
          (click)="onSearch()" 
          title="Search"
          [class.loading]="isSearching">
          <svg *ngIf="!isSearching" lucideSearch [attr.size]="20"></svg>
          <svg *ngIf="isSearching" lucideLoader2 class="spinner" [attr.size]="20"></svg>
        </button>
      </div>

      <!-- Search History Dropdown (YouTube-style) -->
      <div class="suggestions-dropdown history-dropdown" *ngIf="isFocused && showHistory && searchHistory.history().length > 0">
        <div class="history-header-row">
          <span class="history-label">Recent searches</span>
          <button class="history-clear-btn" (mousedown)="onSuggestionMousedown($event)" (click)="clearHistory()">
            <svg lucideTrash2 [attr.size]="13"></svg>
            Clear all
          </button>
        </div>
        <div
          class="suggestion-item history-item"
          *ngFor="let item of searchHistory.history()"
          (mousedown)="onSuggestionMousedown($event)"
          (click)="selectSuggestion(item)"
        >
          <svg lucideClock class="item-icon history-clock" [attr.size]="16"></svg>
          <span class="suggestion-text">{{ item }}</span>
          <button class="history-remove-btn" (mousedown)="onSuggestionMousedown($event)" (click)="removeHistoryItem(item, $event)" title="Remove">
            <svg lucideX [attr.size]="15"></svg>
          </button>
        </div>
      </div>

      <!-- Suggestions Dropdown -->
      <div class="suggestions-dropdown" *ngIf="isFocused && showSuggestions && suggestions.length > 0">
        <div
          class="suggestion-item"
          *ngFor="let suggestion of suggestions"
          (mousedown)="onSuggestionMousedown($event)"
          (click)="selectSuggestion(suggestion)"
        >
          <svg lucideArrowUpLeft class="item-icon" [attr.size]="16"></svg>
          <span class="suggestion-text">{{ suggestion }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<string>();
  @Input() isSearching = false;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  query = '';
  isFocused = false;
  showSuggestions = false;
  showHistory = false;
  suggestions: string[] = [];
  private isSelectingSuggestion = false;

  isListening = false;
  private recognition: any;

  private querySubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private youtubeApi: YoutubeApiService, public searchHistory: SearchHistoryService) {
    this.initSpeechRecognition();
  }

  removeHistoryItem(item: string, event: MouseEvent): void {
    event.stopPropagation();
    this.searchHistory.remove(item);
  }

  clearHistory(): void {
    this.searchHistory.clear();
    this.showHistory = false;
    this.isSelectingSuggestion = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedInsideWrapper = !!target.closest('.search-wrapper');
    const clickedOnSuggestion = !!(target.closest('.suggestion-item') || target.closest('.history-clear-btn') || target.closest('.history-remove-btn'));

    if (!clickedOnSuggestion) {
      this.isSelectingSuggestion = false;
    }

    if (!clickedInsideWrapper) {
      this.isFocused = false;
      this.showSuggestions = false;
      this.showHistory = false;
    }
  }

  private initSpeechRecognition() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.query = transcript;
        this.isListening = false;
        // Automatically trigger search
        this.onSearch();
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }
  }

  toggleVoiceSearch() {
    if (!this.recognition) {
      alert('Voice search is not supported in your browser.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.query = '';
      this.recognition.start();
    }
  }

  ngOnInit(): void {
    this.querySubject
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q.trim()) {
            this.suggestions = [];
            return [];
          }
          return this.youtubeApi.getSuggestions(q);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((suggestions) => {
        this.suggestions = suggestions;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  focusInput(): void {
    if (this.searchInput && this.searchInput.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }

  onInputFocus(): void {
    this.isFocused = true;
    if (this.query.trim().length >= 2) {
      this.showSuggestions = true;
    } else if (this.searchHistory.history().length > 0) {
      this.showHistory = true;
    }
  }

  onInputBlur(): void {
    // Don't close if user is clicking a suggestion
    if (this.isSelectingSuggestion) {
      return;
    }
    setTimeout(() => {
      this.isFocused = false;
      this.showSuggestions = false;
      this.showHistory = false;
    }, 150);
  }

  onQueryChange(value: string): void {
    if (!value.trim()) {
      this.suggestions = [];
      this.showSuggestions = false;
      if (this.searchHistory.history().length > 0) {
        this.showHistory = true;
      }
    } else {
      this.showHistory = false;
      this.showSuggestions = true;
      this.querySubject.next(value);
    }
  }

  onSuggestionMousedown(event: MouseEvent): void {
    // Prevent the blur from firing before click registers
    event.preventDefault();
    this.isSelectingSuggestion = true;
  }

  selectSuggestion(suggestion: string): void {
    this.isSelectingSuggestion = false;
    this.query = suggestion;
    this.showSuggestions = false;
    this.showHistory = false;
    this.isFocused = false;
    // Directly emit so we bypass any debounce in app.ts
    this.search.emit(suggestion.trim());
  }

  onSearch(): void {
    const trimmed = this.query.trim();
    if (trimmed) {
      this.search.emit(trimmed);
      this.showSuggestions = false;
      this.showHistory = false;
      if (this.searchInput && this.searchInput.nativeElement) {
        this.searchInput.nativeElement.blur();
      }
    }
  }

  clearQuery(): void {
    this.query = '';
    this.suggestions = [];
    this.showSuggestions = false;
    if (this.searchHistory.history().length > 0) {
      this.showHistory = true;
    }
    this.focusInput();
  }
}
