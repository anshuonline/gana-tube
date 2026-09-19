import { Component, inject, computed, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GtanalyticDataService } from '../gtanalytic-data.service';

@Component({
  selector: 'app-gtanalytic-guests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gtanalytic-guests.html',
  styleUrls: ['./gtanalytic-guests.scss']
})
export class GtanalyticGuestsComponent {
  dataService = inject(GtanalyticDataService);

  searchQuery = signal<string>('');
  activeTab = signal<'active' | 'songs' | 'activity'>('active');
  selectedGuest = signal<any | null>(null);

  guestSummary = computed(() => this.dataService.analyticsData()?.guest_summary || {
    total_guests: 0,
    active_guests_today: 0,
    online_guests_now: 0,
    total_guest_plays: 0,
    total_guest_time_seconds: 0
  });

  onlineGuests = computed(() => {
    const list = this.dataService.analyticsData()?.online_guests || [];
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((g: any) =>
      (g.guest_id || '').toLowerCase().includes(q) ||
      (g.ip_address || '').toLowerCase().includes(q) ||
      (g.location || '').toLowerCase().includes(q) ||
      (g.current_page || '').toLowerCase().includes(q) ||
      (g.last_search || '').toLowerCase().includes(q) ||
      (g.last_song_title || '').toLowerCase().includes(q)
    );
  });

  guestTopSongs = computed(() => {
    const list = this.dataService.analyticsData()?.guest_top_songs || [];
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((s: any) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.artist || '').toLowerCase().includes(q) ||
      (s.video_id || '').toLowerCase().includes(q)
    );
  });

  recentGuests = computed(() => {
    const list = this.dataService.analyticsData()?.recent_guests || [];
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((g: any) =>
      (g.guest_id || '').toLowerCase().includes(q) ||
      (g.ip_address || '').toLowerCase().includes(q) ||
      (g.location || '').toLowerCase().includes(q) ||
      (g.current_page || '').toLowerCase().includes(q) ||
      (g.last_search || '').toLowerCase().includes(q) ||
      (g.last_song_title || '').toLowerCase().includes(q)
    );
  });

  openGuestModal(guest: any) {
    this.selectedGuest.set(guest);
  }

  closeGuestModal() {
    this.selectedGuest.set(null);
  }

  getCountryFlag(code: string): string {
    if (!code || code.length !== 2) return '🌐';
    try {
      const c = code.toUpperCase();
      return String.fromCodePoint(c.charCodeAt(0) + 127397, c.charCodeAt(1) + 127397);
    } catch {
      return '🌐';
    }
  }

  formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    let dStr = dateStr;
    if (!dStr.includes('Z') && !dStr.includes('+')) {
      dStr = dStr.replace(' ', 'T') + '+05:30';
    }
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
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

  // ── Audience Geography Demographics Modal ──
  isGeoModalOpen = signal<boolean>(false);
  geoRange = signal<'dau' | 'wau' | 'mau' | 'yau' | 'all'>('dau');
  geoLoading = signal<boolean>(false);
  geoData = signal<any>(null);
  geoSearchQuery = signal<string>('');
  geoError = signal<string>('');
  private geoSub?: Subscription;

  filteredGeoLocations = computed(() => {
    const data = this.geoData();
    const list = data?.locations || [];
    const q = this.geoSearchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((l: any) =>
      (l?.city || '').toLowerCase().includes(q) ||
      (l?.region || '').toLowerCase().includes(q) ||
      (l?.country || '').toLowerCase().includes(q)
    );
  });

  openGeoModal() {
    this.geoSearchQuery.set('');
    this.geoError.set('');
    this.isGeoModalOpen.set(true);
    this.loadGeoData();
  }

  closeGeoModal() {
    this.isGeoModalOpen.set(false);
    this.geoSub?.unsubscribe();
  }

  setGeoRange(range: 'dau' | 'wau' | 'mau' | 'yau' | 'all') {
    if (this.geoRange() === range) return;
    this.geoRange.set(range);
    this.loadGeoData();
  }

  loadGeoData() {
    this.geoSub?.unsubscribe();
    this.geoLoading.set(true);
    this.geoError.set('');
    this.geoSub = this.dataService.getGuestGeography(this.geoRange()).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.geoData.set(res.data);
        } else {
          this.geoError.set(res.message || 'Failed to load geography data');
        }
        this.geoLoading.set(false);
      },
      error: (err: any) => {
        this.geoError.set('Network error loading geography data');
        this.geoLoading.set(false);
      }
    });
  }
}
