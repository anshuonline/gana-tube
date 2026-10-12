import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  LucideUsers,
  LucideMail,
  LucideCalendar,
  LucideMusic,
  LucideHeart,
  LucideLanguages,
  LucideChevronDown,
  LucideChevronUp,
  LucideRefreshCw,
  LucideSearch,
  LucideX,
  LucideChevronLeft,
  LucideChevronRight,
  LucideZoomIn
} from '@lucide/angular';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface UserData {
  email: string;
  display_name?: string;
  photo_url?: string;
  preferred_languages: string[];
  liked_songs: string[];
  listening_preferences: string[];
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-managegt-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideUsers,
    LucideMail,
    LucideCalendar,
    LucideMusic,
    LucideHeart,
    LucideLanguages,
    LucideChevronDown,
    LucideChevronUp,
    LucideRefreshCw,
    LucideSearch,
    LucideX,
    LucideChevronLeft,
    LucideChevronRight,
    LucideZoomIn
  ],
  templateUrl: './managegt-users.html',
  styleUrls: ['./managegt-users.scss']
})
export class ManagegtUsersComponent implements OnInit {
  users = signal<UserData[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string>('');
  expandedUser = signal<string | null>(null);

  // Search
  searchQuery = signal<string>('');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Lightbox Modal for Full Picture
  previewUser = signal<UserData | null>(null);

  private apiUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost')
    ? 'http://localhost/manageads/user-api.php'
    : 'https://manageads.ganatube.in/user-api.php';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  async fetchUsers(): Promise<void> {
    this.isLoading.set(true);
    this.error.set('');
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}?action=getAllUsers`));
      if (response.status === 'success') {
        this.users.set(response.data || []);
      } else {
        this.error.set(response.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      this.error.set('Network error while fetching users');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Filtered Users based on Search Query (Email or Name)
  filteredUsers = computed(() => {
    const list = this.users();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return list;
    return list.filter((user) => {
      const email = (user.email || '').toLowerCase();
      const name = (user.display_name || '').toLowerCase();
      return email.includes(query) || name.includes(query);
    });
  });

  // Total pages
  totalPages = computed(() => {
    const count = this.filteredUsers().length;
    return Math.max(1, Math.ceil(count / this.pageSize()));
  });

  // Current slice of users for active page
  paginatedUsers = computed(() => {
    const list = this.filteredUsers();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  // Pagination range info
  paginationInfo = computed(() => {
    const total = this.filteredUsers().length;
    if (total === 0) return { start: 0, end: 0, total: 0 };
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), total);
    return { start, end, total };
  });

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1); // Reset to page 1 on new search
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
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

  // Generate an array of page numbers to render
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
  openPhotoModal(user: UserData, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Do not trigger card expansion
    }
    if (user.photo_url) {
      this.previewUser.set(user);
    }
  }

  closePhotoModal(): void {
    this.previewUser.set(null);
  }

  // Upgrades Google profile picture to high-res (e.g. replace =s96-c with =s500-c)
  getHighResPhotoUrl(url?: string): string {
    if (!url) return '';
    if (url.includes('googleusercontent.com')) {
      return url.replace(/=s\d+(-c)?/i, '=s500-c');
    }
    return url;
  }

  toggleExpand(email: string): void {
    if (this.expandedUser() === email) {
      this.expandedUser.set(null);
    } else {
      this.expandedUser.set(email);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
