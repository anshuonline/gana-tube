import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface WheelStatus {
  status: string;
  g_coins: number;
  spins_left: number;
}

@Injectable({
  providedIn: 'root'
})
export class SpinService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  public spinsLeft = signal<number>(-1); // -1 means uninitialized
  public gCoins = signal<number>(0);
  
  private apiUrl = environment.production ? 'https://ganatube.in/manageads/wheel-api.php' : 'http://localhost/manageads/wheel-api.php';
  
  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.email) {
        this.fetchStatus();
      }
    }, { allowSignalWrites: true });
  }
  
  fetchStatus() {
    const user = this.authService.currentUser();
    if (!user || !user.email) return;
    
    this.http.get<WheelStatus>(`${this.apiUrl}?action=status&email=${encodeURIComponent(user.email)}`)
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.gCoins.set(res.g_coins);
            this.spinsLeft.set(res.spins_left);
          }
        },
        error: (err) => console.error('Error fetching wheel status', err)
      });
  }
}
