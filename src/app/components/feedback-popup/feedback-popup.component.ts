import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideStar, LucideX, LucideSend, LucideHeartHandshake } from '@lucide/angular';
import { ToastService } from '../../services/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-feedback-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideStar, LucideX, LucideSend, LucideHeartHandshake],
  templateUrl: './feedback-popup.html',
  styleUrls: ['./feedback-popup.scss']
})
export class FeedbackPopupComponent {
  @Output() close = new EventEmitter<void>();

  rating = signal<number>(0);
  hoverRating = signal<number>(0);
  suggestion = signal<string>('');
  isSubmitting = signal<boolean>(false);
  stars = [1, 2, 3, 4, 5];

  constructor(private http: HttpClient, private toastService: ToastService) {}

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
      const payload = {
        rating: this.rating(),
        suggestion: this.suggestion()
      };
      
      const backendUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') 
        ? 'http://localhost/manageads/managegt-api.php?action=submit_feedback' 
        : 'https://manageads.ganatube.in/managegt-api.php?action=submit_feedback';
      
      // Fire and forget (don't break if API doesn't exist yet)
      this.http.post(backendUrl, payload).subscribe({
        next: () => console.log('Feedback submitted successfully'),
        error: (err) => console.log('Feedback API may not be ready, but submission processed locally', err)
      });
      
      // We mark as submitted immediately so user doesn't get blocked
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('gt_feedback_submitted', 'true');
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
    this.close.emit();
  }
}
