import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GtanalyticDataService } from '../gtanalytic-data.service';

@Component({
  selector: 'app-gtanalytic-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gtanalytic-rooms.html',
  styleUrls: ['./gtanalytic-rooms.scss']
})
export class GtanalyticRoomsComponent implements OnInit, OnDestroy {
  dataService = inject(GtanalyticDataService);

  searchQuery = signal<string>('');
  private refreshTimer: any;

  roomStats = computed(() => this.dataService.roomAnalytics() || {
    totalCreated: 0,
    activeRoomCount: 0,
    totalActiveMembers: 0,
    dismissed: 0,
    botRoomCount: 0,
    realRoomCount: 0,
    activeRooms: []
  });

  filteredRooms = computed(() => {
    const list = this.roomStats().activeRooms || [];
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((r: any) =>
      (r.roomId || '').toLowerCase().includes(q) ||
      (r.name || '').toLowerCase().includes(q) ||
      (r.adminName || '').toLowerCase().includes(q) ||
      (r.currentTrack || '').toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.dataService.loadRooms();
    // Poll rooms every 15 seconds for live monitor
    this.refreshTimer = setInterval(() => {
      this.dataService.loadRooms();
    }, 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  refreshNow() {
    this.dataService.loadRooms();
  }
}
