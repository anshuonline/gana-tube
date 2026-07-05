import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-manage-ads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-ads.html',
  styleUrls: ['./manage-ads.scss']
})
export class ManageAdsComponent {
  private http = inject(HttpClient);
  
  password = signal('');
  imageUrl = signal('');
  linkUrl = signal('');
  isActive = signal(false);
  
  message = signal('');
  isError = signal(false);
  
  constructor() {
    this.fetchCurrentAd();
  }

  fetchCurrentAd() {
    const backendUrl = (environment as any).backendUrl || 'http://localhost:3000/api';
    this.http.get<any>(`${backendUrl}/ads`).subscribe({
      next: (res) => {
        if (res) {
          this.imageUrl.set(res.imageUrl || '');
          this.linkUrl.set(res.linkUrl || '');
          this.isActive.set(res.isActive || false);
        }
      },
      error: (err) => {
        console.error('Failed to fetch current ad', err);
      }
    });
  }

  saveAd() {
    this.message.set('');
    this.isError.set(false);

    if (!this.password()) {
      this.isError.set(true);
      this.message.set('Password is required!');
      return;
    }

    const backendUrl = (environment as any).backendUrl || 'http://localhost:3000/api';
    const payload = {
      password: this.password(),
      adConfig: {
        imageUrl: this.imageUrl(),
        linkUrl: this.linkUrl(),
        isActive: this.isActive()
      }
    };

    this.http.post<any>(`${backendUrl}/ads`, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.isError.set(false);
          this.message.set('Ad saved successfully!');
        }
      },
      error: (err) => {
        this.isError.set(true);
        if (err.status === 401) {
          this.message.set('Incorrect password!');
        } else {
          this.message.set('Failed to save ad. See console for details.');
        }
        console.error('Save ad error', err);
      }
    });
  }
}
