import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';

export interface CustomPlaylist {
  id: string;
  title: string;
  language: string;
  coverImage: string;
  searchQueries: string[];
  songs: YouTubeSearchResult[];
  status: 'publish' | 'schedule' | 'private';
  publishDate?: string; // ISO date string
}

@Component({
  selector: 'app-managegt-playlists',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './managegt-playlists.html',
  styleUrls: ['./managegt-playlists.scss']
})
export class ManagegtPlaylistsComponent implements OnInit {
  languages = ['Hindi', 'English', 'Punjabi', 'Bhojpuri', 'Haryanvi', 'Tamil', 'Telugu', 'Bengali'];
  selectedLang = 'Hindi';

  // State
  allPlaylistsData: Record<string, CustomPlaylist[]> = {};
  currentPlaylists: CustomPlaylist[] = [];

  // Form State
  newPlaylistTitle = '';
  newPlaylistStatus: 'publish' | 'schedule' | 'private' = 'publish';
  newPlaylistDate = '';
  jsonInput = '';
  coverImageFile: File | null = null;
  coverImagePreview: string | ArrayBuffer | null = null;
  isUploading = false;

  // Fetching state
  isFetching = false;
  isPublishing = false;
  fetchProgress = 0;
  totalToFetch = 0;
  fetchError = '';
  publishMessage = '';

  apiUrl = window.location.origin.includes('localhost') 
    ? 'http://localhost/manageads/managegt-api.php'
    : 'https://ganatube.in/managegt-api.php'; // Updated to main domain!

  constructor(
    private http: HttpClient, 
    private youtubeApi: YoutubeApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchExistingPlaylists();
  }

  async fetchExistingPlaylists() {
    try {
      const cacheBuster = Date.now();
      this.allPlaylistsData = await firstValueFrom(this.http.get<Record<string, CustomPlaylist[]>>(`${this.apiUrl}?action=get_playlists&t=${cacheBuster}`)) || {};
      this.updateCurrentPlaylists();
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load playlists', e);
      this.allPlaylistsData = {};
      this.updateCurrentPlaylists();
      this.cdr.detectChanges();
    }
  }

  updateCurrentPlaylists() {
    this.currentPlaylists = this.allPlaylistsData[this.selectedLang] || [];
  }

