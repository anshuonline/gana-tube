import { Injectable } from '@angular/core';
import { YoutubeApiService, YouTubeSearchResult } from './youtube-api.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';

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
  type?: 'search' | 'trending' | 'custom' | 'saavn_trending';
  songs?: YouTubeSearchResult[];
  isMadeForYou?: boolean;
  language?: string;
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
        liked_songs: this.userService.likedSongs(),
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

  // Regional genres belong to their own language (bollywood -> Hindi,
  // punjabi -> Punjabi). If the selected language differs, drop/swap the
  // genre so queries always return songs of the selected language.
  private sanitizeGenreForLanguage(genre: string, language: string): string {
    if (!genre) return '';
    const lang = language.toLowerCase();
    const g = genre.toLowerCase();
    const regionalOwners: Record<string, string[]> = {
      'hindi': ['bollywood'],
      'punjabi': ['punjabi']
    };
    for (const [ownerLang, genres] of Object.entries(regionalOwners)) {
      if (genres.includes(g) && ownerLang !== lang) {
        return lang === 'english' ? 'pop' : '';
      }
    }
    return genre;
  }

  public getVariableRewardShelves(language: string = 'Hindi'): Observable<ShelfDefinition[]> {
    // Ensure taste_profile exists to prevent crashes
    if (!this.profile.taste_profile) {
      this.profile.taste_profile = { genre_scores: {}, artist_scores: {} };
    }
    if (!this.profile.taste_profile.artist_scores) {
      this.profile.taste_profile.artist_scores = {};
    }
    if (!this.profile.taste_profile.genre_scores) {
      this.profile.taste_profile.genre_scores = {};
    }

    const topArtists = Object.entries(this.profile.taste_profile.artist_scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);

    const topGenres = Object.entries(this.profile.taste_profile.genre_scores)
      .filter(([genre]) => genre !== 'general')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    const randomYear = [2022, 2023, 2024, 2025, 2026, 'this week', 'new releases'][Math.floor(Math.random() * 7)];
    const randomVibe = ['hits', 'trending', 'viral', 'best of', 'top', 'chartbusters', 'mashup', 'jukebox', 'chill', 'party'][Math.floor(Math.random() * 10)];
    
    // Pick 1-2 random top artists to mix up the suggestions
    // Language guard: global top artists (mostly Hindi) must not bleed into
    // English/other-language queries — YouTube search is dominated by the
    // artist name, so "trending English songs Arijit Singh" returns Hindi songs.
    let mixModifier = '';
    if (language === 'Hindi' && topArtists.length > 0) {
      const shuffledArtists = [...topArtists].sort(() => 0.5 - Math.random());
      mixModifier = Math.random() > 0.5 && shuffledArtists.length > 1
        ? ` ${shuffledArtists[0]} & ${shuffledArtists[1]}`
        : ` ${shuffledArtists[0]}`;
    }

    // Language guard: regional genres (bollywood/punjabi) return Hindi songs
    // even when English is selected — swap them for a language-neutral genre.
    const randomTopGenre = topGenres.length > 0 ? topGenres[Math.floor(Math.random() * topGenres.length)] : '';
    const safeGenre = this.sanitizeGenreForLanguage(randomTopGenre, language);
    const genreModifier = safeGenre ? ` ${safeGenre}` : '';
    
    // Add randomness to the query structure so it's not the same format every time
    const queryFormats = [
      `${randomVibe} ${language} ${genreModifier} songs ${randomYear}${mixModifier}`,
      `${language}${mixModifier} ${randomVibe} ${randomYear}`,
      `${genreModifier} ${language} songs ${randomYear}${mixModifier}`,
      `Best of${mixModifier} ${language} ${randomYear}`
    ];
    const finalQuery = queryFormats[Math.floor(Math.random() * queryFormats.length)].trim().replace(/\s+/g, ' ');

    // Context-Aware Naming (no emojis)
    const hour = new Date().getHours();
    let timeGreeting = 'Day';
    let timeQuery = `popular ${language} hits`;
    
    if (hour >= 6 && hour < 12) {
      timeGreeting = 'Morning Boost';
      const mornings = ['morning motivation', 'morning chill', 'waking up', 'fresh morning'];
      timeQuery = `${mornings[Math.floor(Math.random() * mornings.length)]} ${language} songs`;
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = 'Afternoon Vibes';
      const afternoons = ['afternoon drive', 'pop', 'upbeat', 'feel good'];
      timeQuery = `${afternoons[Math.floor(Math.random() * afternoons.length)]} ${language} songs`;
    } else if (hour >= 17 && hour < 21) {
      timeGreeting = 'Evening Melodies';
      const evenings = ['evening romantic', 'unplugged', 'sunset chill', 'acoustic'];
      timeQuery = `${evenings[Math.floor(Math.random() * evenings.length)]} ${language} songs ${randomYear}`;
    } else {
      timeGreeting = 'Late Night Feels';
      const nights = ['late night lofi', 'midnight chill', 'night drive', 'sleep relaxing'];
      timeQuery = `${nights[Math.floor(Math.random() * nights.length)]} ${language} songs`;
    }

    // Generate personalized title: "Made for {username}" or "Made for You" for guests
    const currentUser = this.authService.currentUser();
    const rawUsername = (this.userService.displayName() || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : '') || '').trim();
    const madeForTitle = (currentUser && rawUsername && rawUsername.toLowerCase() !== 'user' && rawUsername.toLowerCase() !== 'guest')
      ? `Made for ${rawUsername.length > 20 ? rawUsername.substring(0, 20) : rawUsername}`
      : 'Made for You';

    const otherShelves: ShelfDefinition[] = [];

    if (this.profile.history.length < 3) {
      // New user — show broad discovery shelves
      const newUsers2 = ['all time best', 'classic hits', 'golden era'];
      otherShelves.push({ title: 'All-Time Classics', query: `${newUsers2[Math.floor(Math.random() * newUsers2.length)]} ${language} songs` });

      const genericModifiers = ['top', 'trending', 'popular', 'best hits'];
      const madeForYouQuery = `${genericModifiers[Math.floor(Math.random() * genericModifiers.length)]} ${language} songs ${randomYear}`;
      otherShelves.push({
        title: madeForTitle,
        query: madeForYouQuery,
        isMadeForYou: true
      });
    } else {
      // --- Personalized shelves ---
      // "More from {Artist}" — fetch NEW songs by their top artist
      if (topArtists.length > 0) {
        const artistQueryFormats = ['official songs', 'all songs', 'top hits', 'best collection'];
        otherShelves.push({
          title: 'More from ' + topArtists[0],
          query: `${topArtists[0]} ${artistQueryFormats[Math.floor(Math.random() * artistQueryFormats.length)]} in ${language}`
        });
      }

      // "Made for {username}" / "Made for You" — smart genre-based discovery
      const likedCount = this.profile.liked_songs.length;
      let madeForYouQuery = '';
      
      if (likedCount >= 20 && topGenres.length > 0) {
        const genreLabels: Record<string, string> = {
          'lofi': 'lofi chill',
          'romantic': 'romantic love',
          'sad': 'sad emotional heartbreak',
          'party': 'party dance upbeat',
          'punjabi': 'punjabi',
          'bollywood': 'bollywood'
        };
        
        let genreQuery = this.sanitizeGenreForLanguage(topGenres[0], language);
        if (genreQuery) {
          genreQuery = genreLabels[genreQuery] || genreQuery;
          madeForYouQuery = `best ${genreQuery} ${language} songs ${randomYear}`;
        }
      }
      
      if (!madeForYouQuery) {
        const genericModifiers = ['top', 'trending', 'popular', 'best hits'];
        madeForYouQuery = `${genericModifiers[Math.floor(Math.random() * genericModifiers.length)]} ${language} songs ${randomYear}`;
      }

      otherShelves.push({
        title: madeForTitle,
        query: madeForYouQuery,
        isMadeForYou: true
      });
    }

    // Build the dynamic time shelf with user's last 100 listened + liked songs and related tracks
    return this.buildTimeBasedShelf(timeGreeting, timeQuery, language).pipe(
      map(timeShelf => {
        return [
          {
            title: 'Suggested for You',
            query: finalQuery
          },
          timeShelf,
          ...otherShelves
        ];
      }),
      catchError(err => {
        console.warn('Failed to build dynamic time shelf, using fallback query:', err);
        return of([
          {
            title: 'Suggested for You',
            query: finalQuery
          },
          {
            title: 'Your ' + timeGreeting,
            query: timeQuery
          },
          ...otherShelves
        ]);
      })
    );
  }

  /**
   * Builds the dynamic time shelf ("Your Late Night Feels" / "Your Morning Boost" etc.):
   * 1. Extracts songs from user's last 100 listened musics (recentPlays) + liked musics + profile history.
   * 2. Filters them strictly matching the target language.
   * 3. If no matching songs in that language -> Fallbacks to trending songs in that language.
   * 4. If matching songs exist -> Takes 4-6 user songs and fetches radio-related songs to provide a fresh curated shelf.
   */
  private buildTimeBasedShelf(timeGreeting: string, fallbackQuery: string, language: string): Observable<ShelfDefinition> {
    const shelfTitle = 'Your ' + timeGreeting;

    // 1. Gather pool from recent plays (up to 100), liked songs, and profile history
    const rawList: any[] = [
      ...(this.userService.recentPlays ? this.userService.recentPlays() : []),
      ...(this.userService.likedSongs ? this.userService.likedSongs() : []),
      ...(this.profile.history || [])
    ];

    const seenIds = new Set<string>();
    const userSongsPool: YouTubeSearchResult[] = [];

    for (const item of rawList) {
      if (item && typeof item === 'object' && item.videoId && item.title) {
        if (!seenIds.has(item.videoId)) {
          seenIds.add(item.videoId);
          userSongsPool.push({
            videoId: item.videoId,
            title: item.title,
            channelTitle: item.channelTitle || '',
            thumbnail: item.thumbnail || '',
            thumbnailHigh: item.thumbnailHigh || item.thumbnail || '',
            publishedAt: item.publishedAt || '',
            duration: item.duration || 0,
            type: item.type || 'song'
          });
        }
      }
    }

    // 2. Filter user songs matching the selected language
    const matchingSongs = userSongsPool.filter(song => this.isSongMatchingLanguage(song, language));

    // 3. Fallback: If user has 0 listened/liked songs in this language -> Trending songs for that language!
    if (matchingSongs.length === 0) {
      return this.youtubeApi.getSaavnTrending(language, 20, 'trending').pipe(
        timeout(8000),
        map(trendingSongs => {
          if (trendingSongs && trendingSongs.length > 0) {
            return {
              title: shelfTitle,
              query: `${language} trending songs`,
              songs: trendingSongs,
              type: 'trending' as const,
              language: language
            };
          }
          throw new Error('No trending songs returned from Saavn');
        }),
        catchError(() => {
          return this.youtubeApi.searchMusic(`trending ${language} hit songs`, 15).pipe(
            timeout(6000),
            map(searchSongs => ({
              title: shelfTitle,
              query: fallbackQuery,
              songs: searchSongs || [],
              type: 'search' as const,
              language: language
            })),
            catchError(() => of({
              title: shelfTitle,
              query: fallbackQuery,
              songs: [],
              type: 'search' as const,
              language: language
            }))
          );
        })
      );
    }

    // 4. User HAS listened/liked songs in this language!
    // Pick 4-6 songs from matching songs (mix of recent + liked)
    const shuffled = [...matchingSongs].sort(() => 0.5 - Math.random());
    const pickedDirectSongs = shuffled.slice(0, 6);
    const seedTrack = pickedDirectSongs[0];
    const seedQuery = `${seedTrack.channelTitle || ''} ${seedTrack.title || ''}`.trim();

    return this.youtubeApi.getRadioTracks(seedTrack.videoId, seedQuery).pipe(
      timeout(8000),
      map(relatedTracks => {
        const combined = [...pickedDirectSongs];
        const existingVideoIds = new Set(pickedDirectSongs.map(s => s.videoId));

        for (const track of relatedTracks || []) {
          if (track && track.videoId && !existingVideoIds.has(track.videoId)) {
            existingVideoIds.add(track.videoId);
            combined.push(track);
          }
        }

        return {
          title: shelfTitle,
          query: seedQuery,
          songs: combined.slice(0, 20),
          language: language
        };
      }),
      catchError(err => {
        console.warn('Failed to fetch radio tracks for time-based shelf, falling back to direct songs:', err);
        return of({
          title: shelfTitle,
          query: seedQuery,
          songs: pickedDirectSongs,
          language: language
        });
      })
    );
  }

  /**
   * Language matching helper to verify if a user song belongs to a specific language.
   */
  public isSongMatchingLanguage(song: YouTubeSearchResult, targetLang: string): boolean {
    if (!song || !targetLang) return false;
    const lang = targetLang.toLowerCase().trim();

    // 1. Explicit language field if present
    const explicitLang = ((song as any).language || (song as any).lang || '').toLowerCase().trim();
    if (explicitLang) {
      if (explicitLang === lang) return true;
      if (lang === 'hindi' && explicitLang === 'bollywood') return true;
      if (explicitLang !== lang) return false;
    }

    const text = `${song.title || ''} ${song.channelTitle || ''} ${(song as any).artist || ''}`.toLowerCase();

    // 2. Scripts and language-specific markers
    const hasTamilScript = /[\u0B80-\u0BFF]/.test(text);
    const hasTeluguScript = /[\u0C00-\u0C7F]/.test(text);
    const hasMalayalamScript = /[\u0D00-\u0D7F]/.test(text);
    const hasKannadaScript = /[\u0C80-\u0CFF]/.test(text);
    const hasBengaliScript = /[\u0980-\u09FF]/.test(text);
    const hasGurmukhiScript = /[\u0A00-\u0A7F]/.test(text);
    const hasDevanagariScript = /[\u0900-\u097F]/.test(text);

    // If text has a script of a DIFFERENT regional language, it's not a match
    if (hasTamilScript && lang !== 'tamil') return false;
    if (hasTeluguScript && lang !== 'telugu') return false;
    if (hasMalayalamScript && lang !== 'malayalam') return false;
    if (hasKannadaScript && lang !== 'kannada') return false;
    if (hasBengaliScript && lang !== 'bengali') return false;
    if (hasGurmukhiScript && lang !== 'punjabi') return false;

    // Check language-specific keywords / artists / labels
    if (lang === 'punjabi') {
      if (hasGurmukhiScript) return true;
      const punjabiRegex = /\b(punjabi|sidhu|moosewala|karan aujla|diljit|dosanjh|ap dhillon|amrit maan|b praak|jaani|jassi gill|jass manak|gurdas maan|sharry maan|parmish verma|mankirt|hardy sandhu|guru randhawa|ammy virk|sukhe|speed records|white hill music|geet mp3)\b/i;
      return punjabiRegex.test(text);
    }

    if (lang === 'bhojpuri') {
      const bhojpuriRegex = /\b(bhojpuri|pawan singh|khesari|dinesh lal|nirahua|akshara singh|shilpi raj|pramod premi|kallu|ankush raja|wave music|worldwide records bhojpuri)\b/i;
      return bhojpuriRegex.test(text);
    }

    if (lang === 'haryanvi') {
      const haryanviRegex = /\b(haryanvi|sapna choudhary|renuka panwar|masoom sharma|gulzaar chhaniwala|diler kharkiya|sonotek|mor music)\b/i;
      return haryanviRegex.test(text);
    }

    if (lang === 'tamil') {
      if (hasTamilScript) return true;
      const tamilRegex = /\b(tamil|anirudh|vijay|dhanush|ar rahman|think music india|sony music south)\b/i;
      return tamilRegex.test(text);
    }

    if (lang === 'telugu') {
      if (hasTeluguScript) return true;
      const teluguRegex = /\b(telugu|aditya music|geetha arts|lahari music)\b/i;
      return teluguRegex.test(text);
    }

    if (lang === 'bengali') {
      if (hasBengaliScript) return true;
      const bengaliRegex = /\b(bengali|bangla|svf music|ashomapto)\b/i;
      return bengaliRegex.test(text);
    }

    if (lang === 'english') {
      if (hasDevanagariScript || hasTamilScript || hasTeluguScript || hasMalayalamScript || hasKannadaScript || hasBengaliScript || hasGurmukhiScript) {
        return false;
      }
      const indianChannels = /\b(t-series|tseries|zee music|sony music india|yrf|tips official|saregama|speed records|geet mp3)\b/i;
      if (indianChannels.test(text)) return false;

      const englishRegex = /\b(english|pop|rock|hip hop|rap|ed sheeran|taylor swift|justin bieber|dua lipa|billie eilish|the weeknd|drake|ariana grande|bruno mars|eminem|charlie puth|maroon 5|post malone|selena gomez|rihanna|coldplay|imagine dragons|shawn mendes|adele|katy perry|sia|alan walker|marshmello|chainsmokers|david guetta|avicii)\b/i;
      if (englishRegex.test(text)) return true;
      const indianKeywords = /\b(hindi|bollywood|punjabi|bhojpuri|haryanvi|tamil|telugu|bengali|arijit|neha|jubin|shreya|pritam|badshah)\b/i;
      return !indianKeywords.test(text);
    }

    if (lang === 'hindi') {
      if (hasDevanagariScript) {
        if (/\b(bhojpuri|haryanvi)\b/i.test(text)) return false;
        return true;
      }
      const hindiRegex = /\b(hindi|bollywood|t-series|tseries|zee music|sony music india|yrf|tips official|saregama|arijit|neha kakkar|jubin nautiyal|shreya ghoshal|pritam|badshah|atif aslam|sonu nigam|kumar sanu|udit narayan|alka yagnik|sunidhi|darshan raval|armaan malik|kk|mohit chauhan|ankit tiwari|himesh|vishal-shekhar|sachin-jigar|yo yo honey singh|stebin ben)\b/i;
      if (hindiRegex.test(text)) return true;

      const otherRegional = /\b(punjabi|bhojpuri|haryanvi|tamil|telugu|bengali|malayalam|kannada)\b/i;
      if (!otherRegional.test(text)) {
        return true;
      }
      return false;
    }

    return false;
  }

  public getAutoplayQueue(currentTrack: YouTubeSearchResult): Observable<YouTubeSearchResult[]> {
    const query = currentTrack.channelTitle + " songs like " + currentTrack.title;
    return this.youtubeApi.searchMusic(query, 10);
  }
}
