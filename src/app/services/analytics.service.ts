import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = 'https://manageads.ganatube.in/analytic-api.php';
  
  private timeTrackingInterval: any;
  private currentUserEmail: string | null = null;
  private currentDisplayName: string = 'Unknown User';

  startTrackingTime(email: string, displayName: string) {
    if (this.timeTrackingInterval) {
      clearInterval(this.timeTrackingInterval);
    }
    this.currentUserEmail = email;
    this.currentDisplayName = displayName;
    
    // Record time every 180 seconds (skip if tab is inactive/hidden)
    this.timeTrackingInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      this.recordTime(180);
    }, 180000);
  }

  stopTrackingTime() {
    if (this.timeTrackingInterval) {
      clearInterval(this.timeTrackingInterval);
      this.timeTrackingInterval = null;
    }
    this.currentUserEmail = null;
  }

  getGuestId(): string {
    if (typeof localStorage === 'undefined') return 'guest_temp';
    let gid = localStorage.getItem('gt_guest_id');
    if (!gid) {
      gid = 'guest_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('gt_guest_id', gid);
    }
    return gid;
  }

  private currentPage: string = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/home';
  private lastSearchQuery: string = '';

  setCurrentPage(page: string) {
    this.currentPage = page;
  }

  setLastSearch(query: string) {
    this.lastSearchQuery = query;
  }

  startGuestTracking() {
    if (this.timeTrackingInterval) {
      clearInterval(this.timeTrackingInterval);
    }
    const guestId = this.getGuestId();
    // Heartbeat every 180 seconds (skip if tab is inactive/hidden to avoid server load)
    this.timeTrackingInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      this.recordGuestPing(guestId, 180);
    }, 180000);
    // Initial active ping
    this.recordGuestPing(guestId, 0);
  }

  async recordGuestPing(guestId: string, seconds: number = 60) {
    try {
      const page = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : this.currentPage;
      await fetch(`${this.apiUrl}?action=recordGuestPing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          guest_id: guestId, 
          seconds,
          current_page: page,
          last_search: this.lastSearchQuery
        }),
        keepalive: true
      });
    } catch(e) {
      // Silent catch - don't pollute console
    }
  }

  private async recordTime(seconds: number) {
    if (!this.currentUserEmail) return;
    try {
      await fetch(`${this.apiUrl}?action=recordTime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: this.currentUserEmail, 
          display_name: this.currentDisplayName,
          seconds: seconds 
        })
      });
    } catch(e) {
      console.error('Failed to record time', e);
    }
  }

  async recordPlay(track: any) {
    if (!track || !track.videoId) return;
    const isGuest = !this.currentUserEmail;
    const guestId = isGuest ? this.getGuestId() : null;
    const page = '/play?v=' + track.videoId;
    this.currentPage = page;
    try {
      await fetch(`${this.apiUrl}?action=recordPlay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: track.videoId,
          title: track.title,
          thumbnail: track.thumbnailHigh || track.thumbnail || '',
          artist: track.channelTitle || track.artist || '',
          is_guest: isGuest,
          guest_id: guestId,
          current_page: page
        })
      });
    } catch(e) {
      console.error('Failed to record play', e);
    }
  }

  async recordLike(track: any) {
    if (!track || !track.videoId) return;
    try {
      await fetch(`${this.apiUrl}?action=recordLike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: track.videoId,
          title: track.title,
          thumbnail: track.thumbnailHigh || track.thumbnail || ''
        })
      });
    } catch(e) {
      console.error('Failed to record like', e);
    }
  }

  async recordShare(track: any) {
    if (!track || !track.videoId) return;
    try {
      await fetch(`${this.apiUrl}?action=recordShare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: track.videoId,
          title: track.title,
          thumbnail: track.thumbnailHigh || track.thumbnail || ''
        })
      });
    } catch(e) {
      console.error('Failed to record share', e);
    }
  }

  getAnalytics(password: string, filter: string = 'all_time') {
    return this.http.get<{status: string, data?: any, message?: string}>(`${this.apiUrl}?action=getAnalytics&pwd=${encodeURIComponent(password)}&filter=${filter}`);
  }

  getGuestGeography(password: string, range: string = 'dau') {
    return this.http.get<{status: string, data?: any, message?: string}>(`${this.apiUrl}?action=getGuestGeography&pwd=${encodeURIComponent(password)}&range=${encodeURIComponent(range)}`);
  }

  getRoomAnalytics(password: string) {
    const backendUrl = (environment as any).backendUrl || 'http://localhost:3000/api';
    return this.http.get<{status: string, data?: any, message?: string}>(`${backendUrl}/room-analytics?pwd=${encodeURIComponent(password)}`);
  }

  // ── Search Analytics Tracking & API ───────────────────────────────────────
  activeSearchId: number | null = null;
  activeSearchQuery: string = '';

  async recordSearch(query: string, category: string = 'songs', resultCount: number = 0, searchType: string = 'manual') {
    const trimmed = query.trim();
    if (!trimmed) return;
    this.activeSearchQuery = trimmed;
    const isGuest = !this.currentUserEmail;
    const userIdentifier = isGuest ? this.getGuestId() : this.currentUserEmail!;

    try {
      const res = await fetch(`${this.apiUrl}?action=recordSearch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          category,
          result_count: resultCount,
          search_type: searchType,
          is_guest: isGuest,
          user_identifier: userIdentifier
        }),
        keepalive: true
      });
      const data = await res.json();
      if (data && data.search_id) {
        this.activeSearchId = data.search_id;
      }
    } catch(e) {
      // Silent catch
    }
  }

  async recordSearchClick(itemId: string, itemTitle: string) {
    if (!this.activeSearchQuery) return;
    try {
      await fetch(`${this.apiUrl}?action=recordSearchClick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_id: this.activeSearchId,
          query: this.activeSearchQuery,
          item_id: itemId,
          item_title: itemTitle
        }),
        keepalive: true
      });
    } catch(e) {
      // Silent catch
    }
  }

  async recordSearchPlay(videoId: string) {
    if (!this.activeSearchQuery) return;
    try {
      await fetch(`${this.apiUrl}?action=recordSearchPlay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_id: this.activeSearchId,
          query: this.activeSearchQuery,
          video_id: videoId
        }),
        keepalive: true
      });
    } catch(e) {
      // Silent catch
    }
  }

  getSearchAnalytics(password: string, params: {
    period?: string;
    from_date?: string;
    to_date?: string;
    category?: string;
    search_type?: string;
    min_volume?: number;
    search_term?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
  } = {}) {
    let queryParams = new URLSearchParams({
      action: 'getSearchAnalytics',
      pwd: password,
      period: params.period || 'last_30_days'
    });

    if (params.from_date) queryParams.set('from_date', params.from_date);
    if (params.to_date) queryParams.set('to_date', params.to_date);
    if (params.category && params.category !== 'all') queryParams.set('category', params.category);
    if (params.search_type && params.search_type !== 'all') queryParams.set('search_type', params.search_type);
    if (params.min_volume) queryParams.set('min_volume', params.min_volume.toString());
    if (params.search_term) queryParams.set('search_term', params.search_term);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.page_size) queryParams.set('page_size', params.page_size.toString());
    if (params.sort_by) queryParams.set('sort_by', params.sort_by);
    if (params.sort_order) queryParams.set('sort_order', params.sort_order);

    return this.http.get<{status: string, data?: any, message?: string}>(`${this.apiUrl}?${queryParams.toString()}`);
  }

  getQueryDetails(password: string, query: string) {
    return this.http.get<{status: string, data?: any, message?: string}>(`${this.apiUrl}?action=getQueryDetails&pwd=${encodeURIComponent(password)}&query=${encodeURIComponent(query)}`);
  }
}
