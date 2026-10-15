import {
  Component,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { SOCIAL_BAR_SCRIPT } from '../ads.config';

@Component({
  selector: 'app-gt-social-bar',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialBarComponent implements OnDestroy {
  private scriptEl: HTMLScriptElement | null = null;

  constructor() {
    if (typeof document === 'undefined') return;

    const script = document.createElement('script');
    script.src = SOCIAL_BAR_SCRIPT;
    script.async = true;
    this.scriptEl = script;
    document.body.appendChild(script);
  }

  ngOnDestroy(): void {
    if (this.scriptEl) {
      this.scriptEl.parentNode?.removeChild(this.scriptEl);
      this.scriptEl = null;
    }

    // Remove widgets the social-bar script created on document.body
    if (typeof document !== 'undefined') {
      const orphans: Element[] = [];
      document.querySelectorAll('iframe').forEach((frame) => {
        if (frame.src && (frame.src.includes('profitableratecpmnetwork') || frame.src.includes('highrevenueformat'))) {
          const style = window.getComputedStyle(frame);
          if (style.position === 'fixed' && !frame.closest('app-adsterra-banner')) {
            orphans.push(frame);
          }
        }
      });
      orphans.forEach((el) => el.parentNode?.removeChild(el));
    }
  }
}
