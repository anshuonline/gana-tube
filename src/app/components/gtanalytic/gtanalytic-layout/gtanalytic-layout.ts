import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

  isMobileMenuOpen = false;
  selectedNavPath = '/gtanalytic/overview';

  isSwinging = false;
  showNazarBubble = false;
  private bubbleTimeout: any;

  triggerNazarDefense(event?: Event) {
    if (event) event.stopPropagation();
    this.isSwinging = true;
    this.showNazarBubble = true;
    this.toastService.show('🌶️ Buri nazar wale tera muh kala! 🍋', 'info', 4000);

    clearTimeout(this.bubbleTimeout);
    this.bubbleTimeout = setTimeout(() => {
      this.showNazarBubble = false;
      this.isSwinging = false;
    }, 4000);
  }

  get isLoggedIn(): boolean {
    return this.dataService.isAuthenticated() && !this.router.url.includes('/login');
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

  refreshData() {
    this.dataService.triggerRefresh();
  }

  // Multi-User Access Keys Management
  showKeyModal = false;
  accessKeys: any[] = [];
  loadingKeys = false;
  newKeyLabel = '';
  newKeyPwd = '';
  creatingKey = false;
  copiedKeyId: number | null = null;
  deletingKeyId: number | null = null;

  openKeyModal() {
    this.showKeyModal = true;
    this.loadAccessKeys();
  }

  closeKeyModal() {
    this.showKeyModal = false;
    this.newKeyLabel = '';
    this.newKeyPwd = '';
  }

  loadAccessKeys() {
    this.loadingKeys = true;
    this.dataService.getAccessKeys().subscribe({
      next: (res) => {
        this.loadingKeys = false;
        if (res.status === 'success') {
          this.accessKeys = res.data || [];
        } else {
          this.toastService.show(res.message || 'Failed to load access keys', 'error');
        }
      },
      error: () => {
        this.loadingKeys = false;
        this.toastService.show('Failed to connect to server', 'error');
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

    this.creatingKey = true;
    this.dataService.createAccessKey(label, pwd).subscribe({
      next: (res) => {
        this.creatingKey = false;
        if (res.status === 'success') {
          this.toastService.show(`Access key generated for "${label}"!`, 'success');
          this.newKeyLabel = '';
          this.newKeyPwd = '';
          this.loadAccessKeys();
        } else {
          this.toastService.show(res.message || 'Failed to create access key', 'error');
        }
      },
      error: () => {
        this.creatingKey = false;
        this.toastService.show('Error creating access key', 'error');
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
        this.copiedKeyId = key.id;
        this.toastService.show(`Password copied for ${key.user_label}!`, 'success');
        setTimeout(() => {
          this.copiedKeyId = null;
        }, 2500);
      }).catch(() => {
        this.toastService.show('Failed to copy to clipboard', 'error');
      });
    }
  }

  deleteAccessKey(id: number) {
    this.deletingKeyId = id;
    this.dataService.deleteAccessKey(id).subscribe({
      next: (res) => {
        this.deletingKeyId = null;
        if (res.status === 'success') {
          this.accessKeys = this.accessKeys.filter(k => k.id !== id);
          this.toastService.show('Access key revoked successfully', 'info');
        } else {
          this.toastService.show(res.message || 'Failed to delete key', 'error');
        }
      },
      error: () => {
        this.deletingKeyId = null;
        this.toastService.show('Error deleting access key', 'error');
      }
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  logout() {
    this.dataService.clearPassword();
    this.router.navigate(['/gtanalytic/login']);
  }
}
