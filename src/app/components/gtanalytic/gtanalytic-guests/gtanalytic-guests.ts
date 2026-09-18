import { Component, inject, computed, signal } from '@angular/core';
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
  activeTab = signal<'songs' | 'activity'>('songs');

  guestSummary = computed(() => this.dataService.analyticsData()?.guest_summary || {
    total_guests: 0,
    active_guests_today: 0,
    online_guests_now: 0,
    total_guest_plays: 0,
    total_guest_time_seconds: 0
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
      (g.last_song_title || '').toLowerCase().includes(q)
    );
  });

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
}
