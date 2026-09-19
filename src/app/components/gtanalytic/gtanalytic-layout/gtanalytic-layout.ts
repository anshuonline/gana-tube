import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GtanalyticDataService } from '../gtanalytic-data.service';

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

  isMobileMenuOpen = false;
  selectedNavPath = '/gtanalytic/overview';

  get isLoggedIn(): boolean {
    return this.dataService.isAuthenticated() && !this.router.url.includes('/login');
  }

  navItems: NavItem[] = [
    { path: '/gtanalytic/overview', label: 'Overview', icon: 'dashboard' },
    { path: '/gtanalytic/search', label: 'Search Analytics', icon: 'search', badge: 'New' },
    { path: '/gtanalytic/streamanalytics', label: 'Stream Analytics', icon: 'activity' },
    { path: '/gtanalytic/guests', label: 'Guest Analytics', icon: 'users-guest', badge: 'Hot' },
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
