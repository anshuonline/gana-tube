import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LucideX } from '@lucide/angular';

export interface PromoPopup {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl: string;
  frequencyHours: number;
  isActive: boolean;
  customCode?: string;
}

@Component({
  selector: 'app-promo-popup-modal',
  standalone: true,
  imports: [CommonModule, LucideX],
  templateUrl: './promo-popup-modal.component.html',
  styleUrls: ['./promo-popup-modal.component.scss']
})
export class PromoPopupModalComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  popup: PromoPopup | null = null;
  visible = false;

  // Fallback popup (used until the admin configures popups in ManageGT)
  private defaultPopup: PromoPopup = {
    id: 'default_rooms_promo',
    name: 'Rooms Promo',
    imageUrl: 'https://i.ibb.co/tTfJR3Pw/d8ec335e-5014-44ce-9386-e853a6208041.png',
    linkUrl: '/rooms',
    frequencyHours: 5,
    isActive: true
  };

  private apiUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost')
    ? 'http://localhost/manageads/managegt-api.php'
    : 'https://manageads.ganatube.in/managegt-api.php';

  ngOnInit() {
    this.loadPopup();
  }

  private async loadPopup() {
    let popups: PromoPopup[] = [];

    try {
      const cacheBuster = Date.now();
      const data: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}?action=get_popups&t=${cacheBuster}`)
      );
      const list = (data && (data.popups || data)) || [];
      if (Array.isArray(list)) {
        popups = list;
      }
    } catch (e) {
      // API not available — fall through to default popup
    }

    const activePopups = popups.filter(p => p && p.isActive && (p.imageUrl || p.customCode));
    if (activePopups.length === 0) {
      activePopups.push(this.defaultPopup);
    }

    // Rotate through active popups — one per frequency window
    const rotationIndex = parseInt(localStorage.getItem('gt_promo_popup_index') || '0', 10) || 0;
    const popup = activePopups[rotationIndex % activePopups.length];

    // Show only if the popup's frequency window has passed
    const lastShown = parseInt(localStorage.getItem('gt_promo_popup_shown') || '0', 10) || 0;
    const frequencyMs = (popup.frequencyHours > 0 ? popup.frequencyHours : 5) * 60 * 60 * 1000;
    if (lastShown && Date.now() - lastShown < frequencyMs) {
      return; // Not due yet
    }

    this.popup = popup;
    localStorage.setItem('gt_promo_popup_shown', Date.now().toString());
    localStorage.setItem('gt_promo_popup_index', ((rotationIndex + 1) % Math.max(activePopups.length, 1)).toString());

    // Small delay so the popup isn't jarring on load
    setTimeout(() => {
      this.visible = true;
      this.cdr.detectChanges();
    }, 2500);
  }

  openLink() {
    if (!this.popup || !this.popup.linkUrl) return;
    const url = this.popup.linkUrl;
    if (url.startsWith('/')) {
      this.router.navigate([url]);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    this.dismiss();
  }

  dismiss() {
    this.visible = false;
    this.cdr.detectChanges();
  }
}
