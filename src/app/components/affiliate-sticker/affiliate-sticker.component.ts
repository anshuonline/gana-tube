import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideExternalLink } from '@lucide/angular';

interface AffiliateProduct {
  name: string;
  imageUrl: string;
  amazonUrl: string;
  priceLabel?: string;
}

// Amazon affiliate products (rotates when 2+ are listed)
const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  {
    name: 'ZEBRONICS Astra 35 Speaker',
    imageUrl: 'https://m.media-amazon.com/images/I/319RaAZHSYL._SY300_SX300_QL70_ML2_.jpg',
    amazonUrl: 'https://www.amazon.in/dp/B0DJ3FFC8R?linkCode=ll2&tag=ganatubexfree-21&linkId=4e2c7d65e0477a3caa89f1f736b0738d&ref_=as_li_ss_tl',
    priceLabel: '₹699'
  }
];

/**
 * YouTube-Shorts-style Amazon product sticker — same as the FreeSong.in
 * player sticker. Rotates through the product list with a soft crossfade.
 */
@Component({
  selector: 'app-affiliate-sticker',
  standalone: true,
  imports: [CommonModule, LucideExternalLink],
  templateUrl: './affiliate-sticker.component.html',
  styleUrls: ['./affiliate-sticker.component.scss']
})
export class AffiliateStickerComponent implements OnInit, OnDestroy {
  @Input() position: 'bottom-left' | 'bottom-right' | 'inline' = 'bottom-left';

  readonly products = AFFILIATE_PRODUCTS.filter(p => p.amazonUrl);
  index = 0;
  fading = false;
  private rotateTimer: any = null;

  get product(): AffiliateProduct | null {
    return this.products.length ? this.products[this.index % this.products.length] : null;
  }

  ngOnInit(): void {
    if (this.products.length < 2) return;
    // Rotate only when there is something to rotate and the tab is visible
    this.rotateTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      this.fading = true;
      setTimeout(() => {
        this.index = (this.index + 1) % this.products.length;
        this.fading = false;
      }, 320);
    }, 18000);
  }

  ngOnDestroy(): void {
    if (this.rotateTimer) {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }
  }

  // Keep player cover double-tap / right-click handlers untouched
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  hideThumb(event: Event): void {
    (event.target as HTMLElement).style.display = 'none';
  }
}
