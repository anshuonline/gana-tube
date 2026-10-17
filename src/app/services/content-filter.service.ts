import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ToastService } from './toast.service';

export interface BlockedItem {
  id: string;
  videoId: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  matchType: 'exact_id' | 'title_contains' | 'artist_match';
  reason?: string;
  blockedAt: number;
}

const LOCAL_STORAGE_KEY = 'gt_blocked_content';
const MANAGE_API_URL = 'https://manageads.ganatube.in/managegt-api.php';

@Injectable({
  providedIn: 'root'
})
export class ContentFilterService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  public blockedItems = signal<BlockedItem[]>([]);
  public isLoaded = signal<boolean>(false);
  public isSyncing = signal<boolean>(false);

  // Fast O(1) set of blocked video IDs (normalized lowercase)
  public blockedVideoIds = computed(() => {
    const set = new Set<string>();
    for (const item of this.blockedItems()) {
      if (item.videoId) {
        set.add(item.videoId.trim().toLowerCase());
        set.add(item.videoId.trim());
      }
    }
    return set;
  });

  // Array of title/artist keyword patterns (normalized lowercase)
  public blockedKeywords = computed(() => {
    return this.blockedItems()
      .filter(item => item.matchType === 'title_contains' || item.matchType === 'artist_match')
      .map(item => item.title.trim().toLowerCase())
      .filter(Boolean);
  });

  constructor() {
    this.hydrateFromStorage();
    this.loadFromBackend();
  }

  /**
   * Hydrate immediately from localStorage for zero initial flicker
   */
  private hydrateFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          this.blockedItems.set(parsed);
          this.isLoaded.set(true);
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate blocked content from storage:', e);
    }
  }

  /**
   * Save current items to localStorage
   */
  private persistToStorage(items: BlockedItem[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist blocked content to storage:', e);
    }
  }

  /**
   * Fetch live blocked content from backend
   */
  public loadFromBackend(): void {
    this.isSyncing.set(true);
    this.http.get<any>(`${MANAGE_API_URL}?action=get_blocked_content`).pipe(
      catchError(err => {
        console.warn('Failed to fetch blocked content from backend, relying on cache:', err);
        return of(null);
      })
    ).subscribe(data => {
      this.isSyncing.set(false);
      this.isLoaded.set(true);
      if (data && Array.isArray(data)) {
        this.blockedItems.set(data);
        this.persistToStorage(data);
      }
    });
  }

  /**
   * Populate from unified app_init payload if available
   */
  public initFromAppInit(blockedContent: any[]): void {
    if (Array.isArray(blockedContent) && blockedContent.length > 0) {
      this.blockedItems.set(blockedContent);
      this.persistToStorage(blockedContent);
      this.isLoaded.set(true);
    }
  }

  /**
   * Check if a track is blocked by ID, title, or artist
   */
  public isBlocked(track: any): boolean {
    if (!track) return false;

    // 1. Check exact video ID match
    const vId = track.videoId || track.id;
    if (vId && typeof vId === 'string' && this.isBlockedVideoId(vId)) {
      return true;
    }

    // 2. Normalize title & artist/channel
    const title = (track.title || track.snippet?.title || '').toLowerCase().trim();
    const artist = (track.artist || track.channelTitle || track.snippet?.channelTitle || track.author || '').toLowerCase().trim();

    // 3. Check blocked keywords / phrase matches
    const keywords = this.blockedKeywords();
    for (const kw of keywords) {
      if (kw && (title.includes(kw) || artist.includes(kw))) {
        return true;
      }
    }

    // 4. Check explicit blocked item list for title/artist match
    for (const item of this.blockedItems()) {
      const itemTitle = (item.title || '').toLowerCase().trim();
      if (!itemTitle) continue;

      if (item.matchType === 'artist_match') {
        if (artist.includes(itemTitle)) return true;
      } else if (item.matchType === 'title_contains') {
        if (title.includes(itemTitle)) return true;
      } else if (item.videoId && vId && item.videoId.toLowerCase() === String(vId).toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Fast check for Video ID
   */
  public isBlockedVideoId(videoId: string | undefined | null): boolean {
    if (!videoId) return false;
    const cleanId = videoId.trim().toLowerCase();
    return this.blockedVideoIds().has(cleanId) || this.blockedVideoIds().has(videoId.trim());
  }

  /**
   * Generic array filter that excludes any blocked tracks
   */
  public filterTracks<T>(tracks: T[]): T[] {
    if (!tracks || !Array.isArray(tracks)) return [];
    return tracks.filter(t => !this.isBlocked(t));
  }

  /**
   * Block a song
   */
  public blockSong(
    song: {
      videoId?: string;
      id?: string;
      title: string;
      artist?: string;
      channelTitle?: string;
      thumbnail?: string;
      thumbnailHigh?: string;
    },
    reason: string = 'Blocked via Content Filter',
    matchType: 'exact_id' | 'title_contains' | 'artist_match' = 'exact_id'
  ): Observable<boolean> {
    const videoId = (song.videoId || song.id || '').trim();
    const cleanTitle = (song.title || '').trim();
    const artistName = (song.artist || song.channelTitle || '').trim();
    const thumb = song.thumbnailHigh || song.thumbnail || 'ganatube-logo.webp';

    if (!videoId && !cleanTitle) {
      this.toastService.show('Please provide a valid Song Title or Video ID.', 'error');
      return of(false);
    }

    // Check if already blocked
    const existing = this.blockedItems();
    const isAlreadyBlocked = existing.some(item => {
      if (videoId && item.videoId && item.videoId.toLowerCase() === videoId.toLowerCase()) return true;
      if (matchType === 'title_contains' && item.title.toLowerCase() === cleanTitle.toLowerCase()) return true;
      return false;
    });

    if (isAlreadyBlocked) {
      this.toastService.show('This item is already blocked on GanaTube.', 'info');
      return of(true);
    }

    const newItem: BlockedItem = {
      id: 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      videoId: videoId,
      title: cleanTitle || 'Untitled Track',
      artist: artistName || 'Unknown Artist',
      thumbnail: thumb,
      matchType: matchType,
      reason: reason || 'Manual Block',
      blockedAt: Date.now()
    };

    const updatedList = [newItem, ...existing];
    this.blockedItems.set(updatedList);
    this.persistToStorage(updatedList);

    return this.syncToBackend(updatedList).pipe(
      map(success => {
        if (success) {
          this.toastService.show(`"${newItem.title}" blocked across GanaTube`, 'success');
        } else {
          this.toastService.show(`"${newItem.title}" blocked locally (Backend sync pending)`, 'info');
        }
        return true;
      })
    );
  }

  /**
   * Unblock a song
   */
  public unblockSong(idOrVideoId: string): Observable<boolean> {
    if (!idOrVideoId) return of(false);
    const target = idOrVideoId.trim().toLowerCase();
    const current = this.blockedItems();

    const filtered = current.filter(item => {
      const matchId = item.id.toLowerCase() === target;
      const matchVideoId = item.videoId && item.videoId.toLowerCase() === target;
      return !matchId && !matchVideoId;
    });

    if (filtered.length === current.length) {
      return of(false);
    }

    this.blockedItems.set(filtered);
    this.persistToStorage(filtered);

    return this.syncToBackend(filtered).pipe(
      map(success => {
        if (success) {
          this.toastService.show('Song unblocked and restored to search & discovery', 'info');
        } else {
          this.toastService.show('Song unblocked locally', 'info');
        }
        return true;
      })
    );
  }

  /**
   * Clear all blocked content
   */
  public clearAll(): Observable<boolean> {
    this.blockedItems.set([]);
    this.persistToStorage([]);

    return this.syncToBackend([]).pipe(
      map(success => {
        this.toastService.show('All blocked content has been cleared', 'info');
        return success;
      })
    );
  }

  /**
   * Sync list to backend database
   */
  private syncToBackend(items: BlockedItem[]): Observable<boolean> {
    this.isSyncing.set(true);
    const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('managegt_token') || '') : '';
    return this.http.post<any>(`${MANAGE_API_URL}?action=save_blocked_content`, { blockedContent: items, token }).pipe(
      tap(() => this.isSyncing.set(false)),
      map(res => res && res.status === 'success'),
      catchError(err => {
        console.warn('Backend sync failed:', err);
        this.isSyncing.set(false);
        return of(false);
      })
    );
  }

  /**
   * Export blocklist to JSON string
   */
  public exportJson(): string {
    return JSON.stringify(this.blockedItems(), null, 2);
  }

  /**
   * Import blocklist from JSON string
   */
  public importJson(jsonStr: string): Observable<boolean> {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        this.toastService.show('Invalid JSON format: expected an array', 'error');
        return of(false);
      }
      this.blockedItems.set(parsed);
      this.persistToStorage(parsed);
      return this.syncToBackend(parsed).pipe(
        map(success => {
          this.toastService.show(`Successfully imported ${parsed.length} blocked items`, 'success');
          return success;
        })
      );
    } catch (e: any) {
      this.toastService.show('JSON parsing error: ' + (e?.message || 'Invalid syntax'), 'error');
      return of(false);
    }
  }
}
