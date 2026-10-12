import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GtanalyticDataService } from '../gtanalytic-data.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import {
  LucideX,
  LucideChevronLeft,
  LucideChevronRight,
  LucideZoomIn,
  LucideCalendar
} from '@lucide/angular';

@Component({
  selector: 'app-gtanalytic-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective,
    LucideX,
    LucideChevronLeft,
    LucideChevronRight,
    LucideZoomIn,
    LucideCalendar
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './gtanalytic-users.html',
  styleUrls: ['./gtanalytic-users.scss']
})
export class GtanalyticUsersComponent {
  dataService = inject(GtanalyticDataService);

  searchQuery = signal<string>('');
  activeTab = signal<'directory' | 'top_active'>('directory');

  // Pagination for User Directory
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Lightbox Modal for Full Picture
  previewUser = signal<any | null>(null);

  summary = computed(() => this.dataService.analyticsData()?.summary || {
    total_users: 0,
    daily_active_users: 0,
    total_plays: 0,
    total_time_seconds: 0
  });

  // User Growth Chart
  growthChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 11 } }
      }
    }
  };

  growthChartLabels = computed(() => {
    const list = this.dataService.analyticsData()?.user_growth || [];
    return list.map((item: any) => item.join_date);
  });

  growthChartData = computed(() => {
    const list = this.dataService.analyticsData()?.user_growth || [];
    return [{
      data: list.map((item: any) => parseInt(item.new_users) || 0),
      label: 'New Registrations',
      borderColor: '#a855f7',
      backgroundColor: 'rgba(168, 85, 247, 0.2)',
      borderWidth: 2,
      fill: true,
      tension: 0.35,
      pointBackgroundColor: '#ec4899',
      pointRadius: 3
    }];
  });

  // Top Active Users
  topUsers = computed(() => {
    return this.dataService.analyticsData()?.top_users || [];
  });

  // Detailed Users with Search
  filteredDetailedUsers = computed(() => {
    const list = this.dataService.analyticsData()?.detailed_users || [];
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((u: any) =>
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  // Total pages
  totalPages = computed(() => {
    const count = this.filteredDetailedUsers().length;
    return Math.max(1, Math.ceil(count / this.pageSize()));
  });

  // Paginated Users Slice
  paginatedDetailedUsers = computed(() => {
    const list = this.filteredDetailedUsers();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  // Pagination info text
  paginationInfo = computed(() => {
    const total = this.filteredDetailedUsers().length;
    if (total === 0) return { start: 0, end: 0, total: 0 };
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), total);
    return { start, end, total };
  });

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  getPageNumbers(): (number | string)[] {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  // Full Picture Lightbox Modal
  openPhotoModal(user: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (user.photo_url) {
      this.previewUser.set(user);
    }
  }

  closePhotoModal(): void {
    this.previewUser.set(null);
  }

  getHighResPhotoUrl(url?: string): string {
    if (!url) return '';
    if (url.includes('googleusercontent.com')) {
      return url.replace(/=s\d+(-c)?/i, '=s500-c');
    }
    return url;
  }

  setFilter(filterId: string) {
    this.dataService.setFilter(filterId);
  }

  formatSeconds(sec: number): string {
    if (!sec) return '0 min';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} mins`;
  }

  formatIST(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    let dStr = dateStr;
    if (!dStr.includes('Z') && !dStr.includes('+')) {
      dStr = dStr.replace(' ', 'T') + '+05:30';
    }
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  formatISTDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    let dStr = dateStr;
    if (!dStr.includes('Z') && !dStr.includes('+')) {
      dStr = dStr.replace(' ', 'T') + '+05:30';
    }
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
