import { Injectable, signal, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any = null;
  public canInstall = signal<boolean>(false);
  public isInstalledPWA = signal<boolean>(false);

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      // Check if already running as installed PWA (standalone or fullscreen)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.matchMedia('(display-mode: fullscreen)').matches
        || (window.navigator as any).standalone === true;
      this.isInstalledPWA.set(isStandalone);
      this.setupAutoFullscreen();

      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        this.deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        this.canInstall.set(true);
      });

      window.addEventListener('appinstalled', () => {
        // Clear the deferredPrompt so it can be garbage collected
        this.deferredPrompt = null;
        this.canInstall.set(false);
        this.isInstalledPWA.set(true);
        console.log('PWA was installed');
      });
    }
  }

  private setupAutoFullscreen() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const requestFs = () => {
      if (!this.isInstalledPWA()) return;
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    // Immediate attempt if browser allows
    requestFs();

    // Interaction fallback for browsers enforcing user gesture
    let triggered = false;
    const onFirstUserAction = () => {
      if (triggered) return;
      triggered = true;
      requestFs();
    };

    window.addEventListener('click', onFirstUserAction, { once: true, passive: true });
    window.addEventListener('pointerdown', onFirstUserAction, { once: true, passive: true });
    window.addEventListener('keydown', onFirstUserAction, { once: true, passive: true });
  }

  private toastService = inject(ToastService);

  public async installApp() {
    if (this.deferredPrompt) {
      // Show the install prompt
      this.deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, throw it away
      this.deferredPrompt = null;
      this.canInstall.set(false);
    } else {
      this.toastService.show('To install: open browser menu → "Add to Home Screen" or "Install App".', 'info');
    }
  }
}
