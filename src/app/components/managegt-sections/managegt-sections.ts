import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { firstValueFrom, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LucideChevronDown, LucideChevronUp, LucideTrash2, LucidePlus, LucideX, LucideGripVertical, LucideTrash } from '@lucide/angular';
import { SearchSongModalComponent } from '../search-song-modal/search-song-modal.component';

interface CustomSection {
  title: string;
  songs: YouTubeSearchResult[];
}

@Component({
  selector: 'app-managegt-sections',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, SearchSongModalComponent, LucideChevronDown, LucideChevronUp, LucideTrash2, LucidePlus, LucideX, LucideGripVertical, LucideTrash],
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
  newSectionTitle = '';
  jsonInput = '';
  isFetching = false;
  isPublishing = false;
  fetchProgress = 0;
  totalToFetch = 0;
  fetchError = '';
  publishMessage = '';

  expandedSectionIndex: number | null = null;
  showSearchModalForSection: number | null = null;

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

  // Expand / Collapse Section
  toggleSection(index: number) {
    if (this.expandedSectionIndex === index) {
      this.expandedSectionIndex = null;
    } else {
      this.expandedSectionIndex = index;
    }
  }

  // Delete Individual Song
  deleteSongFromSection(sectionIndex: number, songIndex: number) {
    if (confirm('Are you sure you want to remove this song from the section?')) {
      this.currentSections[sectionIndex].songs.splice(songIndex, 1);
      this.allSectionsData[this.selectedLanguage] = [...this.currentSections];
      this.updateCurrentSections();
      this.publishSections();
    }
  }

  // Add Song Modal
  openSearchModal(sectionIndex: number) {
    this.showSearchModalForSection = sectionIndex;
  }

  closeSearchModal() {
    this.showSearchModalForSection = null;
  }

  addSongToSection(song: YouTubeSearchResult) {
    if (this.showSearchModalForSection !== null) {
      this.currentSections[this.showSearchModalForSection].songs.push(song);
      this.allSectionsData[this.selectedLanguage] = [...this.currentSections];
      this.updateCurrentSections();
      this.publishSections();
      this.showSearchModalForSection = null;
      this.expandedSectionIndex = this.showSearchModalForSection;
    }
  }

  // Drag and Drop Logic
  drop(event: CdkDragDrop<CustomSection[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.currentSections, event.previousIndex, event.currentIndex);
      this.allSectionsData[this.selectedLanguage] = [...this.currentSections];
      // Close expanded section if it's dragged to avoid UI glitches
      this.expandedSectionIndex = null;
      // Defer publish so CDK drag animation completes fully before any state change triggers re-render
      setTimeout(() => this.publishSections(), 0);
    }
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
