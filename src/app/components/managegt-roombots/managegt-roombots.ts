import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LucideSave, LucideRefreshCw } from '@lucide/angular';

@Component({
  selector: 'app-managegt-roombots',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSave, LucideRefreshCw],
  templateUrl: './managegt-roombots.html',
  styleUrls: ['./managegt-roombots.scss']
})
export class ManagegtRoombotsComponent implements OnInit {
  apiUrl = window.location.origin.includes('localhost') ? 'http://localhost/manageads/managegt-api.php' : 'https://manageads.ganatube.in/managegt-api.php';
  
  roomPlaylists: string[] = Array(10).fill('');
  isFetching = false;
  isPublishing = false;
  publishMessage = '';
  
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchConfig();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  async fetchConfig() {
    this.isFetching = true;
    const cacheBuster = new Date().getTime();
    try {
      const data = await firstValueFrom(this.http.get<string[]>(`${this.apiUrl}?action=get_roombots&t=${cacheBuster}`));
      if (Array.isArray(data) && data.length > 0) {
        for (let i = 0; i < 10; i++) {
          this.roomPlaylists[i] = data[i] || '';
        }
      }
    } catch (e) {
      console.error('Failed to fetch roombots config', e);
    } finally {
      this.isFetching = false;
    }
  }

  async saveConfig() {
    this.isPublishing = true;
    this.publishMessage = '';
    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.apiUrl}?action=save_roombots`, {
        roombotsData: this.roomPlaylists
      }, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }));
      if (res && res.status === 'success') {
        this.publishMessage = 'Saved successfully!';
        setTimeout(() => this.publishMessage = '', 3000);
      } else {
        this.publishMessage = 'Error saving.';
      }
    } catch (e) {
      this.publishMessage = 'Request failed.';
      console.error(e);
    } finally {
      this.isPublishing = false;
    }
  }
}
