import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { 
  LucideMusic, LucideUpload, LucideSave, 
  LucideClock, LucideEye, LucideEyeOff, 
  LucidePlus, LucideTrash2, LucideCheckCircle
} from '@lucide/angular';

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
  imports: [CommonModule, FormsModule, LucideMusic, LucideUpload, LucideSave, LucideClock, LucideEye, LucideEyeOff, LucidePlus, LucideTrash2, LucideCheckCircle],
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
    } catch (e) {
      console.error('Failed to load playlists', e);
      this.allPlaylistsData = {};
    }
  }

  updateCurrentPlaylists() {
    this.currentPlaylists = this.allPlaylistsData[this.selectedLang] || [];
  }

  onLangChange(lang: string) {
    this.selectedLang = lang;
    this.updateCurrentPlaylists();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.coverImageFile = file;
      const reader = new FileReader();
      reader.onload = e => this.coverImagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  async uploadImage(): Promise<string | null> {
    if (!this.coverImageFile) return null;
    
    this.isUploading = true;
    const formData = new FormData();
    formData.append('image', this.coverImageFile);

    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.apiUrl}?action=upload_image`, formData));
      this.isUploading = false;
      if (res.status === 'success') {
        return res.url;
      }
      throw new Error(res.message);
    } catch (e: any) {
      this.isUploading = false;
      this.fetchError = 'Image upload failed: ' + (e.message || 'Unknown error');
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
      // 1. Fetch Songs
      const allResults: YouTubeSearchResult[] = await firstValueFrom(this.youtubeApi.getBatchSongs(searchQueries));
      
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
