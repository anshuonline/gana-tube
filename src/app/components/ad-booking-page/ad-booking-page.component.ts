import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { App } from '../../app';

@Component({
  selector: 'app-ad-booking-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './ad-booking-page.component.html',
  styleUrls: ['./ad-booking-page.component.scss']
})
export class AdBookingPageComponent implements OnInit {
  private http = inject(HttpClient);

  // Placements state
  availablePlacements = [
    { id: 'bottom_player_banner', name: 'Bottom Player Banner', pricePerHour: 80, selected: false },
    { id: 'home_feed_banner', name: 'Home Feed Banner', pricePerHour: 120, selected: false },
    { id: 'playlist_in_feed_banner', name: 'Playlist In-Feed Banner', pricePerHour: 100, selected: false }
  ];

  durationHours = 0;
  totalPrice = 0;

  // Form Fields
  name = '';
  email = '';
  brandName = '';
  startDateTime = '';
  endDateTime = '';
  targetAudience = '';
  adLink = '';
  adDescription = '';
  agreedTos = false;

  isSubmitting = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor(private app: App) {}

  ngOnInit() {
    // Fetch dynamic prices from backend
    const apiUrl = window.location.origin.includes('localhost') ? 'http://localhost/manageads/api.php?action=prices' : '/manageads/api.php?action=prices';
    this.http.get<any>(apiUrl).subscribe({
      next: (data) => {
        this.availablePlacements.forEach(p => {
          if (data[p.id]) {
            p.pricePerHour = parseInt(data[p.id], 10);
          }
        });
        this.calculateTotals(); // recalculate if prices updated
      },
      error: (err) => console.error('Failed to load prices', err)
    });

    // Read state passed from advertise page
    const passedId = this.app.bookingState.placementId;
    if (passedId) {
      const placement = this.availablePlacements.find(p => p.id === passedId);
      if (placement) placement.selected = true;
    }

    // Set min start date to today/now
    const now = new Date();
    // Default to +1 hour from now for start
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    this.startDateTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

    const end = new Date(now);
    // If they passed duration, set end time
    if (this.app.bookingState.durationDays) {
      end.setHours(end.getHours() + this.app.bookingState.durationDays);
    } else {
      end.setHours(end.getHours() + 24);
    }
    this.endDateTime = end.toISOString().slice(0, 16);

    this.calculateTotals();
  }

  onDateChange() {
    this.calculateTotals();
  }

  onPlacementToggle() {
    this.calculateTotals();
  }

  calculateTotals() {
    const start = new Date(this.startDateTime).getTime();
    const end = new Date(this.endDateTime).getTime();
    
    let hours = 0;
    if (end > start) {
      hours = Math.ceil((end - start) / (1000 * 60 * 60));
    }
    this.durationHours = hours;

    let hourlyRate = 0;
    this.availablePlacements.forEach(p => {
      if (p.selected) hourlyRate += p.pricePerHour;
    });

    this.totalPrice = this.durationHours * hourlyRate;
  }

  getSelectedPlacementNames() {
    return this.availablePlacements.filter(p => p.selected).map(p => p.name).join(', ') || 'None';
  }

  goBack() {
    this.app.currentPage.set('advertise');
  }

  viewTerms(event: Event) {
    event.preventDefault();
    this.app.currentPage.set('ad-terms');
  }

  viewProhibited(event: Event) {
    event.preventDefault();
    this.app.currentPage.set('ad-prohibited');
  }

  submitBooking(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');

    const selectedIds = this.availablePlacements.filter(p => p.selected).map(p => p.id);

    if (!this.name || !this.email || !this.brandName || !this.startDateTime || !this.endDateTime || !this.adLink || !this.adDescription) {
      this.errorMessage.set('Please fill out all required fields, including Ad Link and Description.');
      return;
    }

    if (selectedIds.length === 0) {
      this.errorMessage.set('Please select at least one ad placement.');
      return;
    }

    if (this.durationHours <= 0) {
      this.errorMessage.set('End date/time must be after start date/time.');
      return;
    }

    if (this.durationHours > 672) {
      this.errorMessage.set('Campaign duration cannot exceed 28 days (672 hours).');
      return;
    }

    if (!this.agreedTos) {
      this.errorMessage.set('You must agree to the Terms of Service and Refund Policy.');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      name: this.name,
      email: this.email,
      brand_name: this.brandName,
      placement_id: selectedIds,
      duration_hours: this.durationHours,
      start_date_time: this.startDateTime.replace('T', ' ') + ':00',
      end_date_time: new Date(this.endDateTime).toISOString().slice(0, 19).replace('T', ' '),
      target_audience: this.targetAudience,
      ad_link: this.adLink,
      ad_description: this.adDescription,
      total_price: this.totalPrice,
      agreed_tos: this.agreedTos
    };

    const submitUrl = window.location.origin.includes('localhost') ? 'http://localhost/manageads/submit_booking.php' : '/manageads/submit_booking.php';
    this.http.post<any>(submitUrl, payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.successMessage.set('Booking request submitted successfully! Our team will contact you shortly.');
        } else {
          this.errorMessage.set(res.message || 'An error occurred.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Network error. Please try again.');
      }
    });
  }
}
