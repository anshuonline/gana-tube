import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../../services/analytics.service';
import { GtanalyticDataService } from '../gtanalytic-data.service';
import { ToastService } from '../../../services/toast.service';

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
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  password = '';
  loading = signal<boolean>(false);
  error = signal<string>('');

  isSwinging = signal<boolean>(false);
  showNazarBubble = signal<boolean>(false);
  private bubbleTimeout: any;

  triggerNazarDefense() {
    this.isSwinging.set(true);
    this.showNazarBubble.set(true);
    this.cdr.markForCheck();
    this.toastService.show('🌶️ Buri nazar wale tera muh kala! 🍋', 'info', 4000);

    clearTimeout(this.bubbleTimeout);
    this.bubbleTimeout = setTimeout(() => {
      this.showNazarBubble.set(false);
      this.isSwinging.set(false);
      this.cdr.markForCheck();
    }, 4000);
  }

  login() {
    if (!this.password.trim()) return;
    this.loading.set(true);
    this.error.set('');
    this.cdr.markForCheck();

    this.analyticsService.getAnalytics(this.password.trim(), 'all_time', true).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.cdr.markForCheck();
        if (res.status === 'success') {
          this.dataService.setPassword(this.password.trim());
          if ((res as any).is_primary_admin !== undefined) {
            this.dataService.setIsPrimaryAdmin(!!(res as any).is_primary_admin, (res as any).user_label || '');
          }
          this.dataService.analyticsData.set(res.data);
          this.dataService.loadRooms();
          this.router.navigate(['/gtanalytic/overview']);
        } else {
          this.error.set(res.message || 'Invalid password');
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to connect to analytics server');
        this.cdr.markForCheck();
      }
    });
  }
}
