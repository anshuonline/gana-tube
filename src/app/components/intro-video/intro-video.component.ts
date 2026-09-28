import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-intro-video',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro-video.component.html',
  styleUrl: './intro-video.component.scss'
})
export class IntroVideoComponent implements OnInit {
  showOverlay = signal(false);
  fadingOut = signal(false);

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('disable_intro_animation') === 'true') {
      this.showOverlay.set(false);
      return;
    }
    this.showOverlay.set(true);
    setTimeout(() => {
      this.dismiss();
    }, 2500);
  }

  skipIntro(): void {
    this.dismiss();
  }

  private dismiss(): void {
    if (this.fadingOut()) return;
    this.fadingOut.set(true);
    setTimeout(() => {
      this.showOverlay.set(false);
      this.fadingOut.set(false);
    }, 800);
  }
}
