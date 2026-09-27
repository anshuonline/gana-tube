import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GtanalyticDataService } from '../gtanalytic-data.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

@Component({
  selector: 'app-gtanalytic-daily',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './gtanalytic-daily.html',
  styleUrls: ['./gtanalytic-daily.scss']
})
export class GtanalyticDailyComponent implements OnInit {
  dataService = inject(GtanalyticDataService);

  loading = signal<boolean>(false);
  dailyData = signal<any>(null);
  errorMsg = signal<string>('');
  selectedDate = signal<string>(this.todayStr());
  activeTab = signal<'songs' | 'guests' | 'users'>('songs');

  private todayStr(): string {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  private yesterdayStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  isToday = computed(() => this.selectedDate() === this.todayStr());
  isYesterday = computed(() => this.selectedDate() === this.yesterdayStr());

  dateLabel = computed(() => {
    if (this.isToday()) return 'Today';
    if (this.isYesterday()) return 'Yesterday';
    const d = new Date(this.selectedDate() + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  });

  // Chart config
  trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#ffffff', boxWidth: 10, padding: 14, font: { size: 11 } }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 } }
      }
    }
  };

  trendChartLabels = computed(() => {
    const days = this.dailyData()?.recent_days || [];
    return days.map((d: any) => d.label);
  });

  trendChartData = computed(() => {
    const days = this.dailyData()?.recent_days || [];
    return [
      {
        data: days.map((d: any) => d.total_plays || 0),
        label: 'Total Plays',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderColor: '#a855f7',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#a855f7'
      },
      {
        data: days.map((d: any) => d.guest_plays || 0),
        label: 'Guest Plays',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderColor: '#ec4899',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#ec4899'
      }
    ];
  });

  visitorChartLabels = computed(() => {
    const days = this.dailyData()?.recent_days || [];
    return days.map((d: any) => d.label);
  });

  visitorChartData = computed(() => {
    const days = this.dailyData()?.recent_days || [];
    return [
      {
        data: days.map((d: any) => (d.guest_visitors || 0) + (d.logged_in_users || 0)),
        label: 'Total Visitors',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: '#10b981',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981'
      },
      {
        data: days.map((d: any) => d.logged_in_users || 0),
        label: 'Logged-In Users',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      }
    ];
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.errorMsg.set('');
    this.dataService.getDailySummary(this.selectedDate()).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.dailyData.set(res.data);
          this.errorMsg.set('');
        } else {
          this.errorMsg.set(res.message || 'Failed to load daily summary data');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.message || 'Failed to connect to analytics server');
        this.loading.set(false);
      }
    });
  }

  goToday() {
    this.selectedDate.set(this.todayStr());
    this.loadData();
  }

  goYesterday() {
    this.selectedDate.set(this.yesterdayStr());
    this.loadData();
  }

  onDateChange(event: any) {
    this.selectedDate.set(event.target.value);
    this.loadData();
  }

  prevDay() {
    const d = new Date(this.selectedDate() + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    this.loadData();
  }

  nextDay() {
    const d = new Date(this.selectedDate() + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const today = new Date();
    if (d > today) return;
    this.selectedDate.set(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    this.loadData();
  }

  formatSeconds(sec: number): string {
    if (!sec) return '0m';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }

  formatGuestId(id: string): string {
    if (!id) return 'Unknown';
    if (id.length > 16) return id.substring(0, 8) + '...' + id.substring(id.length - 4);
    return id;
  }

  formatIST(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return dateStr;
    }
  }
}
