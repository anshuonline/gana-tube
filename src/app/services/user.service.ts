import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AnalyticsService } from './analytics.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfileData {
  email: string;
  preferred_languages: string[];
  liked_songs: any[];
  recent_plays: any[];
  listening_preferences: string[];
  total_plays?: number;
  increment_play?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private analyticsService = inject(AnalyticsService);
  private apiUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost/manageads/user-api.php' : 'https://manageads.ganatube.in/user-api.php';
  
  // State for the logged-in user
  displayName = signal<string | null>(null);
  preferredLanguages = signal<string[]>(['English', 'Hindi', 'Tamil', 'Punjabi']);
  likedSongs = signal<any[]>([]);
  recentPlays = signal<any[]>([]);
  totalPlays = signal<number>(0);
  listeningPreferences = signal<string[]>([]);
  customPlaylists = signal<any[]>([]);
  isProfileLoaded = false;
  private _creatingPlaylists = new Set<string>();
  
  constructor(private http: HttpClient) {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('gt_total_plays');
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > 0) {
            this.totalPlays.set(parsed);
          }
        }
      } catch (e) {}
    }
  }

  // Load playlists from the MySQL Database
  async loadPlaylists(email: string) {
    if (!email) return;
    try {
      const url = this.apiUrl.replace('user-api.php', 'playlist-api.php');
      const response: any = await firstValueFrom(this.http.get(`${url}?action=getPlaylists&email=${encodeURIComponent(email)}`));
      if (response.status === 'success' && response.data) {
        // Map backend schema (playlist_name, songs) to frontend schema (name, tracks) for compatibility
        const mappedPlaylists = response.data.map((p: any) => ({
          playlist_id: p.playlist_id,
          name: p.playlist_name,
          is_public: p.is_public,
          tracks: p.songs || [],
          is_owner: p.is_owner,
          is_saved: !p.is_owner,
          owner: p.owner,
          playCount: p.play_count || 0
        }));
        this.customPlaylists.set(mappedPlaylists);
      }
    } catch (e) {
      console.error('Failed to load playlists from database', e);
    }
  }

  async savePlaylist(email: string, playlistId: string, playlistName?: string, songs?: any[]): Promise<boolean> {
    if (!email || !playlistId) return false;
    try {
      const url = this.apiUrl.replace('user-api.php', 'playlist-api.php');
      const response: any = await firstValueFrom(this.http.post(`${url}?action=savePlaylist`, { 
        email, 
        playlist_id: playlistId,
        playlist_name: playlistName,
        songs: songs
      }));
      if (response.status === 'success') {
        this.loadPlaylists(email); // Refresh playlists
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to save playlist', e);
      return false;
    }
  }

  async unsavePlaylist(email: string, playlistId: string): Promise<boolean> {
    if (!email || !playlistId) return false;
    try {
      const url = this.apiUrl.replace('user-api.php', 'playlist-api.php');
      const response: any = await firstValueFrom(this.http.post(`${url}?action=unsavePlaylist`, { email, playlist_id: playlistId }));
      if (response.status === 'success') {
        this.loadPlaylists(email); // Refresh playlists
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to unsave playlist', e);
      return false;
    }
  }

  async loadProfile(email: string, displayName?: string): Promise<UserProfileData | null> {
    try {
      let url = `${this.apiUrl}?action=getProfile&email=${encodeURIComponent(email)}`;
      if (displayName) {
        url += `&name=${encodeURIComponent(displayName)}`;
      }
      const response: any = await firstValueFrom(this.http.get(url));
      
      if (response.status === 'success') {
        this.isProfileLoaded = true;
        if (response.display_name !== undefined) {
          this.displayName.set(response.display_name);
        }
        if (response.liked_songs) {
          this.likedSongs.set(response.liked_songs);
        }
        let recentCount = 0;
        if (response.recent_plays) {
          const plays = Array.isArray(response.recent_plays) ? response.recent_plays.slice(0, 100) : [];
          this.recentPlays.set(plays);
          recentCount = plays.length;
        }
        if (response.listening_preferences) {
          this.listeningPreferences.set(response.listening_preferences);
        }

        const serverTotal = typeof response.total_plays === 'number' ? response.total_plays : parseInt(response.total_plays || '0', 10) || 0;
        let localTotal = 0;
        if (typeof localStorage !== 'undefined') {
          try {
            const stored = localStorage.getItem('gt_total_plays');
            if (stored) localTotal = parseInt(stored, 10) || 0;
          } catch (e) {}
        }
        const effectiveTotal = Math.max(serverTotal, localTotal, recentCount);
        this.totalPlays.set(effectiveTotal);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('gt_total_plays', effectiveTotal.toString());
          } catch (e) {}
        }

        // If local total was ahead of server total, sync it back to DB
        if (effectiveTotal > serverTotal) {
          this.syncProfile({
            email: email,
            preferred_languages: response.preferred_languages || [],
            liked_songs: response.liked_songs || [],
            recent_plays: this.recentPlays(),
            listening_preferences: response.listening_preferences || [],
            total_plays: effectiveTotal
          });
        }

        return {
          email: response.email,
          preferred_languages: response.preferred_languages || [],
          liked_songs: response.liked_songs || [],
          recent_plays: response.recent_plays || [],
          listening_preferences: response.listening_preferences || [],
          total_plays: effectiveTotal
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to load user profile from DB', error);
      return null;
    }
  }

  async sendWelcomeEmail(email: string, displayName?: string): Promise<boolean> {
    try {
      const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}?action=sendWelcomeEmail`, {
        email,
        name: displayName || ''
      }));
      return response.status === 'success';
    } catch (e) {
      console.error('Failed to send welcome email', e);
      return false;
    }
  }

  async syncProfile(data: UserProfileData): Promise<boolean> {
    try {
      if (data.total_plays === undefined && this.totalPlays() > 0) {
        data.total_plays = this.totalPlays();
      }
      const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}?action=updateProfile`, data));
      return response.status === 'success';
    } catch (error) {
      console.error('Failed to sync user profile to DB', error);
      return false;
    }
  }

  // Record guest play when not logged in
  recordGuestPlay() {
    const nextTotal = (this.totalPlays() || 0) + 1;
    this.totalPlays.set(nextTotal);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('gt_total_plays', nextTotal.toString());
      } catch (e) {}
    }
  }

  async updateUsernameInDB(email: string, displayName: string, auto: boolean = false): Promise<{ success: boolean; message?: string; display_name?: string }> {
    try {
      const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}?action=updateUsername`, {
        email,
        display_name: displayName,
        auto: auto
      }));
      return { success: response.status === 'success', message: response.message, display_name: response.display_name };
    } catch (error) {
      console.error('Failed to update username in DB', error);
      return { success: false, message: 'Server error occurred' };
    }
  }

  // Helper to quickly toggle a liked song and sync
  async toggleLike(email: string, songObj: any, currentLangs: string[]) {
    if (!email || !songObj) return;
    if (!this.isProfileLoaded) {
      setTimeout(() => this.toggleLike(email, songObj, currentLangs), 1000);
      return;
    }

    let currentLikes = [...this.likedSongs()];
    const exists = currentLikes.some(song => typeof song === 'string' ? song === songObj.videoId : song.videoId === songObj.videoId);
    
    if (exists) {
      currentLikes = currentLikes.filter(song => typeof song === 'string' ? song !== songObj.videoId : song.videoId !== songObj.videoId);
    } else {
      currentLikes.push(songObj);
      this.analyticsService.recordLike(songObj);
    }
    
    this.likedSongs.set(currentLikes);
    
    await this.syncProfile({
      email: email,
      preferred_languages: currentLangs,
      liked_songs: currentLikes,
      recent_plays: this.recentPlays(),
      listening_preferences: this.listeningPreferences()
    });
    
    return !exists;
  }

  // Helper to add to recent plays
  async addRecentPlay(email: string, songObj: any, currentLangs: string[]) {
    if (!email || !songObj) return;
    if (!this.isProfileLoaded) {
      setTimeout(() => this.addRecentPlay(email, songObj, currentLangs), 1000);
      return;
    }
    
    let plays = [...this.recentPlays()];
    // Remove if already exists so we can put it at the top
    plays = plays.filter(song => typeof song === 'string' ? song !== songObj.videoId : song.videoId !== songObj.videoId);
    
    plays.unshift(songObj);
    // Cap to maximum 100 recent plays to keep payload light, super fast, and protect server RAM
    if (plays.length > 100) {
      plays = plays.slice(0, 100);
    }
    
    this.recentPlays.set(plays);

    // Increment total plays counter
    const currentTotal = Math.max(this.totalPlays() + 1, plays.length);
    this.totalPlays.set(currentTotal);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('gt_total_plays', currentTotal.toString());
      } catch (e) {}
    }
    
    await this.syncProfile({
      email: email,
      preferred_languages: currentLangs,
      liked_songs: this.likedSongs(),
      recent_plays: plays,
      listening_preferences: this.listeningPreferences(),
      total_plays: currentTotal,
      increment_play: true
    });
  }

  // Helper to add to listening history/preferences
  async trackListeningPreference(email: string, queryOrGenre: string, currentLangs: string[]) {
    if (!email || !queryOrGenre) return;
    if (!this.isProfileLoaded) {
      setTimeout(() => this.trackListeningPreference(email, queryOrGenre, currentLangs), 1000);
      return;
    }

    let currentPrefs = [...this.listeningPreferences()];
    // Avoid duplicates, keep max 20 recent preferences
    currentPrefs = currentPrefs.filter(p => p !== queryOrGenre);
    currentPrefs.unshift(queryOrGenre);
    if (currentPrefs.length > 20) {
      currentPrefs.pop();
    }
    
    this.listeningPreferences.set(currentPrefs);
    
    // Fire and forget sync
    this.syncProfile({
      email: email,
      preferred_languages: currentLangs,
      liked_songs: this.likedSongs(),
      recent_plays: this.recentPlays(),
      listening_preferences: currentPrefs
    });
  }

  // Custom Playlists (Database)
  async createPlaylist(email: string, name: string, isPublic = false) {
    if (!email) return false;
    const current = this.customPlaylists();
    if (current.find(p => p.name === name)) return false; // Prevent duplicate names locally for quick check
    
    if (this._creatingPlaylists.has(name)) return false;
    this._creatingPlaylists.add(name);
    
    try {
      const url = this.apiUrl.replace('user-api.php', 'playlist-api.php');
      const response: any = await firstValueFrom(this.http.post(`${url}?action=createPlaylist`, {
        email: email,
        playlist_name: name,
        is_public: isPublic ? 1 : 0,
        songs: []
      }));
      
      this._creatingPlaylists.delete(name);
      
      if (response.status === 'success' && response.data) {
        const p = response.data;
        const newPlaylists = [...this.customPlaylists(), {
          playlist_id: p.playlist_id,
          name: p.playlist_name,
          is_public: p.is_public,
          tracks: p.songs || []
        }];
        this.customPlaylists.set(newPlaylists);
        return true;
      }
    } catch (e) {
      console.error('Error creating playlist', e);
      this._creatingPlaylists.delete(name);
    }
    return false;
  }

  async deletePlaylist(email: string, playlist_id: string): Promise<boolean> {
    try {
      const url = this.apiUrl.replace('user-api.php', 'playlist-api.php');
      const response = await fetch(`${url}?action=deletePlaylist`, {
        method: 'POST',
        body: JSON.stringify({ email, playlist_id })
      });
      const data = await response.json();
      if (data.status === 'success') {
        this.loadPlaylists(email); // Refresh playlists
        return true;
      }
      return false;
    } catch(e) {
      console.error("Error deleting playlist:", e);
      return false;
    }
  }

  async addToPlaylist(email: string, playlistIdOrName: string, track: any) {
    if (!email) return;
    const current = [...this.customPlaylists()];
    // Find by ID first, then by name for backward compatibility during transition
    let pIdx = current.findIndex(p => p.playlist_id === playlistIdOrName);
    if (pIdx < 0) pIdx = current.findIndex(p => p.name === playlistIdOrName);
    
    if (pIdx >= 0) {
      const trackIndex = current[pIdx].tracks.findIndex((t: any) => t.videoId === track.videoId);
      
      if (trackIndex >= 0) {
        // Track exists, remove it
        current[pIdx].tracks.splice(trackIndex, 1);
      } else {
        // Track doesn't exist, add it
        current[pIdx].tracks.unshift(track);
      }
      
      this.customPlaylists.set(current);
      
      // Sync to database
      if (current[pIdx].playlist_id) {
        try {
          const url = this.apiUrl.replace('user-api.php', 'playlist-api.php');
          await firstValueFrom(this.http.post(`${url}?action=updatePlaylist`, {
            email: email,
            playlist_id: current[pIdx].playlist_id,
            songs: current[pIdx].tracks
          }));
        } catch (e) {
          console.error('Error updating playlist in DB', e);
        }
      }
    }
  }
}
