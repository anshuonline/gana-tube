import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GtanalyticDataService } from '../gtanalytic-data.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

@Component({
  selector: 'app-gtanalytic-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './gtanalytic-overview.html',
  styleUrls: ['./gtanalytic-overview.scss']
})
export class GtanalyticOverviewComponent {
  dataService = inject(GtanalyticDataService);

  summary = computed(() => this.dataService.analyticsData()?.summary || {});
  guestSummary = computed(() => this.dataService.analyticsData()?.guest_summary || {});
  roomStats = computed(() => this.dataService.roomAnalytics());

  // Streams split chart (Registered vs Guest)
  streamsSplitLabels = ['Registered Users', 'Guest Visitors'];
  streamsSplitOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#ffffff', boxWidth: 12, padding: 16 }
      }
    }
  };

  streamsSplitData = computed(() => {
    const total = this.summary().total_plays || 0;
    const guest = this.guestSummary().total_guest_plays || 0;
    const registered = Math.max(0, total - guest);

    return [{
      data: [registered, guest],
      backgroundColor: ['#a855f7', '#ec4899'],
      borderColor: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.4)'],
      borderWidth: 2
    }];
  });

  topSongs = computed(() => {
    return (this.dataService.analyticsData()?.most_played || []).slice(0, 5);
  });

  guestTopSongs = computed(() => {
    return (this.dataService.analyticsData()?.guest_top_songs || []).slice(0, 5);
  });

  formatSeconds(sec: number): string {
    if (!sec) return '0h';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }
}
