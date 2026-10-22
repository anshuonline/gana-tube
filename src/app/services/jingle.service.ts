import { Injectable, inject, signal } from '@angular/core';
import { AnalyticsService } from './analytics.service';

export interface JingleTrackInfo {
  title?: string;
  channelTitle?: string;
  thumbnail?: string;
  videoId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JingleService {
  private analyticsService = inject(AnalyticsService);
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
    return false; // Jingle disabled
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
    return Promise.resolve();
  }

  /**
   * Called when user clicks "Skip" button (enabled after 5s).
   */
  public skipJingle(): void {
    // Track skip action in Analytics backend
    this.analyticsService.recordJingleEvent('skip', this.upcomingTrack());

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
