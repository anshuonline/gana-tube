import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { firstValueFrom, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LucideChevronDown, LucideChevronUp, LucideTrash2, LucidePlus, LucideX, LucideGripVertical, LucideTrash, LucideArrowLeft, LucideSearch, LucideRefreshCw, LucideCheck } from '@lucide/angular';

interface CustomSection {
  title: string;
  songs: YouTubeSearchResult[];
}

@Component({
  selector: 'app-managegt-sections',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, LucideChevronDown, LucideChevronUp, LucideTrash2, LucidePlus, LucideX, LucideGripVertical, LucideTrash, LucideArrowLeft, LucideSearch, LucideRefreshCw, LucideCheck],
  templateUrl: './managegt-sections.html',
  styleUrls: ['./managegt-sections.scss']
})
export class ManagegtSectionsComponent implements OnInit {
  languages = ['Hindi', 'English', 'Punjabi', 'Tamil', 'Telugu', 'Bengali', 'Bhojpuri'];
  selectedLanguage = 'Hindi';

  // Format: { "Hindi": [ {title: "Romantic", songs: [...]}, ... ], ... }
  allSectionsData: Record<string, CustomSection[]> = {};
  currentSections: CustomSection[] = [];

  // Add new section state
  createMode: 'simple' | 'json' = 'simple';
  newSectionTitle = '';
  jsonInput = '';
  isFetching = false;
  isPublishing = false;
  fetchProgress = 0;
  totalToFetch = 0;
  fetchError = '';
  publishMessage = '';

  activeSectionIndex: number | null = null;
  
  // Search State
  searchQuery = '';
  searchResults: YouTubeSearchResult[] = [];
  selectedSongs = new Set<string>(); // For bulk selection tracking videoIds
  isSearchingSongs = false;
  hasSearchedSongs = false;
  lazyLoadPage = 0;

  apiUrl = window.location.origin.includes('localhost') ? 'http://localhost/manageads/managegt-api.php' : 'https://manageads.ganatube.in/managegt-api.php';

  constructor(
    private http: HttpClient, 
    private youtubeApi: YoutubeApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchExistingSections();
  }

  async fetchExistingSections() {
    try {
      const cacheBuster = Date.now();
      this.allSectionsData = await firstValueFrom(this.http.get<Record<string, CustomSection[]>>(`${this.apiUrl}?action=get_sections&t=${cacheBuster}`)) || {};
      this.updateCurrentSections();
    } catch (e) {
      console.error('Failed to load sections', e);
      this.allSectionsData = {};
      this.updateCurrentSections();
    }
  }

  onLanguageChange() {
    this.updateCurrentSections();
  }

  updateCurrentSections() {
    this.currentSections = [...(this.allSectionsData[this.selectedLanguage] || [])];
  }

  deleteSection(index: number) {
    if (confirm('Are you sure you want to delete this section?')) {
      this.currentSections.splice(index, 1);
      this.allSectionsData[this.selectedLanguage] = [...this.currentSections];
      this.updateCurrentSections();
      this.publishSections();
    }
  }

  deleteAllSections() {
    if (confirm(`Are you sure you want to delete ALL custom sections for ${this.selectedLanguage}?`)) {
      this.currentSections = [];
      this.allSectionsData[this.selectedLanguage] = [];
      this.publishSections();
    }
  }

  // Master-Detail Navigation
  openSection(index: number) {
    this.activeSectionIndex = index;
    const sectionTitle = this.currentSections[index].title;
    
    // Reset search
    this.searchQuery = sectionTitle; // Pre-fill with section title for smart recommendations
    this.searchResults = [];
    this.hasSearchedSongs = false;
    this.selectedSongs.clear();
    this.lazyLoadPage = 0;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Automatically perform recommended search
    this.performSongSearch();
  }

  closeSection() {
    this.activeSectionIndex = null;
    this.selectedSongs.clear();
  }

  // Delete Individual Song
  deleteSongFromSection(songIndex: number) {
    if (this.activeSectionIndex === null) return;
    if (confirm('Are you sure you want to remove this song from the section?')) {
      this.currentSections[this.activeSectionIndex].songs.splice(songIndex, 1);
      this.allSectionsData[this.selectedLanguage] = [...this.currentSections];
      this.updateCurrentSections();
      this.publishSections();
    }
  }

