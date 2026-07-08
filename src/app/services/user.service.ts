import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfileData {
  email: string;
  preferred_languages: string[];
  liked_songs: any[];
  recent_plays: any[];
  listening_preferences: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost/manageads/user-api.php' : 'https://manageads.ganatube.in/user-api.php';
  
  // State for the logged-in user
  preferredLanguages = signal<string[]>(['Hindi', 'English', 'Tamil', 'Punjabi']);
  likedSongs = signal<any[]>([]);
  recentPlays = signal<any[]>([]);
  listeningPreferences = signal<string[]>([]);
  
  constructor(private http: HttpClient) {
    if (!environment.production) {
      // In local dev, use the local XAMPP backend if preferred, 
      // otherwise it will just hit the production backend url from environment.
      // this.apiUrl = 'http://localhost/manageads/user-api.php';
    }
  }

  async loadProfile(email: string): Promise<UserProfileData | null> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}?action=getProfile&email=${encodeURIComponent(email)}`));
      
      if (response.status === 'success') {
        if (response.liked_songs) {
          this.likedSongs.set(response.liked_songs);
        }
        if (response.recent_plays) {
          this.recentPlays.set(response.recent_plays);
        }
        if (response.listening_preferences) {
          this.listeningPreferences.set(response.listening_preferences);
        }
        return {
          email: response.email,
          preferred_languages: response.preferred_languages || [],
          liked_songs: response.liked_songs || [],
          recent_plays: response.recent_plays || [],
          listening_preferences: response.listening_preferences || []
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to load user profile from DB', error);
      return null;
    }
  }

  async syncProfile(data: UserProfileData): Promise<boolean> {
    try {
      const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}?action=updateProfile`, data));
      return response.status === 'success';
    } catch (error) {
      console.error('Failed to sync user profile to DB', error);
      return false;
    }
  }

  // Helper to quickly toggle a liked song and sync
  async toggleLike(email: string, songObj: any, currentLangs: string[]) {
    if (!email || !songObj) return;

    let currentLikes = [...this.likedSongs()];
    const exists = currentLikes.some(song => typeof song === 'string' ? song === songObj.videoId : song.videoId === songObj.videoId);
    
    if (exists) {
      currentLikes = currentLikes.filter(song => typeof song === 'string' ? song !== songObj.videoId : song.videoId !== songObj.videoId);
    } else {
      currentLikes.push(songObj);
    }
    
    this.likedSongs.set(currentLikes);
    
    await this.syncProfile({
      email: email,
      preferred_languages: currentLangs,
      liked_songs: currentLikes,
      recent_plays: this.recentPlays(),
      listening_preferences: this.listeningPreferences()
    });
  }

  // Helper to add to recent plays
  async addRecentPlay(email: string, songObj: any, currentLangs: string[]) {
    if (!email || !songObj) return;
    
    let plays = [...this.recentPlays()];
    // Remove if already exists so we can put it at the top
    plays = plays.filter(song => typeof song === 'string' ? song !== songObj.videoId : song.videoId !== songObj.videoId);
    
    plays.unshift(songObj);
    if (plays.length > 20) {
      plays = plays.slice(0, 20); // Keep max 20 recent plays
    }
    
    this.recentPlays.set(plays);
    
    await this.syncProfile({
      email: email,
      preferred_languages: currentLangs,
      liked_songs: this.likedSongs(),
      recent_plays: plays,
      listening_preferences: this.listeningPreferences()
    });
  }

  // Helper to add to listening history/preferences
  async trackListeningPreference(email: string, queryOrGenre: string, currentLangs: string[]) {
    if (!email || !queryOrGenre) return;

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
}
