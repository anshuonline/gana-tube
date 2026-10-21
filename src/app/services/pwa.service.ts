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

      // Check if early capture in index.html already caught beforeinstallprompt
      const earlyPrompt = (window as any).__deferredInstallPrompt;
      if (earlyPrompt) {
        this.deferredPrompt = earlyPrompt;
        this.canInstall.set(true);
      }

      // Listen for custom event fired when early capture catches the prompt
      window.addEventListener('gt-install-available', () => {
        const p = (window as any).__deferredInstallPrompt;
        if (p) {
          this.deferredPrompt = p;
          this.canInstall.set(true);
        }
      });

      // Also listen on window directly for standard lifecycle
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent default mini-infobar on mobile so custom UI has control
        e.preventDefault();
        (window as any).__deferredInstallPrompt = e;
        this.deferredPrompt = e;
        this.canInstall.set(true);
      });

      window.addEventListener('gt-app-installed', () => {
        this.clearInstalled();
      });

      window.addEventListener('appinstalled', () => {
        this.clearInstalled();
      });
    }
  }

  private clearInstalled() {
    this.deferredPrompt = null;
    if (typeof window !== 'undefined') {
      (window as any).__deferredInstallPrompt = null;
    }
    this.canInstall.set(false);
    this.isInstalledPWA.set(true);
    console.log('PWA was successfully installed');
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
    const prompt = this.deferredPrompt || (typeof window !== 'undefined' ? (window as any).__deferredInstallPrompt : null);
    if (prompt) {
      try {
        // Show native browser install prompt dialog
        prompt.prompt();
        // Wait for the user to respond to the prompt
        const choice = await prompt.userChoice;
        console.log(`User response to install prompt: ${choice?.outcome}`);
        if (choice?.outcome === 'accepted') {
          this.clearInstalled();
        }
      } catch (err) {
        console.error('Error invoking native install prompt:', err);
        this.toastService.show('Click the Install icon (⤓) in the address bar or browser menu → "Install GanaTube".', 'info');
      }
      this.deferredPrompt = null;
      if (typeof window !== 'undefined') {
        (window as any).__deferredInstallPrompt = null;
      }
      this.canInstall.set(false);
    } else {
      this.toastService.show('To install: click the Install icon (⤓) in your browser search/address bar or open menu (⋮) → "Install GanaTube".', 'info');
    }
  }
}
