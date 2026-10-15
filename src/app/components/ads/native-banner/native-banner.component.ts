import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NATIVE_BANNER } from '../ads.config';

@Component({
  selector: 'app-gt-native-banner',
  standalone: true,
  imports: [CommonModule],
  template: `<div #host class="gt-native-host"><div [attr.id]="containerId"></div></div>`,
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

  @ViewChild('host', { static: false }) hostRef?: ElementRef<HTMLDivElement>;

  private scriptEl: HTMLScriptElement | null = null;

  ngAfterViewInit(): void {
    const host = this.hostRef?.nativeElement;
    if (!host) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = NATIVE_BANNER.scriptUrl;
    script.setAttribute('data-cfasync', 'false');
    this.scriptEl = script;
    host.appendChild(script);
  }

  ngOnDestroy(): void {
    if (this.scriptEl) {
      this.scriptEl.parentNode?.removeChild(this.scriptEl);
      this.scriptEl = null;
    }
    const stray = document.getElementById(this.containerId);
    if (stray && stray.closest('.gt-native-host') === null) {
      stray.parentNode?.removeChild(stray);
    }
  }
}
