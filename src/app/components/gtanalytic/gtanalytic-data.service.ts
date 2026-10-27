import { Injectable, inject, signal } from '@angular/core';
import { of, Observable, timeout, finalize, catchError } from 'rxjs';
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
  refreshTrigger = signal<number>(0);
  private autoRefreshTimer: any = null;

  isPrimaryAdmin = signal<boolean>(typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gtanalytic_is_primary') === '1' : false);
  userLabel = signal<string>(typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gtanalytic_user_label') || '' : '');

  setIsPrimaryAdmin(isPrimary: boolean, label: string = '') {
    this.isPrimaryAdmin.set(isPrimary);
    this.userLabel.set(label);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('gtanalytic_is_primary', isPrimary ? '1' : '0');
      if (label) sessionStorage.setItem('gtanalytic_user_label', label);
    }
  }

  triggerRefresh() {
    this.refreshTrigger.update(v => v + 1);
    if (this.isAuthenticated()) {
      this.loadAllData();
    }
  }

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
      sessionStorage.removeItem('gtanalytic_is_primary');
      sessionStorage.removeItem('gtanalytic_user_label');
    }
    this.isPrimaryAdmin.set(false);
    this.userLabel.set('');
    this.analyticsData.set(null);
    this.roomAnalytics.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.getPassword();
  }

  setFilter(filter: string) {
    this.currentFilter.set(filter);
    this.triggerRefresh();
  }

  loadAllData() {
    const pwd = this.getPassword();
    if (!pwd) return;

    this.loading.set(true);
    this.error.set('');

    this.analyticsService.getAnalytics(pwd, this.currentFilter()).pipe(
      timeout(15000),
      catchError(err => {
        this.error.set('Connection to analytics server timed out or failed');
        return of<{status: string, data?: any, message?: string, is_primary_admin?: boolean, user_label?: string}>({ status: 'error', data: null, message: 'Connection timed out or failed' });
      }),
      finalize(() => {
        this.loading.set(false);
      })
    ).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.analyticsData.set(res.data);
          this.lastUpdated.set(new Date());
          if (res.is_primary_admin !== undefined) {
            this.setIsPrimaryAdmin(!!res.is_primary_admin, res.user_label || '');
          }
        } else if (res.message) {
          this.error.set(res.message);
        }
      }
    });

    this.loadRooms();
    this.startAutoRefresh();
  }

  loadRooms() {
    const pwd = this.getPassword();
    if (!pwd) return;

    this.roomLoading.set(true);
    this.analyticsService.getRoomAnalytics(pwd).pipe(
      timeout(10000),
      catchError(() => of({ status: 'error', data: null })),
      finalize(() => {
        this.roomLoading.set(false);
      })
    ).subscribe({
      next: (res) => {
        this.roomAnalytics.set(res.status === 'success' ? res.data : null);
      }
    });
  }

  getGuestGeography(range: string = 'dau'): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) {
      return of({ status: 'error', message: 'Unauthorized: Admin password required' });
    }
    return this.analyticsService.getGuestGeography(pwd, range);
  }

  getGuestDevices(range: string = 'dau'): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) {
      return of({ status: 'error', message: 'Unauthorized: Admin password required' });
    }
    return this.analyticsService.getGuestDevices(pwd, range);
  }

  getDailySummary(date: string = ''): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) {
      return of({ status: 'error', message: 'Unauthorized' });
    }
    return this.analyticsService.getDailySummary(pwd, date);
  }

  getUserActivity(filter: string = 'last_28_days', compareA: number = 0, compareB: number = 3): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) {
      return of({ status: 'error', message: 'Unauthorized' });
    }
    return this.analyticsService.getUserActivity(pwd, filter, compareA, compareB);
  }

  getExcludedIps(): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) return of({ status: 'error', message: 'Unauthorized' });
    return this.analyticsService.getExcludedIps(pwd);
  }

  addExcludedIp(ip: string, note?: string): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) return of({ status: 'error', message: 'Unauthorized' });
    return this.analyticsService.addExcludedIp(pwd, ip, note);
  }

  removeExcludedIp(ip: string): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) return of({ status: 'error', message: 'Unauthorized' });
    return this.analyticsService.removeExcludedIp(pwd, ip);
  }

  purgeHostingerBots(): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) return of({ status: 'error', message: 'Unauthorized' });
    return this.analyticsService.purgeHostingerBots(pwd);
  }

  getAccessKeys(): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) return of({ status: 'error', message: 'Unauthorized' });
    return this.analyticsService.getAccessKeys(pwd);
  }

  createAccessKey(label: string, newPwd: string): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) return of({ status: 'error', message: 'Unauthorized' });
    return this.analyticsService.createAccessKey(pwd, label, newPwd);
  }

  deleteAccessKey(id: number): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) return of({ status: 'error', message: 'Unauthorized' });
    return this.analyticsService.deleteAccessKey(pwd, id);
  }

  getLoginLogs(): Observable<any> {
    const pwd = this.getPassword();
    if (!pwd) return of({ status: 'error', message: 'Unauthorized' });
    return this.analyticsService.getLoginLogs(pwd);
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
