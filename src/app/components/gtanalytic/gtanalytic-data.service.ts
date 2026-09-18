import { Injectable, inject, signal } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';

@Injectable({
  providedIn: 'root'
})
export class GtanalyticDataService {
  private analyticsService = inject(AnalyticsService);

  currentFilter = signal<string>('all_time');
  loading = signal<boolean>(false);
  analyticsData = signal<any>(null);
  roomAnalytics = signal<any>(null);
  roomLoading = signal<boolean>(false);
  error = signal<string>('');
  lastUpdated = signal<Date>(new Date());
  private autoRefreshTimer: any = null;

  getPassword(): string {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('gtanalytic_pwd') || '';
    }
    return '';
  }

  setPassword(pwd: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('gtanalytic_pwd', pwd);
    }
  }

  clearPassword(): void {
    this.stopAutoRefresh();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('gtanalytic_pwd');
    }
    this.analyticsData.set(null);
    this.roomAnalytics.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.getPassword();
  }

  setFilter(filter: string) {
    this.currentFilter.set(filter);
    if (this.isAuthenticated()) {
      this.loadAllData();
    }
  }

  loadAllData() {
    const pwd = this.getPassword();
    if (!pwd) return;

    this.loading.set(true);
    this.error.set('');

    this.analyticsService.getAnalytics(pwd, this.currentFilter()).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.analyticsData.set(res.data);
          this.lastUpdated.set(new Date());
        } else {
          this.error.set(res.message || 'Failed to load analytics data');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Connection to analytics server failed');
        this.loading.set(false);
      }
    });

    this.loadRooms();
    this.startAutoRefresh();
  }

  loadRooms() {
    const pwd = this.getPassword();
    if (!pwd) return;

    this.roomLoading.set(true);
    this.analyticsService.getRoomAnalytics(pwd).subscribe({
      next: (res) => {
        this.roomAnalytics.set(res.status === 'success' ? res.data : null);
        this.roomLoading.set(false);
      },
      error: () => {
        this.roomAnalytics.set(null);
        this.roomLoading.set(false);
      }
    });
  }

  getGuestGeography(range: string = 'dau') {
    const pwd = this.getPassword();
    return this.analyticsService.getGuestGeography(pwd, range);
  }

  startAutoRefresh() {
    if (this.autoRefreshTimer) return;
    this.autoRefreshTimer = setInterval(() => {
      if (this.isAuthenticated()) {
        const pwd = this.getPassword();
        if (!pwd) return;
        this.analyticsService.getAnalytics(pwd, this.currentFilter()).subscribe({
          next: (res) => {
            if (res.status === 'success') {
              this.analyticsData.set(res.data);
              this.lastUpdated.set(new Date());
            }
          }
        });
      }
    }, 20000);
  }

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }
}
