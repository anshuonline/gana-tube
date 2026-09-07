import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { 
  LucideSave, LucideCheckCircle, LucideXCircle, LucideSearch, 
  LucideGripVertical, LucideTrash2, LucidePlus, LucideX, LucideImage
} from '@lucide/angular';

interface HeroItem extends YouTubeSearchResult {
  badge?: string;
  artist?: string;
}

@Component({
  selector: 'app-managegt-discovery',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DragDropModule, 
    LucideSave, LucideCheckCircle, LucideXCircle, LucideSearch,
    LucideGripVertical, LucideTrash2, LucidePlus, LucideX, LucideImage
  ],
  templateUrl: './managegt-discovery.html',
  styleUrls: ['./managegt-discovery.scss']
})
export class ManagegtDiscoveryComponent implements OnInit {
  
  private apiUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') 
    ? 'http://localhost/manageads/managegt-api.php' 
    : 'https://manageads.ganatube.in/managegt-api.php';

  heroItems: HeroItem[] = [];
  feedItems: YouTubeSearchResult[] = [];

  // Search state
  searchQuery: string = '';
  searchResults: YouTubeSearchResult[] = [];
  isSearching: boolean = false;
  hasSearched: boolean = false;

  // Save state
  isSaving: boolean = false;
  saveSuccess: boolean = false;
  saveError: string = '';

  editMode: 'visual' | 'json' = 'visual';
  jsonInput: string = '';

  activeTab: 'hero' | 'feed' = 'hero';

  constructor(
    private http: HttpClient,
    private youtubeApi: YoutubeApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDiscoverySongs();
  }

  loadDiscoverySongs() {
    this.http.get<any>(`${this.apiUrl}?action=get_discovery`).subscribe({
      next: (data) => {
        if (data) {
          this.jsonInput = JSON.stringify(data, null, 2);
          if (Array.isArray(data)) {
            // Legacy flat array: default to feed items
            this.feedItems = data;
            this.heroItems = [];
          } else {
            this.heroItems = data.heroItems || [];
            this.feedItems = data.feedItems || [];
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.saveError = 'Failed to load discovery songs.';
      }
    });
  }

  setMode(mode: 'visual' | 'json') {
    if (mode === 'json') {
      this.syncVisualToJson();
    } else {
      this.syncJsonToVisual();
    }
    this.editMode = mode;
  }

  syncVisualToJson() {
    const payload = {
      heroItems: this.heroItems,
      feedItems: this.feedItems
    };
    this.jsonInput = JSON.stringify(payload, null, 2);
  }

  syncJsonToVisual() {
    try {
      const parsed = JSON.parse(this.jsonInput);
      if (Array.isArray(parsed)) {
        this.feedItems = parsed;
        this.heroItems = [];
      } else if (parsed && typeof parsed === 'object') {
        this.heroItems = parsed.heroItems || [];
        this.feedItems = parsed.feedItems || [];
      }
      this.saveError = '';
    } catch (e: any) {
      this.saveError = 'Invalid JSON: ' + e.message;
    }
  }

  performSearch() {
    if (!this.searchQuery.trim()) return;
    
    this.isSearching = true;
    this.hasSearched = true;
    this.searchResults = [];
    
    this.youtubeApi.searchMusic(this.searchQuery, 30).subscribe({
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

  addToHero(song: YouTubeSearchResult) {
    // Check if exists
    if (!this.heroItems.some(item => item.videoId === song.videoId)) {
      this.heroItems.push({
        ...song,
        badge: 'TRENDING NOW',
        artist: song.channelTitle
      });
    }
  }

  addToFeed(song: YouTubeSearchResult) {
    if (!this.feedItems.some(item => item.videoId === song.videoId)) {
      this.feedItems.push(song);
    }
  }

  removeFromHero(index: number) {
    this.heroItems.splice(index, 1);
  }

  removeFromFeed(index: number) {
    this.feedItems.splice(index, 1);
  }

  dropHero(event: CdkDragDrop<HeroItem[]>) {
    moveItemInArray(this.heroItems, event.previousIndex, event.currentIndex);
  }

  dropFeed(event: CdkDragDrop<YouTubeSearchResult[]>) {
    moveItemInArray(this.feedItems, event.previousIndex, event.currentIndex);
  }

  save() {
    if (this.editMode === 'json') {
      this.syncJsonToVisual();
      if (this.saveError) return; // JSON parsing failed
    }

    this.isSaving = true;
    this.saveError = '';
    this.saveSuccess = false;

    const payload = {
      heroItems: this.heroItems,
      feedItems: this.feedItems
    };

    this.http.post<{status: string, message?: string}>(`${this.apiUrl}?action=save_discovery`, {
      discoveryData: payload
    }).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.saveSuccess = true;
          setTimeout(() => this.saveSuccess = false, 3000);
        } else {
          this.saveError = res.message || 'Unknown error occurred';
        }
      },
      error: () => {
        this.isSaving = false;
        this.saveError = 'Failed to save data. Please check network.';
      }
    });
  }
}
