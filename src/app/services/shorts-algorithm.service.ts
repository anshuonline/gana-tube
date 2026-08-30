import { Injectable } from '@angular/core';
import { YouTubeSearchResult } from './youtube-api.service';

export interface ShortsProfile {
  version: number;
  last_session: number;
  taste_profile: {
    genre_scores: Record<string, number>;
    artist_scores: Record<string, number>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ShortsAlgorithmService {
  private profileKey = 'gt_shorts_profile';
  private profile: ShortsProfile;

  constructor() {
    this.profile = this.loadProfile();
  }

  private loadProfile(): ShortsProfile {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.profileKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.version === 1) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse shorts profile', e);
    }
    
    return {
      version: 1,
      last_session: Date.now(),
      taste_profile: {
        genre_scores: {},
        artist_scores: {}
      }
    };
  }

  private saveProfile(): void {
    this.profile.last_session = Date.now();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.profileKey, JSON.stringify(this.profile));
      }
    } catch (e) {}
  }

  public trackEngagement(song: YouTubeSearchResult, listenDurationSec: number, totalDurationSec: number = 30): void {
    if (!song || !song.videoId) return;

    let score = 0;
    
    // Shorts are typically max 60s, we consider completion if they watch 15-30s
    if (listenDurationSec < 4) {
      score = -1.0; // High penalty for fast skip
    } else if (listenDurationSec < 10) {
      score = -0.2; // Slight penalty
    } else if (listenDurationSec >= 15) {
      score = +1.0; // Good engagement
    }
    
    this.updateTasteProfile(song, score);
    this.saveProfile();
  }
  
  public rewardLike(song: YouTubeSearchResult): void {
    // Super reward when user likes a short
    this.updateTasteProfile(song, 2.0);
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

  public isValidLanguageTrack(title: string, channelTitle: string, allowedLanguages: string[] = ['Hindi']): boolean {
    if (!allowedLanguages || allowedLanguages.length === 0) allowedLanguages = ['Hindi'];
    
    const textLower = (title + ' ' + channelTitle).toLowerCase();
    
    // Check for non-selected Indian language scripts
    const hasTamilScript = /[\u0B80-\u0BFF]/.test(textLower);
    const hasTeluguScript = /[\u0C00-\u0C7F]/.test(textLower);
    const hasMalayalamScript = /[\u0D00-\u0D7F]/.test(textLower);
    const hasKannadaScript = /[\u0C80-\u0CFF]/.test(textLower);
    const hasBengaliScript = /[\u0980-\u09FF]/.test(textLower);
    
    const isTamilSelected = allowedLanguages.some(l => l.toLowerCase() === 'tamil');
    const isTeluguSelected = allowedLanguages.some(l => l.toLowerCase() === 'telugu');
    const isMalayalamSelected = allowedLanguages.some(l => l.toLowerCase() === 'malayalam');
    const isKannadaSelected = allowedLanguages.some(l => l.toLowerCase() === 'kannada');
    const isBengaliSelected = allowedLanguages.some(l => l.toLowerCase() === 'bengali');
    
    if (hasTamilScript && !isTamilSelected) return false;
    if (hasTeluguScript && !isTeluguSelected) return false;
    if (hasMalayalamScript && !isMalayalamSelected) return false;
    if (hasKannadaScript && !isKannadaSelected) return false;
    if (hasBengaliScript && !isBengaliSelected) return false;
    
    // Check explicit non-matching language tags in title
    const nonMatchingTags: { tag: string; lang: string }[] = [
      { tag: 'tamil', lang: 'Tamil' },
      { tag: 'telugu', lang: 'Telugu' },
      { tag: 'malayalam', lang: 'Malayalam' },
      { tag: 'kannada', lang: 'Kannada' },
      { tag: 'bengali', lang: 'Bengali' },
      { tag: 'marathi', lang: 'Marathi' }
    ];
    
    for (const item of nonMatchingTags) {
      const isSelected = allowedLanguages.some(l => l.toLowerCase() === item.tag);
      if (!isSelected) {
        const regex = new RegExp(`\\b${item.tag}\\b`, 'i');
        if (regex.test(textLower)) {
          return false;
        }
      }
    }
    
    return true;
  }

  public getAlgorithmicShortsQueries(languages: string[] = ['Hindi']): string[] {
    if (!languages || languages.length === 0) {
      languages = ['Hindi'];
    }
    
    const topArtists = Object.entries(this.profile.taste_profile.artist_scores || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(e => e[0]);

    const topGenres = Object.entries(this.profile.taste_profile.genre_scores || {})
      .filter(([genre]) => genre !== 'general')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(e => e[0]);

    const queries: string[] = [];
    
    languages.forEach(lang => {
      // 1. Regional Viral & Shorts Hits
      queries.push(`${lang} viral reels songs 2026`);
      queries.push(`Trending ${lang} shorts audio`);
      queries.push(`${lang} top chartbusters hit songs`);
      queries.push(`Bollywood ${lang} viral audio`);

      // 2. Personalized Artist queries
      if (topArtists.length > 0) {
        const sampledArtists = [...topArtists].sort(() => 0.5 - Math.random()).slice(0, 4);
        sampledArtists.forEach(artist => {
          queries.push(`${artist} ${lang} hit songs audio`);
          queries.push(`Best of ${artist} ${lang} songs`);
        });
      }

      // 3. Vibe / Genre Clusters
      const vibeMap: Record<string, string[]> = {
        'lofi': [`${lang} lofi chill beats`, `${lang} romantic lofi audio`],
        'romantic': [`${lang} romantic love hits`, `${lang} unplugged love songs`],
        'sad': [`${lang} sad heartbreak songs`, `${lang} emotional dard bhare gana`],
        'party': [`${lang} party dance hit songs`, `${lang} remix party audio`],
        'punjabi': [`Punjabi trending hit songs`, `Punjabi viral reels audio`]
      };

      if (topGenres.length > 0) {
        topGenres.forEach(genre => {
          const vibes = vibeMap[genre] || [`${genre} ${lang} trending songs`];
          queries.push(...vibes);
        });
      } else {
        queries.push(`${lang} romantic lofi audio`);
        queries.push(`${lang} unplugged hits`);
        queries.push(`${lang} new release songs 2026`);
      }
    });

    if (queries.length === 0) {
       return ['Hindi trending hit songs 2026', 'Hindi viral reels audio'];
    }

    return queries.sort(() => Math.random() - 0.5);
  }
}
