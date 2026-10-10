import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideMoonStar } from '@lucide/angular';

// One-time "Background Play is here!" announcement popup.
// Shown once per device (localStorage flag) a few seconds after load so it
// doesn't collide with the intro animation.
@Component({
  selector: 'app-background-play-popup',
  standalone: true,
  imports: [CommonModule, LucideMoonStar],
  templateUrl: './background-play-popup.component.html',
  styleUrls: ['./background-play-popup.component.scss']
})
export class BackgroundPlayPopupComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  visible = signal(false);

  private static readonly STORAGE_KEY = 'gt_bgplay_announcement_shown';

  ngOnInit(): void {
    if (typeof localStorage === 'undefined') return;

    // Show only once per device
    if (localStorage.getItem(BackgroundPlayPopupComponent.STORAGE_KEY) === '1') {
      return;
    }

    // Small delay so it doesn't collide with the intro animation / promo popup
    setTimeout(() => {
      this.visible.set(true);
      this.cdr.detectChanges();
    }, 3500);
  }

  onGotIt(): void {
    try {
      localStorage.setItem(BackgroundPlayPopupComponent.STORAGE_KEY, '1');
    } catch (e) {}
    this.visible.set(false);
    this.cdr.detectChanges();
  }
}
