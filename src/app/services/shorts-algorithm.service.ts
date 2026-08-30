import { Injectable } from '@angular/core';
import { YouTubeSearchResult } from './youtube-api.service';

export interface EngagementSignal {
  genre: string;
  artist: string;
  completionRatio: number;
  liked: boolean;
  skippedFast: boolean;
  replayed: boolean;
}

export interface ShortsProfile {
  version: number;
  last_session: number;
  taste_profile: {
    genre_scores: Record<string, number>;
    artist_scores: Record<string, number>;
  };
  session_momentum: {
    genre: string | null;
    streak: number;
  };
  recent_history: string[];   // last shown video ids, for anti-repeat
  exploration_counter: number;
}

@Injectable({
  providedIn: 'root'
})
export class ShortsAlgorithmService {
  private profileKey = 'gt_shorts_profile';
  private profile: ShortsProfile;

  // tuning knobs
  private readonly LEARNING_RATE = 0.28;       // fast in-session adaptation
  private readonly SESSION_DECAY = 0.985;      // slow taste drift across sessions
  private readonly HISTORY_LIMIT = 40;
  private readonly EXPLORE_EVERY = 5;          // 1 in 5 slots is a "discovery" pick
  private readonly DIVERSITY_WINDOW = 3;       // no same artist/genre within last 3 shown

  constructor() {
    this.profile = this.loadProfile();
    this.maybeDecaySession();
  }

