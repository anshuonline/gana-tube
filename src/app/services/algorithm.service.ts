import { Injectable } from '@angular/core';
import { YoutubeApiService, YouTubeSearchResult } from './youtube-api.service';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface HistoryEntry extends YouTubeSearchResult {
  listened_at: number;
  listen_duration_sec: number;
  engagement_score: number;
  skipped: boolean;
  listen_count: number;
}

export interface UserProfile {
  version: number;
  created_at: number;
  last_session: number;
  history: HistoryEntry[];
  taste_profile: {
    genre_scores: Record<string, number>;
    artist_scores: Record<string, number>;
  };
  liked_songs: string[]; // array of videoIds
  disliked_songs: string[]; // array of videoIds
  search_history: string[];
}

export interface ShelfDefinition {
  title: string;
  query: string;
  songs?: YouTubeSearchResult[];
}

@Injectable({
  providedIn: 'root'
})
export class AlgorithmService {
  private profileKey = 'gt_user_profile';
  private profile: UserProfile;

  constructor(private youtubeApi: YoutubeApiService) {
    this.profile = this.loadProfile();
  }

  private loadProfile(): UserProfile {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.profileKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.version === 1) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse user profile', e);
    }
    
    // Default fresh profile
    return {
      version: 1,
      created_at: Date.now(),
      last_session: Date.now(),
      history: [],
      taste_profile: {
        genre_scores: {},
        artist_scores: {}
      },
      liked_songs: [],
      disliked_songs: [],
      search_history: []
    };
  }

  private saveProfile(): void {
    this.profile.last_session = Date.now();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.profileKey, JSON.stringify(this.profile));
      }
    } catch (e) {
      console.warn('Failed to save user profile (quota exceeded?)', e);
      // Fallback: clear older history to save space
      if (this.profile.history.length > 50) {
        this.profile.history = this.profile.history.slice(0, 50); // keep newest 50
        try {
          localStorage.setItem(this.profileKey, JSON.stringify(this.profile));
        } catch(e2) {}
      }
    }
  }

  // --- Core Tracking Logic ---

  public trackEngagement(song: YouTubeSearchResult, listenDurationSec: number, totalDurationSec: number = 240): void {
    if (!song || !song.videoId) return;

    let score = 0;
    const completionRatio = listenDurationSec / Math.max(totalDurationSec, 1);
    let skipped = false;

    if (listenDurationSec < 5) {
      score = -0.8;
      skipped = true;
    } else if (listenDurationSec < 15) {
      score = -0.3;
      skipped = true;
    } else if (listenDurationSec < 30) {
      score = 0.0;
    } else if (completionRatio < 0.5) {
      score = 0.3;
    } else if (completionRatio < 0.85) {
      score = 0.6;
    } else {
      score = 1.0;
    }

    // Check if repeat
    const existingEntryIndex = this.profile.history.findIndex(h => h.videoId === song.videoId);
    let listenCount = 1;

    if (existingEntryIndex >= 0) {
      const prevEntry = this.profile.history[existingEntryIndex];
      listenCount = prevEntry.listen_count + 1;
      score += 0.5; // Repeat bonus
      this.profile.history.splice(existingEntryIndex, 1); // Remove to push to front
    }

    if (this.profile.liked_songs.includes(song.videoId)) {
      score += 1.0; // Liked bonus
    }

    const historyEntry: HistoryEntry = {
      ...song,
      listened_at: Date.now(),
      listen_duration_sec: listenDurationSec,
      engagement_score: score,
      skipped: skipped,
      listen_count: listenCount
    };

    this.profile.history.unshift(historyEntry); // Add to beginning (most recent)
    
    // Cap history
    if (this.profile.history.length > 200) {
      this.profile.history.pop();
    }

    this.updateTasteProfile(song, score);
    this.saveProfile();
  }

  private updateTasteProfile(song: YouTubeSearchResult, score: number): void {
    const titleLower = song.title.toLowerCase();
    const tags = [];
    if (titleLower.includes('lofi') || titleLower.includes('lo-fi') || titleLower.includes('chill')) tags.push('lofi');
    if (titleLower.includes('romantic') || titleLower.includes('love')) tags.push('romantic');
    if (titleLower.includes('sad') || titleLower.includes('heartbreak') || titleLower.includes('dard')) tags.push('sad');
    if (titleLower.includes('party') || titleLower.includes('dance') || titleLower.includes('remix')) tags.push('party');
    if (titleLower.includes('punjabi')) tags.push('punjabi');
    if (titleLower.includes('bollywood') || song.channelTitle.toLowerCase().includes('t-series')) tags.push('bollywood');
    if (tags.length === 0) tags.push('general');

    const artist = song.channelTitle;

    tags.forEach(tag => {
      this.profile.taste_profile.genre_scores[tag] = (this.profile.taste_profile.genre_scores[tag] || 0) + score;
    });

    if (artist) {
      this.profile.taste_profile.artist_scores[artist] = (this.profile.taste_profile.artist_scores[artist] || 0) + score;
    }
  }

  public toggleLike(song: YouTubeSearchResult): boolean {
    const idx = this.profile.liked_songs.indexOf(song.videoId);
    let isLiked = false;
    
    if (idx >= 0) {
      this.profile.liked_songs.splice(idx, 1);
    } else {
      this.profile.liked_songs.push(song.videoId);
      isLiked = true;
      this.updateTasteProfile(song, 2.0);
    }
    this.saveProfile();
    return isLiked;
  }

  public isLiked(videoId: string): boolean {
    return this.profile.liked_songs.includes(videoId);
  }

  public getVariableRewardShelves(language: string = 'Hindi'): Observable<ShelfDefinition[]> {
    // User requested to remove all dynamic/algorithmic shelves
    // Custom sections from the admin panel will be the only ones shown.
    return of([]);
  }

  public getAutoplayQueue(currentTrack: YouTubeSearchResult): Observable<YouTubeSearchResult[]> {
    const query = currentTrack.channelTitle + " songs like " + currentTrack.title;
    return this.youtubeApi.searchMusic(query, 10);
  }
}
