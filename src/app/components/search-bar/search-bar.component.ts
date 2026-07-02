import { Component, Output, EventEmitter, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap } from 'rxjs/operators';
import { LucideSearch, LucideX } from '@lucide/angular';
import { YoutubeApiService } from '../../services/youtube-api.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSearch, LucideX],
  template: `
    <div class="search-wrapper" (click)="$event.stopPropagation()">
      <div class="search-bar" [class.focused]="isFocused">
        <svg lucideSearch class="search-icon" [attr.size]="20"></svg>
        <input
          id="music-search-input"
          type="text"
          [(ngModel)]="query"
          (ngModelChange)="onQueryChange($event)"
          (focus)="onInputFocus()"
          placeholder="Search for songs, artists, albums..."
          class="search-input"
          autocomplete="off"
          (keydown.enter)="onSearch()"
        />
        <button *ngIf="query" class="clear-btn" (click)="clearQuery()" title="Clear">
          <svg lucideX [attr.size]="16"></svg>
        </button>
        <button class="search-btn" (click)="onSearch()" title="Search">
          Search
        </button>
      </div>

      <!-- Suggestions Dropdown -->
      <div class="suggestions-dropdown" *ngIf="showSuggestions && suggestions.length > 0">
        <div
          class="suggestion-item"
          *ngFor="let suggestion of suggestions"
          (click)="selectSuggestion(suggestion)"
        >
          <svg lucideSearch class="item-icon" [attr.size]="14"></svg>
          <span class="suggestion-text">{{ suggestion }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<string>();

  query = '';
  isFocused = false;
  showSuggestions = false;
  suggestions: string[] = [];

  private querySubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private youtubeApi: YoutubeApiService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // 250ms fast debounce for instant suggestions
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

  onQueryChange(value: string): void {
    if (!value.trim()) {
      this.suggestions = [];
      this.showSuggestions = false;
      this.search.emit('');
    } else {
      this.showSuggestions = true;
      this.querySubject.next(value);
      this.search.emit(value.trim());
    }
  }

  onInputFocus(): void {
    this.isFocused = true;
    if (this.query.trim() && this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  selectSuggestion(suggestion: string): void {
    this.query = suggestion;
    this.showSuggestions = false;
    this.onSearch();
  }

  onSearch(): void {
    this.showSuggestions = false;
    if (this.query.trim()) {
      this.search.emit(this.query.trim());
    }
  }

  clearQuery(): void {
    this.query = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.search.emit('');
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSuggestions = false;
      this.isFocused = false;
    }
  }
}
