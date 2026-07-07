import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfileData {
  email: string;
  preferred_languages: string[];
  liked_songs: string[];
  listening_preferences: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://manageads.ganatube.in/user-api.php';
  
  // State for the logged-in user
  preferredLanguages = signal<string[]>(['Hindi', 'English', 'Tamil', 'Punjabi']);
  likedSongs = signal<string[]>([]);
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
        if (response.listening_preferences) {
          this.listeningPreferences.set(response.listening_preferences);
        }
        return {
          email: email,
          preferred_languages: response.preferred_languages || [],
          liked_songs: response.liked_songs || [],
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
  async toggleLike(email: string, songId: string, currentLangs: string[]) {
    if (!email) return;

    let currentLikes = [...this.likedSongs()];
    if (currentLikes.includes(songId)) {
      currentLikes = currentLikes.filter(id => id !== songId);
    } else {
      currentLikes.push(songId);
    }
    
    this.likedSongs.set(currentLikes);
    
    await this.syncProfile({
      email: email,
      preferred_languages: currentLangs,
      liked_songs: currentLikes,
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
      listening_preferences: currentPrefs
    });
  }
}
