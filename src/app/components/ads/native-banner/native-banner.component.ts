import {
  Component,
  ElementRef,
  ViewChild,
  Input,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NATIVE_BANNER, AdsterraTag } from '../ads.config';
import { AdsterraBannerComponent } from '../adsterra-banner/adsterra-banner.component';

const NATIVE_FILL_TIMEOUT_MS = 6000;
const NATIVE_POLL_INTERVAL_MS = 500;

@Component({
  selector: 'app-gt-native-banner',
  standalone: true,
  imports: [CommonModule, AdsterraBannerComponent],
  template: `
    <div #host class="gt-native-host" [style.display]="fallbackActive() ? 'none' : 'block'">
      <div [attr.id]="containerId"></div>
    </div>
    @if (fallbackActive() && fallbackTag) {
      <app-adsterra-banner [tag]="fallbackTag"></app-adsterra-banner>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        overflow: hidden;
      }
      .gt-native-host {
        width: 100%;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NativeBannerComponent implements AfterViewInit, OnDestroy {
  readonly containerId = NATIVE_BANNER.containerId;

  /** Adsterra tag rendered if the native script fails to fill the slot */
  @Input() fallbackTag?: AdsterraTag;

  readonly fallbackActive = signal(false);

  @ViewChild('host', { static: false }) hostRef?: ElementRef<HTMLDivElement>;

  private scriptEl: HTMLScriptElement | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private failTimer: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit(): void {
    const host = this.hostRef?.nativeElement;
    if (!host) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = NATIVE_BANNER.scriptUrl;
    script.setAttribute('data-cfasync', 'false');
    script.addEventListener('error', () => this.activateFallback());
    this.scriptEl = script;
    host.appendChild(script);

    // Poll for the native creative; if it never lands, swap in the fallback
    this.pollTimer = setInterval(() => {
      if (this.hasNativeCreative(host)) this.stopWatchers();
    }, NATIVE_POLL_INTERVAL_MS);
    this.failTimer = setTimeout(() => {
      if (!this.hasNativeCreative(host)) this.activateFallback();
    }, NATIVE_FILL_TIMEOUT_MS);
  }

  private hasNativeCreative(host: HTMLElement): boolean {
    if (host.querySelector('iframe, ins, embed')) return true;
    const container = document.getElementById(this.containerId);
    return !!container && container.children.length > 0;
  }

  private activateFallback(): void {
    if (this.fallbackActive()) return;
    if (!this.fallbackTag) {
      this.stopWatchers();
      return;
    }
    this.stopWatchers();
    this.removeScript();
    this.fallbackActive.set(true);
  }

  private stopWatchers(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.failTimer) {
      clearTimeout(this.failTimer);
      this.failTimer = null;
    }
  }

  private removeScript(): void {
    if (this.scriptEl) {
      this.scriptEl.parentNode?.removeChild(this.scriptEl);
      this.scriptEl = null;
    }
  }

  ngOnDestroy(): void {
    this.stopWatchers();
    this.removeScript();
    const stray = document.getElementById(this.containerId);
    if (stray && stray.closest('.gt-native-host') === null) {
      stray.parentNode?.removeChild(stray);
    }
  }
}
