import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideSave, LucideCheckCircle, LucideXCircle } from '@lucide/angular';

@Component({
  selector: 'app-managegt-discovery',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSave, LucideCheckCircle, LucideXCircle],
  templateUrl: './managegt-discovery.html',
  styleUrls: ['./managegt-discovery.scss']
})
export class ManagegtDiscoveryComponent implements OnInit {
  private http = inject(HttpClient);
  
  private apiUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') 
    ? 'http://localhost/manageads/managegt-api.php' 
    : 'https://manageads.ganatube.in/managegt-api.php';

  jsonInput: string = '';
  isSaving: boolean = false;
  saveSuccess: boolean = false;
  saveError: string = '';

  ngOnInit() {
    this.loadDiscoverySongs();
  }

  loadDiscoverySongs() {
    this.http.get<any[]>(`${this.apiUrl}?action=get_discovery`).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.jsonInput = JSON.stringify(data, null, 2);
        } else {
          this.jsonInput = '[\n  {\n    "videoId": "SAMPLE_ID",\n    "title": "Song Title",\n    "channelTitle": "Artist Name",\n    "thumbnail": "https://img.youtube.com/vi/SAMPLE_ID/mqdefault.jpg",\n    "thumbnailHigh": "https://img.youtube.com/vi/SAMPLE_ID/maxresdefault.jpg"\n  }\n]';
        }
      },
      error: () => {
        this.saveError = 'Failed to load discovery songs.';
      }
    });
  }

  save() {
    let parsedData;
    try {
      parsedData = JSON.parse(this.jsonInput);
      if (!Array.isArray(parsedData) && typeof parsedData !== 'object') {
        throw new Error('Root element must be an array or a valid object.');
      }
    } catch (e: any) {
      this.saveError = 'Invalid JSON: ' + e.message;
      return;
    }

    this.isSaving = true;
    this.saveError = '';
    this.saveSuccess = false;

    this.http.post<{status: string, message?: string}>(`${this.apiUrl}?action=save_discovery`, {
      discoveryData: parsedData
    }).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.saveSuccess = true;
          setTimeout(() => this.saveSuccess = false, 3000);
        } else {
          this.saveError = res.message || 'Unknown error occurred';
        }
      },
      error: () => {
        this.isSaving = false;
        this.saveError = 'Failed to save data. Please check network.';
      }
    });
  }
}
