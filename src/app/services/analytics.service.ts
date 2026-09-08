import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = environment.backendUrl ? environment.backendUrl.replace('managegt-api.php', 'analytic-api.php') : 'https://manageads.ganatube.in/analytic-api.php';
  
  private timeTrackingInterval: any;
  private currentUserEmail: string | null = null;
  private currentDisplayName: string = 'Unknown User';

  startTrackingTime(email: string, displayName: string) {
    if (this.timeTrackingInterval) {
      clearInterval(this.timeTrackingInterval);
    }
    this.currentUserEmail = email;
    this.currentDisplayName = displayName;
    
    // Record time every 60 seconds
    this.timeTrackingInterval = setInterval(() => {
      this.recordTime(60);
    }, 60000);
  }

  stopTrackingTime() {
    if (this.timeTrackingInterval) {
      clearInterval(this.timeTrackingInterval);
      this.timeTrackingInterval = null;
    }
    this.currentUserEmail = null;
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
    try {
      await fetch(`${this.apiUrl}?action=recordPlay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: track.videoId,
          title: track.title,
          thumbnail: track.thumbnailHigh || track.thumbnail || ''
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

  getAnalytics(password: string) {
    return this.http.get<{status: string, data?: any, message?: string}>(`${this.apiUrl}?action=getAnalytics&pwd=${encodeURIComponent(password)}`);
  }
}
