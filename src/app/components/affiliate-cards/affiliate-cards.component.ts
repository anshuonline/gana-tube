import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideX } from '@lucide/angular';

interface AffiliateCardProduct {
  id: string;
  name: string;
  imageUrl: string;
  amazonUrl: string;
  priceLabel: string;
}

// Amazon affiliate offers shown beside the artwork in the desktop full-screen
// player (only in the empty side space). Dismissals persist via localStorage.
const AFFILIATE_CARDS: AffiliateCardProduct[] = [
  {
    id: 'realme-t310',
    name: 'realme Buds T310 TWS Earbuds',
    imageUrl: 'https://m.media-amazon.com/images/I/41XzpmsbuOL.jpg',
    amazonUrl: 'https://www.amazon.in/realme-Wireless-Earbuds-Spatial-Charging/dp/B0DBGP48NW?_encoding=UTF8&pd_rd_w=GcMVY&content-id=amzn1.sym.608f7859-2f04-48fd-b75f-b5a0022b3499&pf_rd_p=608f7859-2f04-48fd-b75f-b5a0022b3499&pf_rd_r=GF1CMPGYQ1YT0BC4FANH&pd_rd_wg=y6fT3&pd_rd_r=edc3d09c-002a-44b0-9297-1388613e8d98&th=1&linkCode=ll2&tag=ganatubexfree-21&linkId=b642e1585f4a90985e7ae9208779fe9d&ref_=as_li_ss_tl',
    priceLabel: '₹2,199'
  },
  {
    id: 'jbl-sb590',
    name: 'JBL Cinema SB590 Dolby Soundbar 3.1',
    imageUrl: 'https://m.media-amazon.com/images/I/31G0MF6hdxL._SL500_.jpg',
    amazonUrl: 'https://www.amazon.in/JBL-Soundbar-Subwoofer-Bluetooth-Connectivity/dp/B0D45YS7WK?crid=2QYO260Y9XBQE&dib=eyJ2IjoiMSJ9.WcPy42O5tqrHkerc236ANUpymeVqFT6b3SstTWSHiZ0hJZlzdwH1FH0twadK6KePZNgqh-MPhbYInt0m3UpTBQ_Qlq5IIy8KPMxnrZ_2_dLM_8oRtt0WEinEaaMEOefGv5FGKSx28sQj7JopR6taAm5uzDviBU4Akk3kbl7mEalfVaHzjhCMZ-ZqI0PYrnYngpV2R81M48okmOq_Pj-SFTkwD7EmMilu5_PjtjJYGAo.FdFIDx3Xh8b7IpFpUpFsOdgNxLonlqoOlnLvkCfSNbs&dib_tag=se&keywords=home%2Btheatre%2B5.1%2Bdolby%2Batmos&qid=1792085050&sprefix=home%2Bthe%2Caps%2C320&sr=8-1-spons&aref=BeOu9WuKx0&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&th=1&linkCode=ll2&tag=ganatubexfree-21&linkId=286bdf69071157276255aa4fade6d0b3&ref_=as_li_ss_tl',
    priceLabel: '₹19,999'
  },
  {
    id: 'blaupunkt-sbw600',
    name: 'Blaupunkt SBW600 Dolby Atmos Theatre',
    imageUrl: 'https://m.media-amazon.com/images/I/716elCkIMSL._SL500_.jpg',
    amazonUrl: 'https://www.amazon.in/dp/B0FT8L2D2S?pd_rd_i=B0FT8L2D2S&pd_rd_w=vi4QH&content-id=amzn1.sym.cebd979a-4e06-4bc9-ba7d-b9887a34ed18&pf_rd_p=cebd979a-4e06-4bc9-ba7d-b9887a34ed18&pf_rd_r=2XQ0PAQNVX3KQJS1ZZ6R&pd_rd_wg=Aa4BI&pd_rd_r=28f8f28e-c3d3-4658-af80-c0fff68b8f91&aref=CSXOgWadig&sp_csd=d2lkZ2V0TmFtZT1zcF9kZXRhaWxfdGhlbWF0aWM&th=1&linkCode=ll2&tag=ganatubexfree-21&linkId=94f81da3b32c584bc5a3d8a3e536604f&ref_=as_li_ss_tl',
    priceLabel: '₹39,990'
  },
  {
    id: 'boat-rockerz-480',
    name: 'boAt Rockerz 480 Bluetooth Headphones',
    imageUrl: 'https://m.media-amazon.com/images/I/61cIHzCDl6L._SL500_.jpg',
    amazonUrl: 'https://www.amazon.in/boAt-Rockerz-480-Bluetooth-Headphones/dp/B0DGTTKCJX?crid=4B5W2AUNCLT6&dib=eyJ2IjoiMSJ9.YoUV82nii0DWVbUDGfRKAhAUI-mErURj1H1N1isAAsS2s-La96SOrrdoD7B5dF9wCYmYLfLBJyT_UaAlh-CwgK7QdptLFGzcAaGmQQSd693cHRsOQ62Q0DcIp8VVs-0e3qixkH6Dun9LCGaqNtiNsCc6xQJWlnx7xd5LhSxq7EydaNIEmgZrfsPuMGKfKBWBChLazyRJaZIQPR8EYa273D32Um76PFhWAFEt7i9RmoiHs6yxVQCzDfmYA6MKgsUL_LowoHqlyinRSChPYGWeWVFXd6Ur2tvXiV9yXp21NIs.rUrUeVTvFgdCiGf2pvzBHxZJ7YZhUIRkMBafVyBIyO4&dib_tag=se&keywords=headset&qid=1792085120&s=electronics&sprefix=headset%2Celectronics%2C312&sr=1-2-spons&aref=mqO05lUEEj&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&th=1&linkCode=ll2&tag=ganatubexfree-21&linkId=bb4d669af16da16457d6c63f093e46fc&ref_=as_li_ss_tl',
    priceLabel: '₹1,399'
  }
];

/**
 * Spotify-style Amazon offer cards for the empty side space of the
 * desktop full-screen player. Each card can be dismissed with its
 * close button (session-only — cards return on reload).
 */
@Component({
  selector: 'app-affiliate-cards',
  standalone: true,
  imports: [CommonModule, LucideX],
  templateUrl: './affiliate-cards.component.html',
  styleUrls: ['./affiliate-cards.component.scss']
})
export class AffiliateCardsComponent {
  readonly products = AFFILIATE_CARDS;
  private dismissed = new Set<string>();

  get visibleProducts(): AffiliateCardProduct[] {
    return this.products.filter(p => !this.dismissed.has(p.id));
  }

  dismiss(event: Event, id: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.dismissed.add(id);
  }

  trackById(_: number, p: AffiliateCardProduct): string {
    return p.id;
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  hideThumb(event: Event): void {
    (event.target as HTMLElement).style.display = 'none';
  }
}
