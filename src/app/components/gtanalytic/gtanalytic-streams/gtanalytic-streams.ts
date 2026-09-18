import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GtanalyticDataService } from '../gtanalytic-data.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

@Component({
  selector: 'app-gtanalytic-streams',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './gtanalytic-streams.html',
  styleUrls: ['./gtanalytic-streams.scss']
})
export class GtanalyticStreamsComponent {
  dataService = inject(GtanalyticDataService);

  searchQuery = signal<string>('');

  // Top 10 Most Played Bar Chart
  barChartOptions = {
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

  barChartLabels = computed(() => {
    const list = (this.dataService.analyticsData()?.most_played || []).slice(0, 10);
    return list.map((s: any) => s.title ? (s.title.length > 18 ? s.title.substring(0, 18) + '...' : s.title) : s.video_id);
  });

  barChartData = computed(() => {
    const list = (this.dataService.analyticsData()?.most_played || []).slice(0, 10);
    return [{
      data: list.map((s: any) => s.play_count || 0),
      label: 'Total Plays',
      backgroundColor: 'rgba(168, 85, 247, 0.85)',
      borderColor: '#a855f7',
      borderWidth: 1,
      borderRadius: 6
    }];
  });

  filteredSongs = computed(() => {
    const list = this.dataService.analyticsData()?.most_played || [];
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((s: any) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.artist || '').toLowerCase().includes(q) ||
      (s.video_id || '').toLowerCase().includes(q)
    );
  });

  setFilter(filterId: string) {
    this.dataService.setFilter(filterId);
  }
}
