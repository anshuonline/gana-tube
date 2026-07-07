import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideUsers, LucideMail, LucideCalendar, LucideMusic, LucideHeart, LucideLanguages, LucideChevronDown, LucideChevronUp } from '@lucide/angular';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface UserData {
  email: string;
  preferred_languages: string[];
  liked_songs: string[];
  listening_preferences: string[];
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-managegt-users',
  standalone: true,
  imports: [CommonModule, LucideUsers, LucideMail, LucideCalendar, LucideMusic, LucideHeart, LucideLanguages, LucideChevronDown, LucideChevronUp],
  templateUrl: './managegt-users.html'
})
export class ManagegtUsersComponent implements OnInit {
  users = signal<UserData[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string>('');
  expandedUser = signal<string | null>(null);

  private apiUrl = 'https://manageads.ganatube.in/user-api.php';

  constructor(private http: HttpClient) {
    if (!environment.production) {
      // For local development
      // this.apiUrl = 'http://localhost/manageads/user-api.php';
    }
  }

  ngOnInit(): void {
    this.fetchUsers();
  }

  async fetchUsers() {
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
      console.error(err);
      this.error.set('Network error while fetching users');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleExpand(email: string) {
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
