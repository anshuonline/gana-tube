import { Injectable, signal, inject } from '@angular/core';
import { ToastService } from './toast.service';

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: any;
    chrome?: any;
    PresentationRequest?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CastService {
  private toastService = inject(ToastService);

  public isCastAvailable = signal<boolean>(false);
  public isCasting = signal<boolean>(false);
  public connectedDeviceName = signal<string | null>(null);

  constructor() {
    this.initCast();
  }

  private initCast(): void {
    if (typeof window === 'undefined') return;

    // Check if Cast API is already available (e.g. cached or loaded earlier)
    if (window.cast && window.cast.framework) {
      this.setupCastContext();
      return;
    }

    // Register Google Cast callback
    const prevCallback = window.__onGCastApiAvailable;
    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (typeof prevCallback === 'function') {
        try { prevCallback(isAvailable); } catch (e) {}
      }
      if (isAvailable) {
        this.setupCastContext();
      }
    };
  }

  private setupCastContext(): void {
    try {
      if (!window.cast || !window.cast.framework) return;

      const castContext = window.cast.framework.CastContext.getInstance();
      
      castContext.setOptions({
        receiverApplicationId: window.chrome?.cast?.media?.DEFAULT_MEDIA_RECEIVER_APP_ID || 'CC1AD845',
        autoJoinPolicy: window.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED || 'origin_scoped'
      });

      this.isCastAvailable.set(true);

      // Listen to Cast session state changes
      const eventType = window.cast.framework.CastContextEventType?.SESSION_STATE_CHANGED;
      if (eventType) {
        castContext.addEventListener(eventType, (event: any) => {
          const sessionState = event.sessionState;
          const sessionStateEnum = window.cast.framework.SessionState;

          if (sessionState === sessionStateEnum.SESSION_STARTED || sessionState === sessionStateEnum.SESSION_RESUMED) {
            this.isCasting.set(true);
            const session = castContext.getCurrentSession();
            const device = session?.getCastDevice();
            const name = device?.friendlyName || 'Cast Display';
            this.connectedDeviceName.set(name);
            this.toastService.show(`Connected to ${name}`, 'success');
          } else if (sessionState === sessionStateEnum.SESSION_ENDED) {
            this.isCasting.set(false);
            this.connectedDeviceName.set(null);
            this.toastService.show('Cast disconnected', 'info');
          }
        });
      }
    } catch (e) {
      console.warn('Cast setup note:', e);
    }
  }

  public async requestCastSession(): Promise<void> {
    if (typeof window === 'undefined') return;

    // If already casting, clicking again allows disconnecting
    if (this.isCasting()) {
      this.disconnectCast();
      return;
    }

    // 1. Google Cast Framework (Standard Chrome / Edge Cast Dialog)
    if (window.cast && window.cast.framework) {
      try {
        const castContext = window.cast.framework.CastContext.getInstance();
        await castContext.requestSession();
        return;
      } catch (err: any) {
        // 'cancel' means user closed the dialog without selecting a device - no error toast needed
        if (err === 'cancel' || err?.message === 'cancel') {
          return;
        }
        console.warn('Google Cast requestSession notice:', err);
      }
    }

    // 2. Fallback: Check W3C Remote Playback API on audio elements
    const audioElements = Array.from(document.querySelectorAll('audio, video')) as any[];
    for (const el of audioElements) {
      if (el && el.remote && typeof el.remote.prompt === 'function') {
        try {
          await el.remote.prompt();
          return;
        } catch (e) {}
      }
    }

    // 3. Fallback: Presentation API
    if (typeof window.PresentationRequest === 'function') {
      try {
        const request = new window.PresentationRequest([window.location.href]);
        await request.start();
        return;
      } catch (e) {}
    }

    // 4. Browser guidance if not directly supported
    this.toastService.show('To cast to TV or Speakers, use Google Chrome and ensure your device is on the same Wi-Fi.', 'info');
  }

  public disconnectCast(): void {
    if (typeof window === 'undefined') return;

    try {
      if (window.cast && window.cast.framework) {
        const castContext = window.cast.framework.CastContext.getInstance();
        castContext.endCurrentSession(true);
      }
    } catch (e) {}

    this.isCasting.set(false);
    this.connectedDeviceName.set(null);
  }
}
