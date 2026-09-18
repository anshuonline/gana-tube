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

  getRoomAnalytics(password: string) {
    const backendUrl = (environment as any).backendUrl || 'http://localhost:3000/api';
    return this.http.get<{status: string, data?: any, message?: string}>(`${backendUrl}/room-analytics?pwd=${encodeURIComponent(password)}`);
  }
}
