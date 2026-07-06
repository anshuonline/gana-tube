import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LucideBarChart2, LucideUsers, LucideZap, LucideMail, LucideMegaphone, LucideCheckCircle, LucideSettings } from '@lucide/angular';
import { App } from '../../app';

@Component({
  selector: 'app-advertise-page',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule,
    LucideBarChart2, 
    LucideUsers, 
    LucideZap, 
    LucideMail, 
    LucideMegaphone,
    LucideCheckCircle,
    LucideSettings
  ],
  templateUrl: './advertise-page.component.html',
  styleUrls: ['./advertise-page.component.scss']
})
export class AdvertisePageComponent implements OnInit {
  
  private http = inject(HttpClient);

  // Slider values (hours)
  bottomAdHours = signal<number>(24);
  homeAdHours = signal<number>(24);
  playlistAdHours = signal<number>(24);

  // Prices per hour (default/fallback)
  bottomAdPrice = signal<number>(80);
  homeAdPrice = signal<number>(120);
  playlistAdPrice = signal<number>(100);

  // Loading state
  isLoadingPrices = signal<boolean>(true);

  constructor(public app: App) {}

  ngOnInit() {
    this.http.get<any>('http://localhost/manageads/api.php?action=prices').subscribe({
      next: (data) => {
        if (data['bottom_player_banner']) this.bottomAdPrice.set(data['bottom_player_banner']);
        if (data['home_feed_banner']) this.homeAdPrice.set(data['home_feed_banner']);
        if (data['playlist_in_feed_banner']) this.playlistAdPrice.set(data['playlist_in_feed_banner']);
        this.isLoadingPrices.set(false);
      },
      error: () => {
        this.isLoadingPrices.set(false); // Fallback to defaults
      }
    });
  }

  updateHours(ad: 'bottom' | 'home' | 'playlist', event: any) {
    const val = parseInt(event.target.value, 10);
    if (ad === 'bottom') this.bottomAdHours.set(val);
    if (ad === 'home') this.homeAdHours.set(val);
    if (ad === 'playlist') this.playlistAdHours.set(val);
  }

  bookSpot(placementId: string, placementName: string, durationHours: number, pricePerHour: number) {
    this.app.bookingState = {
      placementId: placementId,
      placementName: placementName,
      durationDays: durationHours, // using same field name to avoid breaking app.ts for now, or we can just update app.ts
      totalPrice: durationHours * pricePerHour
    };
    this.app.currentPage.set('ad-booking');
  }

  contactUs() {
    window.location.href = 'mailto:hello@ganatube.in?subject=Advertising Inquiry';
  }

  onImgError(event: any) {
    // Hide broken image icon if image not yet uploaded
    event.target.style.display = 'none';
  }

  goHome() {
    this.app.currentPage.set('home');
  }

}
