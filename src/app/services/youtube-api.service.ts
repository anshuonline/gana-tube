import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  thumbnailHigh: string;
  publishedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class YoutubeApiService {
  private apiUrl = environment.youtubeApiUrl;
  private apiKey = environment.youtubeApiKey;

  constructor(private http: HttpClient) {}

  searchMusic(query: string, maxResults = 20): Observable<YouTubeSearchResult[]> {
    const cacheKey = `search_${query}_${maxResults}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 1000 * 60 * 60 * 24) { // 24 hours expiry
          // Shuffle the cached array so the user sees fresh songs at the front every time!
          const shuffled = [...parsed.data].sort(() => 0.5 - Math.random());
          return of(shuffled);
        }
      } catch (e) {
        console.error('Cache parsing error', e);
      }
    }

    // Primary: fetch from our local backend server (powered by ytmusicapi)
    const backendUrl = (environment as any).backendUrl || 'http://localhost:3000/api';
    const params = new HttpParams()
      .set('q', query)
      .set('limit', maxResults.toString());

    return this.http.get<YouTubeSearchResult[]>(`${backendUrl}/songs`, { params }).pipe(
      catchError((err) => {
        console.warn('Backend server failed, falling back to YouTube Data API:', err);
        // Fallback: YouTube Data API
        if (!this.apiKey || this.apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
          return of(this.getMockResults(query));
        }

        const fallbackParams = new HttpParams()
          .set('part', 'snippet')
          .set('q', query)
          .set('type', 'video')
          .set('videoCategoryId', '10') // Music category
          .set('maxResults', maxResults.toString())
          .set('key', this.apiKey);

        return this.http.get<any>(`${this.apiUrl}/search`, { params: fallbackParams }).pipe(
          map((response) =>
            response.items.map((item: any) => ({
              videoId: item.id.videoId,
              title: this.decodeHtml(item.snippet.title),
              channelTitle: item.snippet.channelTitle,
              thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
              thumbnailHigh: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
              publishedAt: item.snippet.publishedAt,
            }))
          ),
          catchError(() => of([]))
        );
      }),
      map(results => {
        if (results && results.length > 0) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              timestamp: Date.now(),
              data: results
            }));
          } catch (e) {
            // ignore quota exceeded
          }
        }
        return results;
      })
    );
  }


  private playlistCache = new Map<string, YouTubeSearchResult[]>();

  getPlaylistSongs(queries: string[], cacheKey?: string): Observable<YouTubeSearchResult[]> {
    if (!queries || queries.length === 0) return of([]);
    
    if (cacheKey && this.playlistCache.has(cacheKey)) {
      return of(this.playlistCache.get(cacheKey)!);
    }
    
    const limitPerQuery = queries.length > 10 ? 1 : Math.max(20, Math.ceil(100 / queries.length));
    const requests = queries.map(q => this.searchMusic(q, limitPerQuery));
    
    return new Observable<YouTubeSearchResult[]>(observer => {
      let completed = 0;
      const allSongsArrays: YouTubeSearchResult[][] = new Array(queries.length).fill([]);
      const seenIds = new Set<string>();

      requests.forEach((req, index) => {
        req.subscribe({
          next: (list) => {
            const uniqueList: YouTubeSearchResult[] = [];
            for (const song of list) {
              if (!seenIds.has(song.videoId)) {
                seenIds.add(song.videoId);
                uniqueList.push(song);
              }
            }
            allSongsArrays[index] = uniqueList;
            
            // Flatten to emit in order
            const flattened: YouTubeSearchResult[] = [];
            for (const arr of allSongsArrays) {
               flattened.push(...arr);
            }
            
            // Optional: update cache as we go, or just at the end
            if (cacheKey) {
              this.playlistCache.set(cacheKey, flattened);
            }
            observer.next(flattened);
          },
          error: (err) => {
            console.warn('Error loading song:', err);
            completed++;
            if (completed === requests.length) {
              observer.complete();
            }
          },
          complete: () => {
            completed++;
            if (completed === requests.length) {
              observer.complete();
            }
          }
        });
      });
    });
  }

  getSuggestions(query: string): Observable<string[]> {
    const backendUrl = (environment as any).backendUrl || 'http://localhost:3000/api';
    const params = new HttpParams().set('q', query);
    return this.http.get<string[]>(`${backendUrl}/autocomplete`, { params }).pipe(
      catchError((err) => {
        console.warn('Failed to fetch suggestions:', err);
        return of([]);
      })
    );
  }

  getLyrics(videoId: string): Observable<string | null> {
    const backendUrl = (environment as any).backendUrl || 'http://localhost:3000/api';
    const params = new HttpParams().set('videoId', videoId);
    return this.http.get<{ lyrics: any }>(`${backendUrl}/lyrics`, { params }).pipe(
      map(res => {
        if (!res.lyrics) return null;
        if (Array.isArray(res.lyrics)) {
          return res.lyrics.join('<br>');
        }
        if (typeof res.lyrics === 'object' && res.lyrics.content) {
            return res.lyrics.content.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
        }
        return String(res.lyrics).replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
      }),
      catchError(err => {
        console.warn('Failed to fetch lyrics:', err);
        return of(null);
      })
    );
  }

  getSyncedLyrics(query: string): Observable<any | null> {
    const backendUrl = (environment as any).backendUrl || 'http://localhost:3000/api';
    const params = new HttpParams().set('q', query);
    return this.http.get<any>(`${backendUrl}/synced-lyrics`, { params }).pipe(
      catchError(err => {
        console.warn('Failed to fetch synced lyrics:', err);
        return of(null);
      })
    );
  }

  private decodeHtml(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  private getMockResults(query: string): YouTubeSearchResult[] {
    // Sample mock data for demo/development (no API key needed)
    const mockVideos = [
      { videoId: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', channel: 'Rick Astley' },
      { videoId: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You', channel: 'Ed Sheeran' },
      { videoId: 'kXYiU_JCYtU', title: 'Linkin Park - Numb', channel: 'Linkin Park' },
      { videoId: 'OPf0YbXqDm0', title: 'Mark Ronson - Uptown Funk ft. Bruno Mars', channel: 'Mark Ronson' },
      { videoId: 'CevxZvSJLk8', title: 'Katy Perry - Roar', channel: 'Katy Perry' },
      { videoId: 'fRh_vgS2dFE', title: 'Justin Timberlake - Can\'t Stop the Feeling', channel: 'Justin Timberlake' },
      { videoId: 'nfWlot6h_JM', title: 'Taylor Swift - Shake It Off', channel: 'Taylor Swift' },
      { videoId: 'pRpeEdMmmQ0', title: 'Pharrell Williams - Happy', channel: 'Pharrell Williams' },
      { videoId: 'SlPhMPnQ58k', title: 'Eminem - Lose Yourself', channel: 'Eminem' },
      { videoId: 'YQHsXMglC9A', title: 'Adele - Hello', channel: 'Adele' },
      { videoId: 'hT_nvWreIhg', title: 'OneRepublic - Counting Stars', channel: 'OneRepublic' },
      { videoId: '09R8_2nJtjg', title: 'Maroon 5 - Sugar', channel: 'Maroon 5' },
      { videoId: 'RgKAFK5djSk', title: 'Wiz Khalifa - See You Again ft. Charlie Puth', channel: 'Wiz Khalifa' },
      { videoId: 'JRfuAukYTKg', title: 'Enrique Iglesias - Bailando', channel: 'Enrique Iglesias' },
      { videoId: '5NV6Rdv1a3I', title: 'Flo Rida - Good Feeling', channel: 'Flo Rida' },
      { videoId: '60ItHLz5WEA', title: 'Alan Walker - Faded', channel: 'Alan Walker' },
    ];

    return mockVideos
      .filter(() => Math.random() > 0.2)
      .slice(0, 12)
      .map((v) => ({
        videoId: v.videoId,
        title: v.title,
        channelTitle: v.channel,
        thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
        thumbnailHigh: `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
        publishedAt: new Date().toISOString(),
      }));
  }
}
