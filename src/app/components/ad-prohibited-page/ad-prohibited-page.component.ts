import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../app';
import { LucideBan } from '@lucide/angular';

@Component({
  selector: 'app-ad-prohibited-page',
  standalone: true,
  imports: [CommonModule, LucideBan],
  templateUrl: './ad-prohibited-page.component.html',
  styleUrls: ['./ad-prohibited-page.component.scss']
})
export class AdProhibitedPageComponent {

  constructor(private app: App) {}

  goBack() {
    this.app.currentPage.set('ad-booking');
  }

}
