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

  public getVariableRewardShelves(): Observable<ShelfDefinition[]> {
    const topArtists = Object.entries(this.profile.taste_profile.artist_scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    const shelves: ShelfDefinition[] = [];

    // Context-Aware Naming
    const hour = new Date().getHours();
    let timeGreeting = "Day";
    let timeQuery = "bollywood hits";
    
    if (hour >= 6 && hour < 12) {
      timeGreeting = "Morning Boost ☀️";
      timeQuery = "morning motivation hindi songs";
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = "Afternoon Vibes 🎵";
      timeQuery = "latest pop hindi songs";
    } else if (hour >= 17 && hour < 21) {
      timeGreeting = "Evening Melodies 🌆";
      timeQuery = "romantic evening hindi songs";
    } else {
      timeGreeting = "Late Night Feels 🌙";
      timeQuery = "lofi sad hindi songs";
    }

    shelves.push({
      title: "Your " + timeGreeting,
      query: timeQuery
    });

    if (this.profile.history.length < 3) {
      // New user - Safe defaults
      shelves.push({ title: "🔥 Trending Right Now", query: "trending hindi songs today" });
      shelves.push({ title: "Trending Punjabi", query: "latest punjabi hits" });
      shelves.push({ title: "Bollywood Party", query: "bollywood dance hits" });
      shelves.push({ title: "Romantic Melodies", query: "best romantic hindi songs" });
    } else {
      // Personalized shelves
      if (topArtists.length > 0) {
        shelves.push({
          title: "Because you like " + topArtists[0],
          query: topArtists[0] + " songs"
        });
      }

      shelves.push({
        title: "Made For You 💜",
        query: topArtists.length > 1 ? (topArtists[1] + " hits") : "trending hindi songs"
      });

      shelves.push({
        title: "Fresh Finds For You ✨",
        query: "new release hindi pop songs"
      });

      shelves.push({
        title: "India's Top Hits 🇮🇳",
        query: "top 50 hindi songs india"
      });
    }

    // Append 20 additional curated shelves for infinite scrolling depth
    shelves.push(
      { title: '🕉️ Hindu Lofi & Chill', query: 'Hindu Lofi Bhakti Songs' },
      { title: '☕ Lo-Fi Chill Beats', query: 'lo-fi chill beats hindi' },
      { title: '🎸 Indie Pop Hits', query: 'Indian Indie Pop' },
      { title: '🌙 Late Night Vibes', query: 'Late Night Hindi Songs' },
      { title: '🎶 90s Golden Hits', query: '90s Bollywood Hits' },
      { title: '🎤 Arijit Singh Essentials', query: 'Arijit Singh Hits' },
      { title: '⚡ Workout Energy', query: 'Workout Music India' },
      { title: '🌧️ Monsoon Magic', query: 'Rainy Day Melodies India' },
      { title: '🕌 Ghazal Classics', query: 'Best Hindi Ghazals' },
      { title: '🕉️ Devotional Peace', query: 'Bhakti Bhajan Songs' },
      { title: '🎻 Classical Instrumental', query: 'Indian Classical Instrumental' },
      { title: '🎧 Hip Hop India', query: 'Desi Hip Hop Hits' },
      { title: '🎵 Acoustic Unplugged', query: 'Hindi Acoustic Unplugged' },
      { title: '💔 Sad Love Songs', query: 'Hindi Sad Melodies' },
      { title: '🌟 AR Rahman Masterpieces', query: 'AR Rahman Best Songs' },
      { title: '🔥 Badshah Party Hits', query: 'Badshah Honey Singh Party Hits' },
      { title: '🌴 Travel Playlist', query: 'Road Trip Hindi Songs' },
      { title: '💐 Evergreen Duets', query: 'Old Hindi Duet Hits' },
      { title: '🎹 Lata & Kishore Hits', query: 'Lata Mangeshkar Kishore Kumar Hits' },
      { title: '✨ Shreya Ghoshal Hits', query: 'Shreya Ghoshal Hits' }
    );

    return of(shelves);
  }

  public getAutoplayQueue(currentTrack: YouTubeSearchResult): Observable<YouTubeSearchResult[]> {
    const query = currentTrack.channelTitle + " songs like " + currentTrack.title;
    return this.youtubeApi.searchMusic(query, 10);
  }
}
