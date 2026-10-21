import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JingleService {
  private readonly JINGLE_URL = encodeURI('/assets/jingle for Ganatube.in/promotionalaudio.mp3');
  private readonly STORAGE_KEY = 'gt_jingle_history';
  private readonly MAX_PLAYS_24H = 4;
  private readonly MIN_COOLDOWN_MS = 3.5 * 60 * 60 * 1000; // Minimum 3.5 hours between jingles

  public isJinglePlaying = signal<boolean>(false);

  private currentAudio: HTMLAudioElement | null = null;
  private currentResolver: (() => void) | null = null;
  private safetyTimeout: any = null;

  /**
   * Retrieves clean timestamps of jingles played within the last 24 hours.
   */
  private getCleanHistory(now: number): number[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const timestamps: number[] = JSON.parse(raw);
      if (!Array.isArray(timestamps)) return [];
      // Filter out timestamps older than 24h
      const recent = timestamps.filter(ts => typeof ts === 'number' && (now - ts) < 24 * 60 * 60 * 1000);
      if (recent.length !== timestamps.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recent));
      }
      return recent;
    } catch {
      return [];
    }
  }

  /**
   * Determines whether the promotional jingle should play before starting/changing track.
   * Rules:
   * 1. Max 4 times in any rolling 24-hour period.
   * 2. Minimum cooldown of 3.5 hours since the last jingle.
   * 3. Random distribution (probability-based).
   */
  public shouldTriggerJingle(): boolean {
    if (typeof window === 'undefined') return false;

    const now = Date.now();
    const history = this.getCleanHistory(now);

    // Hard ceiling: Maximum 4 times in rolling 24 hours
    if (history.length >= this.MAX_PLAYS_24H) {
      return false;
    }

    const lastPlay = history.length > 0 ? Math.max(...history) : 0;
    const timeSinceLastPlay = now - lastPlay;

    // Must satisfy minimum cooldown (3.5 hours)
    if (lastPlay > 0 && timeSinceLastPlay < this.MIN_COOLDOWN_MS) {
      return false;
    }

    // Random trigger:
    // If more than 6 hours have passed (or first play in 24h), 50% chance
    // If between 3.5h and 6h, 30% chance
    const chance = timeSinceLastPlay > 6 * 60 * 60 * 1000 ? 0.5 : 0.3;
    return Math.random() < chance;
  }

  /**
   * Plays the promotional jingle.
   * Returns a promise that resolves when the jingle completes, is interrupted,
   * encounters an error, or hits safety timeout.
   */
  public playJingle(volume: number = 80, isMuted: boolean = false): Promise<void> {
    return new Promise<void>((resolve) => {
      this.stopJingle(); // Cleanup any previous playback

      this.currentResolver = resolve;
      this.isJinglePlaying.set(true);

      const finish = () => {
        if (this.safetyTimeout) {
          clearTimeout(this.safetyTimeout);
          this.safetyTimeout = null;
        }
        if (this.currentAudio) {
          try {
            this.currentAudio.pause();
            this.currentAudio.src = '';
          } catch (_) {}
          this.currentAudio = null;
        }
        this.isJinglePlaying.set(false);
        const r = this.currentResolver;
        this.currentResolver = null;
        if (r) r();
      };

      try {
        const audio = new Audio(this.JINGLE_URL);
        audio.preload = 'auto';
        audio.volume = Math.max(0, Math.min(1, volume / 100));
        audio.muted = isMuted;
        this.currentAudio = audio;

        audio.onended = () => {
          this.recordPlay(Date.now());
          finish();
        };

        audio.onerror = (e) => {
          console.warn('Jingle playback error, skipping to song:', e);
          finish();
        };

        // Safety timeout: max 12 seconds in case of slow buffer or stall
        this.safetyTimeout = setTimeout(() => {
          console.warn('Jingle playback timeout reached, proceeding to song');
          finish();
        }, 12000);

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Jingle autoplay restricted or failed:', err);
            finish();
          });
        }
      } catch (err) {
        console.warn('Failed to initialize jingle audio:', err);
        finish();
      }
    });
  }

  /**
   * Immediately stops any currently active jingle.
   */
  public stopJingle(): void {
    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch (_) {}
      this.currentAudio = null;
    }
    this.isJinglePlaying.set(false);
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

  /**
   * Records a timestamp of a completed jingle in localStorage.
   */
  private recordPlay(timestamp: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const history = this.getCleanHistory(timestamp);
      history.push(timestamp);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (_) {}
  }
}
