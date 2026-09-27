import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideStar, LucideX, LucideSend, LucideHeartHandshake } from '@lucide/angular';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

export interface FeedbackPopupConfig {
  enabled: boolean;
  delaySeconds: number;
  frequencyHours: number;
  dismissCooldownHours: number;
  minSongsPlayed: number;
  targetAudience: 'all' | 'guest' | 'user';
  showOnMobile: boolean;
  showOnDesktop: boolean;
  title: string;
  subtitle: string;
}

export const DEFAULT_FEEDBACK_POPUP_CONFIG: FeedbackPopupConfig = {
  enabled: true,
  delaySeconds: 40,
  frequencyHours: 720,
  dismissCooldownHours: 24,
  minSongsPlayed: 1,
  targetAudience: 'all',
  showOnMobile: true,
  showOnDesktop: true,
  title: 'Enjoying GanaTube?',
  subtitle: 'Help us improve your music experience. Rate us and drop a suggestion!'
};

@Component({
  selector: 'app-feedback-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideStar, LucideX, LucideSend, LucideHeartHandshake],
  templateUrl: './feedback-popup.html',
  styleUrls: ['./feedback-popup.scss']
})
export class FeedbackPopupComponent {
  @Input() title: string = 'Enjoying GanaTube?';
  @Input() subtitle: string = 'Help us improve your music experience. Rate us and drop a suggestion!';
  @Output() close = new EventEmitter<void>();

  rating = signal<number>(0);
  hoverRating = signal<number>(0);
  suggestion: string = '';
  isSubmitting = signal<boolean>(false);
  stars = [1, 2, 3, 4, 5];

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    public authService: AuthService
  ) {}

  setHoverRating(r: number) {
    this.hoverRating.set(r);
  }

  setRating(r: number) {
    this.rating.set(r);
  }

  async submitFeedback() {
    if (this.rating() === 0) {
      this.toastService.show('Please select a star rating first!', 'error');
      return;
    }

    this.isSubmitting.set(true);

    try {
      const user = this.authService.currentUser();
      let userName = 'Guest';
      if (user) {
        if (user.displayName) {
          userName = user.displayName;
        } else if (user.email) {
          userName = user.email.split('@')[0];
        } else {
          userName = 'User';
        }
      }

      const payload = {
        rating: this.rating(),
        suggestion: this.suggestion ? this.suggestion.trim() : '',
        user_name: userName
      };
      
      const backendUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') 
        ? 'http://localhost/manageads/managegt-api.php?action=submit_feedback' 
        : 'https://manageads.ganatube.in/managegt-api.php?action=submit_feedback';
      
      // Fire and forget
      this.http.post(backendUrl, payload).subscribe({
        next: () => console.log('Feedback submitted successfully'),
        error: (err) => console.log('Feedback API may not be ready, but submission processed locally', err)
      });
      
      // We mark as submitted with timestamp
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('gt_feedback_submitted', Date.now().toString());
        localStorage.setItem('gt_feedback_submitted_at', Date.now().toString());
      }
      
      this.toastService.show('Thank you! Your feedback makes GanaTube better. ❤️', 'success');
      this.closePopup();
    } catch (error) {
      console.error(error);
      this.toastService.show('Something went wrong. Please try again later.', 'error');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  closePopup() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('gt_feedback_dismissed', 'true');
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('gt_feedback_dismissed_at', Date.now().toString());
    }
    this.close.emit();
  }
}
