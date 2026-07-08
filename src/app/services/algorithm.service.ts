import { Injectable } from '@angular/core';
import { YoutubeApiService, YouTubeSearchResult } from './youtube-api.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
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

  constructor(
    private youtubeApi: YoutubeApiService,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.profile = this.loadProfile();
  }

  public syncFromBackend(likedSongs: any[], searchHistory: string[]) {
    if (likedSongs && Array.isArray(likedSongs)) {
      this.profile.liked_songs = likedSongs.map(song => {
        return typeof song === 'string' ? song : (song.videoId || song.id);
      }).filter(Boolean);
    } else {
      this.profile.liked_songs = [];
    }
    
    if (searchHistory && searchHistory.length > 0) {
      this.profile.search_history = searchHistory;
    }
    this.saveProfile();
  }

  private triggerBackendSync(): void {
    const user = this.authService.currentUser();
    if (user && user.email) {
      this.userService.syncProfile({
        email: user.email,
        preferred_languages: this.userService.preferredLanguages ? this.userService.preferredLanguages() : [],
        liked_songs: this.profile.liked_songs,
        recent_plays: this.userService.recentPlays ? this.userService.recentPlays() : [],
        listening_preferences: this.profile.search_history // We map search_history to listening_preferences
      });
    }
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
    this.triggerBackendSync();
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
    const topArtists = Object.entries(this.profile.taste_profile.artist_scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    const randomYear = [2022, 2023, 2024, 2025, 2026][Math.floor(Math.random() * 5)];
    const randomVibe = ['hits', 'trending', 'viral', 'best of', 'new releases', 'top'][Math.floor(Math.random() * 6)];
    const randomModifier = topArtists.length > 0 ? ` ${topArtists[Math.floor(Math.random() * topArtists.length)]}` : '';

    const shelves: ShelfDefinition[] = [
      {
        title: "Suggested for You",
        query: `${randomVibe} ${language} songs ${randomYear}${randomModifier}`
      }
    ];

    // Context-Aware Naming
    const hour = new Date().getHours();
    let timeGreeting = "Day";
    let timeQuery = `popular ${language} hits`;
    
    if (hour >= 6 && hour < 12) {
      timeGreeting = "Morning Boost ☀️";
      const mornings = ['morning motivation', 'morning chill', 'waking up', 'fresh morning'];
      timeQuery = `${mornings[Math.floor(Math.random() * mornings.length)]} ${language} songs`;
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = "Afternoon Vibes 🎵";
      const afternoons = ['afternoon drive', 'pop', 'upbeat', 'feel good'];
      timeQuery = `${afternoons[Math.floor(Math.random() * afternoons.length)]} ${language} songs`;
    } else if (hour >= 17 && hour < 21) {
      timeGreeting = "Evening Melodies 🌆";
      const evenings = ['evening romantic', 'unplugged', 'sunset chill', 'acoustic'];
      timeQuery = `${evenings[Math.floor(Math.random() * evenings.length)]} ${language} songs ${randomYear}`;
    } else {
      timeGreeting = "Late Night Feels 🌙";
      const nights = ['late night lofi', 'midnight chill', 'night drive', 'sleep relaxing'];
      timeQuery = `${nights[Math.floor(Math.random() * nights.length)]} ${language} songs`;
    }

    shelves.push({
      title: "Your " + timeGreeting,
      query: timeQuery
    });

    if (this.profile.history.length < 3) {
      // New user - keep exactly 2 default playlists
      const newUsers1 = ['trending', 'viral', 'top charts'];
      shelves.push({ title: `Trending ${language} Hits 🔥`, query: `${newUsers1[Math.floor(Math.random() * newUsers1.length)]} ${language} songs today` });
      
      const newUsers2 = ['all time best', 'classic hits', 'golden era'];
      shelves.push({ title: "All-Time Blockbusters 🎵", query: `${newUsers2[Math.floor(Math.random() * newUsers2.length)]} ${language} songs` });
    } else {
      // Personalized shelves
      if (topArtists.length > 0) {
        const topModifiers = ['hits', 'live', 'best songs', 'audio'];
        shelves.push({
          title: "Because you like " + topArtists[0],
          query: topArtists[0] + " " + topModifiers[Math.floor(Math.random() * topModifiers.length)]
        });
      }

      const madeForYouModifiers = ['hits', 'mashup', 'remix', 'jukebox'];
      shelves.push({
        title: "Made For You 💜",
        query: topArtists.length > 1 ? (topArtists[1] + " " + madeForYouModifiers[Math.floor(Math.random() * madeForYouModifiers.length)]) : `trending ${language} songs ${randomYear}`
      });

      const freshModifiers = ['new release', 'latest', 'brand new'];
      shelves.push({
        title: "Fresh Finds For You ✨",
        query: `${freshModifiers[Math.floor(Math.random() * freshModifiers.length)]} ${language} pop songs`
      });
    }

    return of(shelves);
  }

  public getAutoplayQueue(currentTrack: YouTubeSearchResult): Observable<YouTubeSearchResult[]> {
    const query = currentTrack.channelTitle + " songs like " + currentTrack.title;
    return this.youtubeApi.searchMusic(query, 10);
  }
}
