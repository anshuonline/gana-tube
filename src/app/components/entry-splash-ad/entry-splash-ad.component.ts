import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  signal,
  computed,
  inject,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideX } from '@lucide/angular';
import { ENTRY_SPLASH_CONFIG } from './entry-splash-ad.config';

@Component({
  selector: 'app-entry-splash-ad',
  standalone: true,
  imports: [CommonModule, LucideX],
  templateUrl: './entry-splash-ad.component.html',
  styleUrls: ['./entry-splash-ad.component.scss']
})
export class EntrySplashAdComponent implements OnInit, AfterViewInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('adHost', { static: false }) adHostRef!: ElementRef<HTMLDivElement>;

  readonly config = ENTRY_SPLASH_CONFIG;

  isVisible = signal<boolean>(false);
  countdown = signal<number>(ENTRY_SPLASH_CONFIG.countdownSeconds);
  adLoaded = signal<boolean>(false);

  // Can close only when countdown reaches 0 AND ad is loaded (or safety timeout fired)
  canClose = computed(() => this.countdown() <= 0 && this.adLoaded());

  hasAdScript = computed(() => !!this.config.adScript && this.config.adScript.trim().length > 0);

  private countdownTimer: any = null;
  private safetyTimer: any = null;
  private pullerInterval: any = null;
  private cleanupScriptFn: (() => void) | null = null;
  private prevBodyOverflow: string = '';

  ngOnInit(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    // Do not show if disabled or if ad script is not configured
    if (!this.config.enabled || !this.hasAdScript()) {
      return;
    }

    if (this.seenRecently()) {
      return;
    }

    // Mark seen immediately so page reload doesn't trigger repeatedly
    this.markSeen();
    this.isVisible.set(true);
    this.lockScroll();

    this.startCountdown();
  }

  ngAfterViewInit(): void {
    if (!this.isVisible()) return;

    if (!this.hasAdScript()) {
      // No ad script configured yet — ready immediately so placeholder behaves smoothly
      this.adLoaded.set(true);
      return;
    }

    this.injectAd();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.canClose()) {
      this.closeModal();
    }
  }

  closeModal(): void {
    if (!this.canClose()) return;

    this.cleanup();
    this.isVisible.set(false);
    this.unlockScroll();
    this.cdr.detectChanges();
  }

  private seenRecently(): boolean {
    try {
      const ts = Number(localStorage.getItem(this.config.storageKey));
      if (!ts) return false;
      const cooldownMs = this.config.cooldownHours * 60 * 60 * 1000;
      return Date.now() - ts < cooldownMs;
    } catch {
      return false;
    }
  }

  private markSeen(): void {
    try {
      localStorage.setItem(this.config.storageKey, String(Date.now()));
    } catch {}
  }

  private startCountdown(): void {
    this.countdown.set(this.config.countdownSeconds);

    this.countdownTimer = setInterval(() => {
      const current = this.countdown();
      if (current > 1) {
        this.countdown.set(current - 1);
        this.cdr.detectChanges();
      } else {
        this.countdown.set(0);
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  private injectAd(): void {
    const host = this.adHostRef?.nativeElement;
    if (!host || !this.config.adScript) return;

    const baseline = new Set(Array.from(document.body.children));
    this.cleanupScriptFn = this.executeAdHtml(host, this.config.adScript);

    // Poll to detect when iframe or creative appears inside the host or body
    let tries = 0;
    this.pullerInterval = setInterval(() => {
      tries += 1;
      if (!this.adHostRef?.nativeElement) {
        clearInterval(this.pullerInterval);
        return;
      }

      const container = this.adHostRef.nativeElement;
      if (container.querySelector('iframe, ins, embed, video, img')) {
        this.adLoaded.set(true);
        clearInterval(this.pullerInterval);
        this.cdr.detectChanges();
        return;
      }

      // Check if creative was inserted directly on document.body by ad network script
      const stray = Array.from(document.body.children).find((el) => {
        if (baseline.has(el) || !(el instanceof HTMLElement)) return false;
        if (el.contains(container)) return false;
        return (
          el.tagName === 'IFRAME' ||
          el.tagName === 'INS' ||
          el.tagName === 'VIDEO' ||
          (el.tagName === 'DIV' && !!el.querySelector('iframe, video, ins'))
        );
      }) as HTMLElement | undefined;

      if (stray) {
        const w = (stray as HTMLElement).offsetWidth || stray.getBoundingClientRect().width || 300;
        const h = (stray as HTMLElement).offsetHeight || stray.getBoundingClientRect().height || 250;
        stray.style.position = 'relative';
        stray.style.top = 'auto';
        stray.style.right = 'auto';
        stray.style.bottom = 'auto';
        stray.style.left = 'auto';
        stray.style.margin = '0';
        stray.style.zIndex = 'auto';
        container.appendChild(stray);
        const scale = Math.min(1, 300 / w, 250 / h);
        if (scale < 1) {
          stray.style.transformOrigin = 'center center';
          stray.style.transform = `scale(${scale})`;
        }
        this.adLoaded.set(true);
        clearInterval(this.pullerInterval);
        this.cdr.detectChanges();
      } else if (tries >= 25) {
        clearInterval(this.pullerInterval);
      }
    }, 400);

    // Safety timeout: user is never stuck if ad blocker is active or no-fill occurs
    this.safetyTimer = setTimeout(() => {
      this.adLoaded.set(true);
      this.cdr.detectChanges();
    }, this.config.safetyTimeoutMs);
  }

  private executeAdHtml(container: HTMLElement, html: string): () => void {
    const addedNodes: Node[] = [];
    try {
      const tpl = document.createElement('div');
      tpl.innerHTML = html;
      const nodes = Array.from(tpl.childNodes);
      nodes.forEach((node) => {
        let executableNode: Node = node;
        if (node.nodeName === 'SCRIPT') {
          const script = document.createElement('script');
          const origScript = node as HTMLScriptElement;
          Array.from(origScript.attributes).forEach((attr) => {
            script.setAttribute(attr.name, attr.value);
          });
          if (origScript.src) {
            script.src = origScript.src;
          } else {
            script.textContent = origScript.textContent;
          }
          if (origScript.getAttribute('async') !== null) {
            script.async = true;
          }
          executableNode = script;
        }
        container.appendChild(executableNode);
        addedNodes.push(executableNode);
      });
    } catch (e) {
      console.warn('[EntrySplashAd] Script injection issue:', e);
    }

    return () => {
      addedNodes.forEach((n) => {
        try {
          n.parentNode?.removeChild(n);
        } catch {}
      });
      if (container) container.innerHTML = '';
    };
  }

  private lockScroll(): void {
    if (typeof document !== 'undefined') {
      this.prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  }

  private unlockScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.prevBodyOverflow || '';
    }
  }

  private cleanup(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.pullerInterval) {
      clearInterval(this.pullerInterval);
      this.pullerInterval = null;
    }
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
    if (this.cleanupScriptFn) {
      this.cleanupScriptFn();
      this.cleanupScriptFn = null;
    }
  }
}
