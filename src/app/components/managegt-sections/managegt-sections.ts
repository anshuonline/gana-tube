import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { firstValueFrom, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

interface CustomSection {
  title: string;
  songs: YouTubeSearchResult[];
}

@Component({
  selector: 'app-managegt-sections',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  apiUrl = window.location.origin.includes('localhost') 
    ? 'http://localhost/manageads/managegt-api.php'
    : 'https://manageads.ganatube.in/managegt-api.php';

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

  // Drag and Drop Logic
  draggedIndex: number | null = null;

  onDragStart(index: number, event: DragEvent) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnter(event: DragEvent) {
    event.preventDefault(); // Necessary for some browsers to allow dropping
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow dropping
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(dropIndex: number, event: DragEvent) {
    event.preventDefault();
    if (this.draggedIndex !== null && this.draggedIndex !== dropIndex) {
      // Reorder array
      const item = this.currentSections.splice(this.draggedIndex, 1)[0];
      this.currentSections.splice(dropIndex, 0, item);
      
      // Update data and save
      this.allSectionsData[this.selectedLanguage] = [...this.currentSections];
      this.updateCurrentSections();
      this.publishSections();
    }
    this.draggedIndex = null;
  }

  async addSection() {
    if (!this.newSectionTitle.trim()) {
      this.fetchError = 'Please enter a section title.';
      return;
    }

    let songQueries: string[] = [];
    try {
      songQueries = JSON.parse(this.jsonInput);
      if (!Array.isArray(songQueries)) throw new Error('Must be an array');
    } catch (e) {
      this.fetchError = 'Invalid JSON array format.';
      return;
    }

    this.isFetching = true;
    this.fetchError = '';
    this.publishMessage = '';
    this.fetchProgress = 0;
    this.totalToFetch = songQueries.length;
    
    const fetchedSongs: YouTubeSearchResult[] = [];

    // Chunk size
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
      
      // Delay to avoid rate limiting
      if (i + chunkSize < songQueries.length) {
        await new Promise(res => setTimeout(res, 1000));
      }
    }

    this.isFetching = false;

    if (fetchedSongs.length > 0) {
      const newSection: CustomSection = {
        title: this.newSectionTitle.trim(),
        songs: fetchedSongs
      };
      
      if (!this.allSectionsData[this.selectedLanguage]) {
        this.allSectionsData[this.selectedLanguage] = [];
      }
      
      this.allSectionsData[this.selectedLanguage] = [
        ...this.allSectionsData[this.selectedLanguage], 
        newSection
      ];
      this.updateCurrentSections();
      
      this.publishSections(true); // Automatically publish after fetch
    } else {
      this.fetchError = 'Failed to fetch any songs from the provided JSON.';
    }
  }

  async publishSections(fromAdd = false) {
    this.isPublishing = true;
    this.publishMessage = 'Publishing...';
    
    try {
      const response = await firstValueFrom(this.http.post<any>(`${this.apiUrl}?action=save_sections`, {
        sectionsData: this.allSectionsData
      }, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }));

      this.isPublishing = false;
      this.publishMessage = '✅ Successfully updated live sections!';
      
      if (fromAdd) {
        this.newSectionTitle = '';
        this.jsonInput = '';
        setTimeout(() => this.publishMessage = '', 3000);
      }
    } catch (e: any) {
      this.isPublishing = false;
      this.publishMessage = '❌ Failed to publish: ' + (e.error?.message || e.message || 'Unknown error');
    }
  }
}
