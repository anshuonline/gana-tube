import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../services/analytics.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './analytics-page.component.html',
  styleUrls: ['./analytics-page.component.scss'] // We'll just load tailwind classes in HTML
})
export class AnalyticsPageComponent implements OnInit {
  analyticsService = inject(AnalyticsService);

  isAuthenticated = false;
  password = '';
  loginError = '';
  loading = false;

  analyticsData: any = null;

  // Chart configuration
  public mostPlayedOptions: any = { 
    responsive: true, 
    plugins: { legend: { display: false } }, 
    scales: { 
      y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#ccc' } },
      x: { grid: { color: '#333' }, ticks: { color: '#ccc' } }
    },
    color: '#fff'
  };
  public mostPlayedLabels: string[] = [];
  public mostPlayedData: any[] = [];
  
  public mostLikedOptions: any = { 
    responsive: true, 
    plugins: { legend: { display: false } }, 
    scales: { 
      y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#ccc' } },
      x: { grid: { color: '#333' }, ticks: { color: '#ccc' } }
    },
    color: '#fff'
  };
  public mostLikedLabels: string[] = [];
  public mostLikedData: any[] = [];

  ngOnInit() {
    // Check if password exists in session storage
    const savedPwd = sessionStorage.getItem('gtanalytic_pwd');
    if (savedPwd) {
      this.password = savedPwd;
      this.login();
    }
  }

  login() {
    if (!this.password) return;
    this.loading = true;
    this.loginError = '';
    
    this.analyticsService.getAnalytics(this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          this.isAuthenticated = true;
          sessionStorage.setItem('gtanalytic_pwd', this.password);
          this.analyticsData = res.data;
          this.prepareCharts();
        } else {
          this.loginError = res.message || 'Invalid password';
        }
      },
      error: (err) => {
        this.loading = false;
        this.loginError = 'Error connecting to analytics server';
      }
    });
  }

  prepareCharts() {
    if (!this.analyticsData) return;

    this.mostPlayedLabels = this.analyticsData.most_played.map((s: any) => s.title.substring(0, 15) + '...');
    this.mostPlayedData = [{
      data: this.analyticsData.most_played.map((s: any) => s.play_count),
      label: 'Plays',
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }];

    this.mostLikedLabels = this.analyticsData.most_liked.map((s: any) => s.title.substring(0, 15) + '...');
    this.mostLikedData = [{
      data: this.analyticsData.most_liked.map((s: any) => s.like_count),
      label: 'Likes',
      backgroundColor: 'rgba(255, 99, 132, 0.8)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }];
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  logout() {
    sessionStorage.removeItem('gtanalytic_pwd');
    this.isAuthenticated = false;
    this.password = '';
    this.analyticsData = null;
  }
}
