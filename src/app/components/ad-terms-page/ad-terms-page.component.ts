import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../app';

@Component({
  selector: 'app-ad-terms-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ad-terms-page.component.html',
  styleUrls: ['./ad-terms-page.component.scss']
})
export class AdTermsPageComponent {
  constructor(private app: App) {}

  goBack() {
    this.app.currentPage.set('advertise');
  }
}
