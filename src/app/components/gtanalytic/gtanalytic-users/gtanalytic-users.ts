import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GtanalyticDataService } from '../gtanalytic-data.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

@Component({
  selector: 'app-gtanalytic-users',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './gtanalytic-users.html',
  styleUrls: ['./gtanalytic-users.scss']
})
export class GtanalyticUsersComponent {
  dataService = inject(GtanalyticDataService);

  searchQuery = signal<string>('');
  activeTab = signal<'directory' | 'top_active'>('directory');

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