  // Song Search Logic
  performSongSearch(isLoadMore = false) {
    if (!this.searchQuery.trim()) return;
    
    this.isSearchingSongs = true;
    this.hasSearchedSongs = true;
    
    if (!isLoadMore) {
      this.searchResults = [];
      this.lazyLoadPage = 0;
      this.selectedSongs.clear();
    }

    // Generate query variation for paginated search
    let queryVariation = this.searchQuery;
    if (this.lazyLoadPage === 1) queryVariation = `${this.searchQuery} songs`;
    if (this.lazyLoadPage === 2) queryVariation = `${this.searchQuery} hits`;
    if (this.lazyLoadPage === 3) queryVariation = `${this.searchQuery} audio`;

    this.youtubeApi.searchMusic(queryVariation, 50).subscribe({
      next: (results) => {
        const unique = [];
        const existingIds = new Set(this.searchResults.map(r => r.videoId));
        
        for (const r of results) {
          if (!existingIds.has(r.videoId)) {
            existingIds.add(r.videoId);
            unique.push(r);
          }
        }
        
        this.searchResults = [...this.searchResults, ...unique];
        this.isSearchingSongs = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Search error', err);
        this.isSearchingSongs = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMoreSongs() {
    if (this.lazyLoadPage >= 3 || this.isSearchingSongs) return;
    this.lazyLoadPage++;
    this.performSongSearch(true);
  }

  onSearchScroll(event: Event) {
    const target = event.target as HTMLElement;
    // Check if we are near bottom (within 50px)
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      this.loadMoreSongs();
    }
  }

  toggleSongSelection(result: YouTubeSearchResult) {
    if (this.selectedSongs.has(result.videoId)) {
      this.selectedSongs.delete(result.videoId);
    } else {
      this.selectedSongs.add(result.videoId);
    }
  }

  addSelectedSongsToSection() {
    if (this.activeSectionIndex === null || this.selectedSongs.size === 0) return;
    
    const songsToAdd = this.searchResults.filter(r => this.selectedSongs.has(r.videoId));
    
    for (const song of songsToAdd) {
      // Avoid exact duplicates
      if (!this.currentSections[this.activeSectionIndex].songs.some(s => s.videoId === song.videoId)) {
        this.currentSections[this.activeSectionIndex].songs.push({
          videoId: song.videoId,
          title: song.title,
          thumbnail: song.thumbnail,
          thumbnailHigh: song.thumbnailHigh || song.thumbnail,
          channelTitle: song.channelTitle,
          publishedAt: song.publishedAt
        });
      }
    }
    
    this.selectedSongs.clear(); // clear selection
    this.allSectionsData[this.selectedLanguage] = [...this.currentSections];
    this.publishSections();
  }

  addSongToSection(song: YouTubeSearchResult) {
    if (this.activeSectionIndex !== null) {
      this.currentSections[this.activeSectionIndex].songs.push(song);
      this.allSectionsData[this.selectedLanguage] = [...this.currentSections];
      this.updateCurrentSections();
      this.publishSections();
    }
  }

  // Drag and Drop Logic
  drop(event: CdkDragDrop<CustomSection[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.currentSections, event.previousIndex, event.currentIndex);
      this.allSectionsData[this.selectedLanguage] = [...this.currentSections];
      setTimeout(() => this.publishSections(), 0);
    }
  }

  createEmptySection() {
    if (!this.newSectionTitle.trim()) {
      this.fetchError = 'Please provide a section title.';
      return;
    }

    this.currentSections.unshift({
      title: this.newSectionTitle.trim(),
      songs: []
    });

    this.allSectionsData[this.selectedLanguage] = [...this.currentSections];
    this.publishSections();
    
    // Clear form and open the new section
    this.newSectionTitle = '';
    this.fetchError = '';
    this.openSection(0);
  }

  async addSection() {
    let inputData: any[] = [];
    try {
      inputData = JSON.parse(this.jsonInput);
      if (!Array.isArray(inputData)) throw new Error('Must be an array');
    } catch (e) {
      this.fetchError = 'Invalid JSON array format.';
      return;
    }

    // Normalize input to an array of sections
    let sectionsToProcess: { title: string, songQueries: string[] }[] = [];
    
    if (inputData.length > 0 && typeof inputData[0] === 'string') {
      // Legacy single section format
      if (!this.newSectionTitle.trim()) {
        this.fetchError = 'Please enter a section title for string array input.';
        return;
      }
      sectionsToProcess.push({ title: this.newSectionTitle.trim(), songQueries: inputData });
    } else if (inputData.length > 0 && typeof inputData[0] === 'object' && inputData[0].section_name) {
      // Multi-section format
      for (const item of inputData) {
        if (!item.section_name || !Array.isArray(item.songs)) {
          this.fetchError = 'Invalid object format. Expected { section_name: string, songs: string[] }';
          return;
        }
        sectionsToProcess.push({ title: item.section_name, songQueries: item.songs });
      }
    } else {
       this.fetchError = 'Unknown JSON format. Provide either an array of strings or array of section objects.';
       return;
    }

    this.isFetching = true;
    this.fetchError = '';
    this.publishMessage = '';
    
    // Calculate total
    this.totalToFetch = sectionsToProcess.reduce((sum, sec) => sum + sec.songQueries.length, 0);
    this.fetchProgress = 0;
    
    const newSections: CustomSection[] = [];

    // Process each section
    for (const sectionReq of sectionsToProcess) {
      const fetchedSongs: YouTubeSearchResult[] = [];
      const songQueries = sectionReq.songQueries;
      
      const chunkSize = 5;
      for (let i = 0; i < songQueries.length; i += chunkSize) {
        const chunk = songQueries.slice(i, i + chunkSize);
        
        const promises = chunk.map(async (query) => {
          try {
            const results = await firstValueFrom(
              this.youtubeApi.searchMusic(query, 1).pipe(
                timeout(5000),
                catchError((e) => {
                  console.warn('Search timed out or failed for:', query);
                  return of([]);
                })
              )
            );
            if (results && results.length > 0) {
              fetchedSongs.push(results[0]);
            }
          } catch (e) {
            console.error('Error fetching song', query, e);
          } finally {
            this.fetchProgress++;
            this.cdr.detectChanges();
          }
        });
        
        await Promise.all(promises);
        
        if (i + chunkSize < songQueries.length) {
          await new Promise(res => setTimeout(res, 1000));
        }
      }
      
      if (fetchedSongs.length > 0) {
        newSections.push({
          title: sectionReq.title,
          songs: fetchedSongs
        });
      }
    }

    this.isFetching = false;

    if (newSections.length > 0) {
      if (!this.allSectionsData[this.selectedLanguage]) {
        this.allSectionsData[this.selectedLanguage] = [];
      }
      
      this.allSectionsData[this.selectedLanguage] = [
        ...this.allSectionsData[this.selectedLanguage], 
        ...newSections
      ];
      this.updateCurrentSections();
      this.cdr.detectChanges(); // Force UI update
      
      this.publishSections(true); // Automatically publish after fetch
    } else {
      this.fetchError = 'Failed to fetch any songs from the provided JSON.';
    }
  }

  async publishSections(fromAdd = false) {
    this.isPublishing = true;
    this.publishMessage = 'Publishing...';
    
    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.apiUrl}?action=save_sections`, {
        sectionsData: this.allSectionsData
      }, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }));

      if (res && res.status === 'success') {
        this.isPublishing = false;
        this.publishMessage = '✅ Successfully updated live sections!';
        
        if (fromAdd) {
          this.newSectionTitle = '';
          this.jsonInput = '';
          setTimeout(() => {
            this.publishMessage = '';
          }, 3000);
        }
      } else {
        throw new Error(res ? res.message : 'Empty response from server. Check your adblocker or API URL.');
      }
    } catch (e: any) {
      this.isPublishing = false;
      this.publishMessage = '❌ Failed to publish: ' + (e.error?.message || e.message || 'Unknown error');
    }
  }
}
