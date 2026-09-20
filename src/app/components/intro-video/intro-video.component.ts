import { Component, ElementRef, AfterViewInit, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-intro-video',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro-video.component.html',
  styleUrl: './intro-video.component.scss'
})
export class IntroVideoComponent implements OnInit, AfterViewInit {
  showOverlay = signal(false);
  fadingOut = signal(false);

  private readonly VIDEO_SRC = '/videos/47erhjfdtop5lkds687231hji.mp4';

  @ViewChild('introVideo', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;

  ngOnInit(): void {
    this.showOverlay.set(true);
  }

  ngAfterViewInit(): void {
    const video = this.videoRef?.nativeElement;
    if (video) {
      video.play().catch(() => {});
    }
  }

  get videoSrc(): string {
    return this.VIDEO_SRC;
  }

  onVideoEnded(): void {
    this.dismiss();
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
    }, 500);
  }
}
