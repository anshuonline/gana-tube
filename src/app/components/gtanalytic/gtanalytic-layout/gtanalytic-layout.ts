import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { GtanalyticDataService } from '../gtanalytic-data.service';
import { ToastService } from '../../../services/toast.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-gtanalytic-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gtanalytic-layout.html',
  styleUrls: ['./gtanalytic-layout.scss']
})
export class GtanalyticLayoutComponent implements OnInit {
  dataService = inject(GtanalyticDataService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  isMobileMenuOpen = signal<boolean>(false);
  selectedNavPath = '/gtanalytic/overview';

  isSwinging = signal<boolean>(false);
  showNazarBubble = signal<boolean>(false);
  private bubbleTimeout: any;

  triggerNazarDefense(event?: Event) {
    if (event) event.stopPropagation();
    this.isSwinging.set(true);
    this.showNazarBubble.set(true);
    this.cdr.markForCheck();
    this.toastService.show('🌶️ Buri nazar wale tera muh kala! 🍋', 'info', 4000);

    clearTimeout(this.bubbleTimeout);
    this.bubbleTimeout = setTimeout(() => {
      this.showNazarBubble.set(false);
      this.isSwinging.set(false);
      this.cdr.markForCheck();
    }, 4000);
  }

  get isLoggedIn(): boolean {
    return this.dataService.isAuthenticated() && !this.router.url.includes('/login');
  }

  get isPrimaryAdmin(): boolean {
    return this.dataService.isPrimaryAdmin();
  }

  navItems: NavItem[] = [
    { path: '/gtanalytic/overview', label: 'Overview', icon: 'dashboard' },
    { path: '/gtanalytic/user-activity', label: 'User Activity', icon: 'clock' },
    { path: '/gtanalytic/daily', label: 'Daily Summary', icon: 'calendar' },
    { path: '/gtanalytic/search', label: 'Search Analytics', icon: 'search' },
    { path: '/gtanalytic/streamanalytics', label: 'Stream Analytics', icon: 'activity' },
    { path: '/gtanalytic/guests', label: 'Guest Analytics', icon: 'users-guest' },
    { path: '/gtanalytic/users', label: 'User Growth', icon: 'user-check' },
    { path: '/gtanalytic/rooms', label: 'Listening Rooms', icon: 'radio' }
  ];

  timeFilters = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'all_time', label: 'All Time' }
  ];

  ngOnInit() {
    this.selectedNavPath = this.router.url.split('?')[0];
    if (this.dataService.isAuthenticated()) {
      this.dataService.loadAllData();
    }
  }

  onNavDropdownChange(path: string) {
    this.selectedNavPath = path;
    this.router.navigate([path]);
    this.closeMobileMenu();
  }

  onTimeFilterChange(filter: string) {
    this.dataService.setFilter(filter);
  }

  isRefreshingManual = signal<boolean>(false);
  private refreshTimeout: any;

  refreshData() {
    this.isRefreshingManual.set(true);
    this.cdr.markForCheck();
    this.dataService.triggerRefresh();
    clearTimeout(this.refreshTimeout);
    this.refreshTimeout = setTimeout(() => {
      this.isRefreshingManual.set(false);
      this.cdr.markForCheck();
    }, 700);
  }

  // Multi-User Access Keys & Login Audit Logs Management
  showKeyModal = signal<boolean>(false);
  modalTab = signal<'keys' | 'logs'>('keys');
  accessKeys = signal<any[]>([]);
  loadingKeys = signal<boolean>(false);
  loginLogs = signal<any[]>([]);
  loadingLogs = signal<boolean>(false);
  newKeyLabel = '';
  newKeyPwd = '';
  creatingKey = signal<boolean>(false);
  copiedKeyId = signal<number | null>(null);
  copiedLogIp = signal<string | null>(null);
  deletingKeyId = signal<number | null>(null);

  openKeyModal(tab: 'keys' | 'logs' = 'keys') {
    this.modalTab.set(tab);
    this.showKeyModal.set(true);
    this.cdr.markForCheck();
    if (tab === 'keys') {
      this.loadAccessKeys();
    } else {
      this.loadLoginLogs();
    }
  }

  setModalTab(tab: 'keys' | 'logs') {
    this.modalTab.set(tab);
    this.cdr.markForCheck();
    if (tab === 'keys' && this.accessKeys().length === 0) {
      this.loadAccessKeys();
    } else if (tab === 'logs') {
      this.loadLoginLogs();
    }
  }

  closeKeyModal() {
    this.showKeyModal.set(false);
    this.newKeyLabel = '';
    this.newKeyPwd = '';
    this.cdr.markForCheck();
  }

  loadAccessKeys() {
    this.loadingKeys.set(true);
    this.cdr.markForCheck();
    this.dataService.getAccessKeys().pipe(
      finalize(() => {
        this.loadingKeys.set(false);
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.accessKeys.set(res.data || []);
        } else {
          this.toastService.show(res.message || 'Failed to load access keys', 'error');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.show('Failed to connect to server', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  loadLoginLogs() {
    this.loadingLogs.set(true);
    this.cdr.markForCheck();
    this.dataService.getLoginLogs().pipe(
      finalize(() => {
        this.loadingLogs.set(false);
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.loginLogs.set(res.data || []);
        } else {
          this.toastService.show(res.message || 'Failed to load login audit logs', 'error');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.show('Failed to connect to analytics server', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  generateRandomKey() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    let res = 'gt_';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.newKeyPwd = res;
    this.cdr.markForCheck();
  }

  createAccessKey() {
    const label = this.newKeyLabel.trim();
    const pwd = this.newKeyPwd.trim();
    if (!label) {
      this.toastService.show('Please enter a user name / label', 'error');
      return;
    }
    if (!pwd) {
      this.toastService.show('Please enter or generate a password', 'error');
      return;
    }

    this.creatingKey.set(true);
    this.cdr.markForCheck();
    this.dataService.createAccessKey(label, pwd).pipe(
      finalize(() => {
        this.creatingKey.set(false);
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.toastService.show(`Access key generated for "${label}"!`, 'success');
          this.newKeyLabel = '';
          this.newKeyPwd = '';
          this.loadAccessKeys();
        } else {
          this.toastService.show(res.message || 'Failed to create access key', 'error');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.show('Error creating access key', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  copyKey(key: any) {
    const textToCopy = key.plain_hint || '';
    if (!textToCopy) {
      this.toastService.show('No plain password available to copy', 'info');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.copiedKeyId.set(key.id);
        this.cdr.markForCheck();
        this.toastService.show(`Password copied for ${key.user_label}!`, 'success');
        setTimeout(() => {
          this.copiedKeyId.set(null);
          this.cdr.markForCheck();
        }, 2500);
      }).catch(() => {
        this.toastService.show('Failed to copy to clipboard', 'error');
      });
    }
  }

  deleteAccessKey(id: number) {
    this.deletingKeyId.set(id);
    this.cdr.markForCheck();
    this.dataService.deleteAccessKey(id).pipe(
      finalize(() => {
        this.deletingKeyId.set(null);
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.accessKeys.update(keys => keys.filter(k => k.id !== id));
          this.toastService.show('Access key revoked successfully', 'info');
        } else {
          this.toastService.show(res.message || 'Failed to delete key', 'error');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.show('Error deleting access key', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
    this.cdr.markForCheck();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
    this.cdr.markForCheck();
  }

  copyIp(ip: string) {
    if (!ip || ip === '—') return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(ip).then(() => {
        this.copiedLogIp.set(ip);
        this.cdr.markForCheck();
        this.toastService.show(`IP ${ip} copied!`, 'info', 2000);
        setTimeout(() => {
          this.copiedLogIp.set(null);
          this.cdr.markForCheck();
        }, 2000);
      });
    }
  }

  getDeviceIcon(deviceType: string): string {
    const dt = (deviceType || '').toLowerCase();
    if (dt.includes('mobile') || dt.includes('phone')) return '📱';
    if (dt.includes('tablet') || dt.includes('ipad')) return '📟';
    return '💻';
  }

  logout() {
    this.dataService.clearPassword();
    this.router.navigate(['/gtanalytic/login']);
  }
}