  private loadProfile(): ShortsProfile {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.profileKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.version === 1) return this.hydrateProfile(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse shorts profile', e);
    }
    return this.defaultProfile();
  }

  private defaultProfile(): ShortsProfile {
    return {
      version: 1,
      last_session: Date.now(),
      taste_profile: { genre_scores: {}, artist_scores: {} },
      session_momentum: { genre: null, streak: 0 },
      recent_history: [],
      exploration_counter: 0
    };
  }

  /** Backfills fields for profiles saved before momentum/history/exploration existed. */
  private hydrateProfile(parsed: any): ShortsProfile {
    return {
      version: 1,
      last_session: parsed.last_session ?? Date.now(),
      taste_profile: {
        genre_scores: parsed.taste_profile?.genre_scores ?? {},
        artist_scores: parsed.taste_profile?.artist_scores ?? {}
      },
      session_momentum: parsed.session_momentum ?? { genre: null, streak: 0 },
      recent_history: parsed.recent_history ?? [],
      exploration_counter: parsed.exploration_counter ?? 0
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

  /** Gentle decay so old obsessions fade if a new session starts >6h later — keeps taste current instead of stale. */
  private maybeDecaySession(): void {
    const gapHrs = (Date.now() - this.profile.last_session) / 3_600_000;
    if (gapHrs < 6) return;
    const { genre_scores, artist_scores } = this.profile.taste_profile;
    for (const k in genre_scores) genre_scores[k] *= this.SESSION_DECAY;
    for (const k in artist_scores) artist_scores[k] *= this.SESSION_DECAY;
    this.profile.session_momentum = { genre: null, streak: 0 };
  }

  private getGenre(song: YouTubeSearchResult): string {
    const titleLower = song.title.toLowerCase();
    if (titleLower.includes('lofi') || titleLower.includes('lo-fi') || titleLower.includes('chill')) return 'lofi';
    if (titleLower.includes('romantic') || titleLower.includes('love')) return 'romantic';
    if (titleLower.includes('sad') || titleLower.includes('heartbreak') || titleLower.includes('dard')) return 'sad';
    if (titleLower.includes('party') || titleLower.includes('dance') || titleLower.includes('remix')) return 'party';
    if (titleLower.includes('punjabi')) return 'punjabi';
    if (titleLower.includes('bollywood') || song.channelTitle.toLowerCase().includes('t-series')) return 'bollywood';
    return 'general';
  }

  /**
   * Core signal ingestion. Call this after every short finishes / is skipped / is swiped away.
   * Weighs completion ratio non-linearly — a full watch or replay is worth far more than
   * 2x a half watch, because that's the actual "hooked" signal, not just watch time.
   */
  public trackEngagement(song: YouTubeSearchResult, listenDurationSec: number, totalDurationSec: number = 30): void {
    const completionRatio = Math.min(listenDurationSec / Math.max(totalDurationSec, 1), 1);
    const skippedFast = completionRatio < 0.15 && listenDurationSec < 2.5;

    const signal: EngagementSignal = {
      genre: this.getGenre(song),
      artist: song.channelTitle ?? 'unknown',
      completionRatio,
      liked: (song as any).isLiked === true,
      skippedFast,
      replayed: listenDurationSec > totalDurationSec
    };

    const weight = this.scoreFromSignal(signal);

    this.applyScore('genre_scores', signal.genre, weight);
    this.applyScore('artist_scores', signal.artist, weight);

    // Hot streak: 2+ strong positives in a row on the same genre in ONE session
    // means the user is deep in a scroll hole right now — lean into it hard.
    if (weight > 0) {
      if (this.profile.session_momentum.genre === signal.genre) {
        this.profile.session_momentum.streak++;
      } else {
        this.profile.session_momentum = { genre: signal.genre, streak: 1 };
      }
      if (this.profile.session_momentum.streak >= 2) {
        this.applyScore('genre_scores', signal.genre, 1.5); // momentum bonus
      }
    } else {
      this.profile.session_momentum = { genre: null, streak: 0 };
    }

    // anti-repeat memory
    const id = song.videoId;
    if (id) {
      this.profile.recent_history.push(id);
      if (this.profile.recent_history.length > this.HISTORY_LIMIT) {
        this.profile.recent_history.shift();
      }
    }

    this.saveProfile();
  }
  
  public rewardLike(song: YouTubeSearchResult): void {
    const signal: EngagementSignal = {
      genre: this.getGenre(song),
      artist: song.channelTitle ?? 'unknown',
      completionRatio: 1,
      liked: true,
      skippedFast: false,
      replayed: false
    };
    
    // Explicit manual boost for like
    const weight = 4.0;
    this.applyScore('genre_scores', signal.genre, weight);
    this.applyScore('artist_scores', signal.artist, weight);
    this.saveProfile();
  }

  private scoreFromSignal(s: EngagementSignal): number {
    if (s.liked) return 4;
    if (s.replayed) return 3.5;              // watched it more than once = loved it
    if (s.skippedFast) return -2.5;          // instant skip = strong dislike, not neutral
    if (s.completionRatio >= 0.85) return 2;
    if (s.completionRatio >= 0.5) return 1;
    if (s.completionRatio >= 0.25) return -0.3;
    return -1.2;
  }

  private applyScore(bucket: 'genre_scores' | 'artist_scores', key: string, weight: number): void {
    if (!key || key === 'unknown') return;
    const scores = this.profile.taste_profile[bucket];
    const current = scores[key] ?? 0;
    // EMA-style update so recent behavior dominates, but history isn't erased
    scores[key] = current + this.LEARNING_RATE * (weight - current * 0.1);
  }

  /**
   * Ranks a batch of candidate shorts for the next feed page.
   * Mixes: taste score + diversity penalty + controlled exploration slot.
   * This is what actually prevents the "same 5 creators on loop" boring feel.
   */
  public rankCandidates(candidates: YouTubeSearchResult[], count: number): YouTubeSearchResult[] {
    const scored = candidates
      .filter(c => !this.profile.recent_history.includes(c.videoId))
      .map(c => ({ item: c, score: this.scoreCandidate(c) }));

    scored.sort((a, b) => b.score - a.score);

    const ranked: YouTubeSearchResult[] = [];
    const usedGenres: string[] = [];
    const usedArtists: string[] = [];

    for (const { item } of scored) {
      if (ranked.length >= count) break;
      const genre = this.getGenre(item);
      const artist = item.channelTitle ?? 'unknown';

      // diversity guard: skip if same genre AND same artist shown too recently in THIS batch
      const recentGenres = usedGenres.slice(-this.DIVERSITY_WINDOW);
      const recentArtists = usedArtists.slice(-this.DIVERSITY_WINDOW);
      if (recentGenres.includes(genre) && recentArtists.includes(artist)) continue;

      ranked.push(item);
      usedGenres.push(genre);
      usedArtists.push(artist);
    }

    // if diversity guard filtered too aggressively and we're short, top up from leftovers
    if (ranked.length < count) {
      for (const { item } of scored) {
        if (ranked.length >= count) break;
        if (!ranked.includes(item)) ranked.push(item);
      }
    }

    return this.injectExploration(ranked, candidates, count);
  }

  private scoreCandidate(item: YouTubeSearchResult): number {
    const genre = this.getGenre(item);
    const artist = item.channelTitle ?? 'unknown';
    const g = this.profile.taste_profile.genre_scores[genre] ?? 0;
    const a = this.profile.taste_profile.artist_scores[artist] ?? 0;
    const momentumBoost = this.profile.session_momentum.genre === genre
      ? this.profile.session_momentum.streak * 0.6
      : 0;
    return g * 0.6 + a * 0.4 + momentumBoost;
  }

  /**
   * Every Nth slot is deliberately a wildcard — a fresh, untasted-genre item slipped in
   * near the top of the batch instead of buried at the bottom. Keeps the feed from
   * collapsing into a filter bubble, and occasionally surfaces a new favorite —
   * which is a big part of what makes a feed feel "smart" instead of repetitive.
   */
  private injectExploration(ranked: YouTubeSearchResult[], pool: YouTubeSearchResult[], count: number): YouTubeSearchResult[] {
    this.profile.exploration_counter++;
    if (this.profile.exploration_counter % this.EXPLORE_EVERY !== 0 || ranked.length === 0) {
      return ranked.slice(0, count);
    }
    const unseenTaste = pool.find(p => {
      const genre = this.getGenre(p);
      const id = p.videoId;
      return !(genre in this.profile.taste_profile.genre_scores) &&
             !this.profile.recent_history.includes(id) &&
             !ranked.includes(p);
    });
    if (unseenTaste) {
      const slot = Math.min(2, ranked.length - 1); // slip it in early-ish, not always #1
      ranked.splice(slot, 0, unseenTaste);
    }
    return ranked.slice(0, count);
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

  /** Optional: expose a read-only snapshot for a debug/analytics panel. */
  public getProfileSnapshot(): Readonly<ShortsProfile> {
    return this.profile;
  }

  /** Optional: hard reset if you add a "reset my recommendations" setting. */
  public resetProfile(): void {
    this.profile = this.defaultProfile();
    this.saveProfile();
  }
}
