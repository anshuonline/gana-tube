import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface FetchedSong {
  videoId: string;
  title: string;
  thumbnail: string;
  artist?: string;
}

@Component({
  selector: 'app-admin-manage-songs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-manage-songs.html',
  styleUrls: ['./admin-manage-songs.scss']
})
export class AdminManageSongsComponent {
  password = '';
  isAuthenticated = false;
  
  selectedLang = 'Hindi';
  languages = ['Hindi', 'English', 'Punjabi', 'Bhojpuri', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Haryanvi'];
  
  jsonInput = '';
  
  isFetching = false;
  fetchProgress = 0;
  totalToFetch = 0;
  
  fetchedSongs: FetchedSong[] = [];
  fetchErrors: string[] = [];
  
  isPublishing = false;
  publishMessage: string = '';
  publishError: boolean = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  login() {
    // Basic frontend check. Real check happens on the PHP server during publish.
    if (this.password === 'ganatube-admin-2026') {
      this.isAuthenticated = true;
    } else {
      alert('Incorrect Password');
    }
  }

  async fetchMetadata() {
    let queries: string[] = [];
    try {
      queries = JSON.parse(this.jsonInput);
      if (!Array.isArray(queries)) throw new Error('Must be an array');
    } catch (e) {
      alert('Invalid JSON! Please paste a valid JSON array of strings.');
      return;
    }

    this.isFetching = true;
    this.totalToFetch = queries.length;
    this.fetchProgress = 0;
    this.fetchedSongs = [];
    this.fetchErrors = [];

    // Process in chunks of 10 to speed up
    const chunkSize = 10;
    for (let i = 0; i < queries.length; i += chunkSize) {
      const chunk = queries.slice(i, i + chunkSize);
      
      const promises = chunk.map(async (query) => {
        try {
          const searchQuery = `${query} ${this.selectedLang} song`;
          const response = await this.http.get<any[]>(`${environment.backendUrl}/songs?q=${encodeURIComponent(searchQuery)}&limit=1`).toPromise();
          
          if (response && response.length > 0) {
            this.fetchedSongs.push({
              videoId: response[0].videoId,
              title: response[0].title,
              thumbnail: response[0].thumbnails?.[0]?.url || response[0].thumbnail,
              artist: response[0].artist || response[0].channelTitle
            });
          }
        } catch (e: any) {
          console.error('Failed to fetch:', query, e);
          const errMsg = e.error?.message || e.message || 'Unknown error';
          this.fetchErrors.push(`Failed to fetch "${query}": ${errMsg}`);
        }
        this.fetchProgress++;
        this.cdr.detectChanges();
      });
      
      await Promise.all(promises);
    }
    
    this.isFetching = false;
    this.cdr.detectChanges();
  }

  async publish() {
    if (this.fetchedSongs.length === 0) {
      alert('No songs to publish!');
      return;
    }

    this.isPublishing = true;
    this.publishMessage = '';

    try {
      // 1. Fetch current curated-songs.json from server
      let currentData: Record<string, any[]> = {};
      const fetchUrl = 'https://manageads.ganatube.in/curated-songs.json';
        
      try {
        currentData = await this.http.get<Record<string, any[]>>(fetchUrl).toPromise() || {};
      } catch (e) {
        console.warn('Could not fetch existing curated-songs.json, starting fresh.', e);
      }

      // 2. Update with the new fetched songs for the selected language
      currentData[this.selectedLang] = this.fetchedSongs;

      // 3. Post to save-songs.php
      const payload = {
        password: this.password,
        songsData: currentData
      };

      const submitUrl = 'https://manageads.ganatube.in/save-songs.php';

      const response = await this.http.post<any>(submitUrl, payload, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }).toPromise();

      this.publishMessage = '✅ ' + (response.message || 'Songs successfully published!');
      this.publishError = false;
    } catch (e: any) {
      console.error('Publish error', e);
      this.publishError = true;
      if (e.status === 0) {
        this.publishMessage = '❌ Failed to publish: Network error. The server (manageads.ganatube.in) cannot be reached. Please check if the subdomain is created and active on Hostinger.';
      } else {
        this.publishMessage = '❌ Failed to publish: ' + (e.error?.message || e.message || 'Unknown error');
      }
    } finally {
      this.isPublishing = false;
      this.cdr.detectChanges();
    }
  }
}
