import { Injectable, signal } from '@angular/core';

export interface JingleTrackInfo {
  title?: string;
  channelTitle?: string;
  thumbnail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JingleService {
  private readonly JINGLE_URL = encodeURI('/assets/jingle for Ganatube.in/promotionalaudio.mp3');
  private readonly STORAGE_KEY = 'gt_jingle_history';
  private readonly MAX_PLAYS_24H = 4;
  private readonly MIN_COOLDOWN_MS = 3.5 * 60 * 60 * 1000; // 3.5 hours minimum gap

  // Reactive UI signals for the overlay
  public isJingleActive = signal<boolean>(false);
  public isJinglePlaying = this.isJingleActive;
  public secondsRemaining = signal<number>(10);
  public skipCountdown = signal<number>(5);
  public canSkip = signal<boolean>(false);
  public upcomingTrack = signal<JingleTrackInfo | null>(null);

  private currentAudio: HTMLAudioElement | null = null;
  private currentResolver: (() => void) | null = null;
  private timerInterval: any = null;

  private getCleanHistory(now: number): number[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const timestamps: number[] = JSON.parse(raw);
      if (!Array.isArray(timestamps)) return [];
      const recent = timestamps.filter(ts => typeof ts === 'number' && (now - ts) < 24 * 60 * 60 * 1000);
      if (recent.length !== timestamps.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recent));
      }
      return recent;
    } catch {
      return [];
    }
  }

  public shouldTriggerJingle(): boolean {
    if (typeof window === 'undefined') return false;

    const now = Date.now();
    const history = this.getCleanHistory(now);

    // Strict cap: max 4 times in 24 hours
    if (history.length >= this.MAX_PLAYS_24H) {
      return false;
    }

    const lastPlay = history.length > 0 ? Math.max(...history) : 0;
    const timeSinceLastPlay = now - lastPlay;

    // Minimum cooldown of 3.5 hours between jingles
    if (lastPlay > 0 && timeSinceLastPlay < this.MIN_COOLDOWN_MS) {
      return false;
    }

    // Random trigger probability
    const chance = timeSinceLastPlay > 6 * 60 * 60 * 1000 ? 0.5 : 0.3;
    return Math.random() < chance;
  }

  public recordPlayNow(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const now = Date.now();
      const history = this.getCleanHistory(now);
      history.push(now);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (_) {}
  }

  /**
   * Starts the promotional jingle experience (audio + 10s countdown + 5s skip button).
   */
  public startJingle(track: JingleTrackInfo | null, volume: number = 80, isMuted: boolean = false): Promise<void> {
    return new Promise<void>((resolve) => {
      this.stopJingle();

      // Record immediately so rapid clicks never trigger multiple jingles
      this.recordPlayNow();

      this.currentResolver = resolve;
      this.upcomingTrack.set(track);
      this.secondsRemaining.set(10);
      this.skipCountdown.set(5);
      this.canSkip.set(false);
      this.isJingleActive.set(true);

      const finish = () => {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        if (this.currentAudio) {
          try {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio.src = '';
          } catch (_) {}
          this.currentAudio = null;
        }
        this.isJingleActive.set(false);
        const r = this.currentResolver;
        this.currentResolver = null;
        if (r) r();
      };

      // Start 10-second countdown and 5-second skip countdown
      let remaining = 10;
      let skipLeft = 5;

      this.timerInterval = setInterval(() => {
        remaining--;
        this.secondsRemaining.set(Math.max(0, remaining));

        if (skipLeft > 0) {
          skipLeft--;
          this.skipCountdown.set(skipLeft);
          if (skipLeft === 0) {
            this.canSkip.set(true);
          }
        }

        if (remaining <= 0) {
          finish();
        }
      }, 1000);

      // Play audio
      try {
        const audio = new Audio(this.JINGLE_URL);
        audio.preload = 'auto';
        audio.volume = Math.max(0, Math.min(1, volume / 100));
        audio.muted = isMuted;
        this.currentAudio = audio;

        audio.onended = () => {
          finish();
        };

        audio.onerror = (e) => {
          console.warn('Jingle audio error, continuing countdown/skip:', e);
        };

        const p = audio.play();
        if (p !== undefined) {
          p.catch((err) => {
            console.warn('Jingle autoplay restricted:', err);
          });
        }
      } catch (e) {
        console.warn('Failed to start jingle audio:', e);
      }
    });
  }

  /**
   * Called when user clicks "Skip" button (enabled after 5s).
   */
  public skipJingle(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isJingleActive.set(false);
    if (this.currentResolver) {
      const r = this.currentResolver;
      this.currentResolver = null;
      r();
    }
  }

  /**
   * Completely aborts any active jingle (e.g. user selects a different track).
   */
  public stopJingle(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch (_) {}
      this.currentAudio = null;
    }
    this.isJingleActive.set(false);
    if (this.currentResolver) {
      const r = this.currentResolver;
      this.currentResolver = null;
      r();
    }
  }

  public pauseJingle(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      try { this.currentAudio.pause(); } catch (_) {}
    }
  }

  public resumeJingle(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      try { this.currentAudio.play().catch(() => {}); } catch (_) {}
    }
  }

  public setVolume(volume: number, isMuted: boolean = false): void {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volume / 100));
      this.currentAudio.muted = isMuted;
    }
  }
}
