import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../../services/analytics.service';
import { GtanalyticDataService } from '../gtanalytic-data.service';

@Component({
  selector: 'app-gtanalytic-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gtanalytic-login.html',
  styleUrls: ['./gtanalytic-login.scss']
})
export class GtanalyticLoginComponent {
  private analyticsService = inject(AnalyticsService);
  private dataService = inject(GtanalyticDataService);
  private router = inject(Router);

  password = '';
  loading = false;
  error = '';

  login() {
    if (!this.password.trim()) return;
    this.loading = true;
    this.error = '';

    this.analyticsService.getAnalytics(this.password.trim(), 'all_time').subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          this.dataService.setPassword(this.password.trim());
          this.dataService.analyticsData.set(res.data);
          this.dataService.loadRooms();
          this.router.navigate(['/gtanalytic/overview']);
        } else {
          this.error = res.message || 'Invalid password';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to connect to analytics server';
      }
    });
  }
}
