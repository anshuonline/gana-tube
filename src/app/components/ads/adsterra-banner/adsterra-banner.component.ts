import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdsterraTag, buildAdsterraSrcdoc } from '../ads.config';

@Component({
  selector: 'app-adsterra-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adsterra-banner.component.html',
  styleUrls: ['./adsterra-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdsterraBannerComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) tag!: AdsterraTag;

  @ViewChild('frameWrap', { static: false }) frameWrapRef?: ElementRef<HTMLDivElement>;

  scale = 1;

  private observer: ResizeObserver | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  get srcdoc(): string {
    return buildAdsterraSrcdoc(this.tag);
  }

  get safeSrcdoc(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.srcdoc);
  }

  ngAfterViewInit(): void {
    if (typeof ResizeObserver === 'undefined') return;

    this.observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const hostWidth = entry.contentRect.width;
      const target = Math.min(1, hostWidth / this.tag.width);
      if (Math.abs(target - this.scale) > 0.01) {
        this.scale = target;
        this.applyScale();
      }
    });

    if (this.frameWrapRef?.nativeElement) {
      this.observer.observe(this.frameWrapRef.nativeElement);
    }
    this.applyScale();
  }

  private applyScale(): void {
    const wrap = this.frameWrapRef?.nativeElement;
    if (!wrap) return;
    const frame = wrap.querySelector('iframe') as HTMLElement | null;
    if (!frame) return;
    frame.style.transformOrigin = 'top center';
    frame.style.transform = this.scale < 1 ? `scale(${this.scale})` : '';
    wrap.style.height = `${Math.round(this.tag.height * this.scale)}px`;
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
