import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GtanalyticDataService } from '../gtanalytic-data.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

@Component({
  selector: 'app-gtanalytic-active-times',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './gtanalytic-active-times.html',
  styleUrls: ['./gtanalytic-active-times.scss']
})
export class GtanalyticActiveTimesComponent implements OnInit {
  dataService = inject(GtanalyticDataService);

  loading = signal<boolean>(false);
  errorMsg = signal<string>('');
  activityData = signal<any>(null);

  selectedFilter = signal<string>('last_28_days');
  selectedCompareA = signal<number>(0); // 0 = Sunday
  selectedCompareB = signal<number>(3); // 3 = Wednesday

  hoveredCell = signal<any>(null);
  selectedCell = signal<any>(null);
  activeSubTab = signal<'heatmap' | 'compare' | 'leaderboard'>('heatmap');

  dayOptions = [
    { index: 0, name: 'Sunday', short: 'Sun' },
    { index: 1, name: 'Monday', short: 'Mon' },
    { index: 2, name: 'Tuesday', short: 'Tue' },
    { index: 3, name: 'Wednesday', short: 'Wed' },
    { index: 4, name: 'Thursday', short: 'Thu' },
    { index: 5, name: 'Friday', short: 'Fri' },
    { index: 6, name: 'Saturday', short: 'Sat' }
  ];

  timeFilters = [
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'last_28_days', label: 'Last 28 Days' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'all_time', label: 'All Time' }
  ];

  // 24-hour hour labels for headers & charts
  hourLabels = [
    '12a', '1a', '2a', '3a', '4a', '5a',
    '6a', '7a', '8a', '9a', '10a', '11a',
    '12p', '1p', '2p', '3p', '4p', '5p',
    '6p', '7p', '8p', '9p', '10p', '11p'
  ];

  // Head-to-Head Day vs Day Chart
  dayCompareChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
          font: { size: 12, family: 'Inter, sans-serif', weight: 'bold' },
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 16, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 11 } }
      }
    }
  };

  dayCompareChartLabels = computed(() => {
    return this.hourLabels;
  });

  dayCompareChartData = computed(() => {
    const data = this.activityData();
    if (!data?.day_vs_day) return [];

    const curveA = data.day_vs_day.day_a?.curve || [];
    const curveB = data.day_vs_day.day_b?.curve || [];

    return [
      {
        data: curveA.map((c: any) => c.value || 0),
        label: `${data.day_vs_day.day_a?.name || 'Day A'} (Peak: ${data.day_vs_day.day_a?.peak_hour})`,
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#ec4899',
        pointRadius: 3
      },
      {
        data: curveB.map((c: any) => c.value || 0),
        label: `${data.day_vs_day.day_b?.name || 'Day B'} (Peak: ${data.day_vs_day.day_b?.peak_hour})`,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#a855f7',
        pointRadius: 3
      }
    ];
  });

  // Period Comparison (This Period vs Previous Period) Grouped Bar Chart
  periodCompareChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
          font: { size: 12, family: 'Inter, sans-serif', weight: 'bold' },
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 16, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 11 } }
      }
    }
  };

  periodCompareLabels = computed(() => {
    const list = this.activityData()?.period_comparison?.days || [];
    return list.map((d: any) => d.short_name || d.day_name);
  });

  periodCompareData = computed(() => {
    const list = this.activityData()?.period_comparison?.days || [];
    return [
      {
        data: list.map((d: any) => d.current || 0),
        label: 'Current Period',
        backgroundColor: 'rgba(236, 72, 153, 0.85)',
        borderColor: '#ec4899',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        data: list.map((d: any) => d.previous || 0),
        label: 'Previous Period',
        backgroundColor: 'rgba(168, 85, 247, 0.45)',
        borderColor: '#a855f7',
        borderWidth: 1,
        borderRadius: 4
      }
    ];
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.errorMsg.set('');

    this.dataService.getUserActivity(
      this.selectedFilter(),
      this.selectedCompareA(),
      this.selectedCompareB()
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.status === 'success' && res.data) {
          this.activityData.set(res.data);
          // Set default selected cell to the peak hour of peak day
          if (!this.selectedCell() && res.data.days_ranked?.length > 0) {
            const peakDay = res.data.days_ranked[0];
            const peakDowObj = res.data.heatmap?.find((d: any) => d.day_index === peakDay.day_index);
            if (peakDowObj) {
              const peakCell = peakDowObj.hours?.find((h: any) => h.hour === peakDay.peak_hour);
              if (peakCell) {
                this.selectedCell.set({ ...peakCell, day_name: peakDay.day_name });
              }
            }
          }
        } else {
          this.errorMsg.set(res.message || 'Failed to load user activity data');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set('Network connection failed. Unable to fetch activity metrics.');
      }
    });
  }

  setFilter(filter: string): void {
    if (this.selectedFilter() === filter) return;
    this.selectedFilter.set(filter);
    this.loadData();
  }

  setSubTab(tab: 'heatmap' | 'compare' | 'leaderboard'): void {
    this.activeSubTab.set(tab);
  }

  onCompareChange(): void {
    this.loadData();
  }

  onCellHover(cell: any, day: any): void {
    this.hoveredCell.set({ ...cell, day_name: day.day_name, short_name: day.short_name });
  }

  onCellLeave(): void {
    this.hoveredCell.set(null);
  }

  onCellClick(cell: any, day: any): void {
    this.selectedCell.set({ ...cell, day_name: day.day_name, short_name: day.short_name });
  }

  getIntensityClass(intensity: number): string {
    switch (intensity) {
      case 0: return 'intensity-0';
      case 1: return 'intensity-1';
      case 2: return 'intensity-2';
      case 3: return 'intensity-3';
      case 4: return 'intensity-4';
      default: return 'intensity-0';
    }
  }

  formatHour(h: number): string {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }
}