  onLangChange(lang: string) {
    this.selectedLang = lang;
    this.updateCurrentPlaylists();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const compressedFile = await this.compressImage(file);
        this.coverImageFile = compressedFile;
        const reader = new FileReader();
        reader.onload = e => this.coverImagePreview = reader.result;
        reader.readAsDataURL(compressedFile);
      } catch (e) {
        console.error('Image compression failed', e);
        this.fetchError = 'Failed to process image.';
      }
    }
  }

  private compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas not supported'));
            return;
          }

          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to WebP (best for web) or JPEG
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          }, 'image/webp', 0.8);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  async uploadImage(): Promise<string | null> {
    if (!this.coverImageFile) return null;
    
    this.isUploading = true;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('image', this.coverImageFile);

    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.apiUrl}?action=upload_image`, formData));
      this.isUploading = false;
      this.cdr.detectChanges();

      if (res && res.status === 'success') {
        return res.url;
      }
      throw new Error(res ? res.message : 'Empty response from server. Make sure API URL is correct.');
    } catch (e: any) {
      this.isUploading = false;
      this.fetchError = 'Image upload failed: ' + (e.message || 'Unknown error');
      this.cdr.detectChanges();
      return null;
    }
  }

  async addPlaylist() {
    this.fetchError = '';
    this.publishMessage = '';

    if (!this.newPlaylistTitle.trim()) {
      this.fetchError = 'Please enter a playlist title';
      return;
    }

    if (!this.jsonInput.trim()) {
      this.fetchError = 'Please paste a JSON list of songs';
      return;
    }

    if (!this.coverImageFile) {
      this.fetchError = 'Please upload a cover photo';
      return;
    }

    if (this.newPlaylistStatus === 'schedule' && !this.newPlaylistDate) {
      this.fetchError = 'Please select a date and time for scheduled publish';
      return;
    }

    let searchQueries: string[] = [];
    try {
      searchQueries = JSON.parse(this.jsonInput);
      if (!Array.isArray(searchQueries)) {
        throw new Error('Must be an array');
      }
    } catch (e) {
      this.fetchError = 'Invalid JSON format. Please paste a valid JSON array like ["Song 1", "Song 2"]';
      return;
    }

    this.isFetching = true;
    this.fetchProgress = 0;
    this.totalToFetch = searchQueries.length;
    this.cdr.detectChanges();

    try {
      // 1. Fetch Songs chunk by chunk
      const allResults: YouTubeSearchResult[] = [];
      const chunkSize = 5;
      
      for (let i = 0; i < searchQueries.length; i += chunkSize) {
        const chunk = searchQueries.slice(i, i + chunkSize);
        const promises = chunk.map(async (query) => {
          try {
            const results = await firstValueFrom(
              this.youtubeApi.searchMusic(query, 1).pipe(
                timeout(5000),
                catchError(() => of([]))
              )
            );
            if (results && results.length > 0) {
              allResults.push(results[0]);
            }
          } catch (e) {
            console.error('Error fetching song', query, e);
          } finally {
            this.fetchProgress++;
            this.cdr.detectChanges();
          }
        });
        
        await Promise.all(promises);
        if (i + chunkSize < searchQueries.length) {
          await new Promise(res => setTimeout(res, 1000));
        }
      }
      
      // 2. Upload Image
      const imageUrl = await this.uploadImage();
      if (!imageUrl) {
        this.isFetching = false;
        return; // uploadImage already set the error
      }

      // 3. Create Playlist Object
      const newPlaylist: CustomPlaylist = {
        id: 'cp-' + Date.now() + Math.floor(Math.random() * 1000),
        title: this.newPlaylistTitle,
        language: this.selectedLang,
        coverImage: imageUrl,
        searchQueries: searchQueries,
        songs: allResults,
        status: this.newPlaylistStatus,
        publishDate: this.newPlaylistStatus === 'schedule' ? new Date(this.newPlaylistDate).toISOString() : undefined
      };

      // 4. Update state
      if (!this.allPlaylistsData[this.selectedLang]) {
        this.allPlaylistsData[this.selectedLang] = [];
      }
      this.allPlaylistsData[this.selectedLang].unshift(newPlaylist);
      this.updateCurrentPlaylists();

      // Reset form
      this.newPlaylistTitle = '';
      this.jsonInput = '';
      this.coverImageFile = null;
      this.coverImagePreview = null;
      this.newPlaylistStatus = 'publish';
      this.newPlaylistDate = '';
      this.fetchProgress = searchQueries.length;
      
      // Auto save
      await this.publishPlaylists();
      
      this.isFetching = false;
      this.cdr.detectChanges();
    } catch (e: any) {
      this.isFetching = false;
      this.fetchError = 'Failed to fetch songs or upload. Please check network. ' + e.message;
      this.cdr.detectChanges();
    }
  }

  deletePlaylist(index: number) {
    if (confirm('Are you sure you want to delete this playlist?')) {
      this.currentPlaylists.splice(index, 1);
      this.allPlaylistsData[this.selectedLang] = this.currentPlaylists;
      this.publishPlaylists();
    }
  }

  async publishPlaylists() {
    this.isPublishing = true;
    this.publishMessage = '';
    this.cdr.detectChanges();

    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.apiUrl}?action=save_playlists`, {
        playlistsData: this.allPlaylistsData
      }));
      if (res.status === 'success') {
        this.publishMessage = 'Playlists saved successfully!';
      } else {
        throw new Error(res.message);
      }
    } catch (e: any) {
      this.fetchError = 'Failed to save playlists. ' + (e.message || '');
    }
    this.isPublishing = false;
    this.cdr.detectChanges();
  }
}
