import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BackgroundPlayService {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  
  // Signal to track the toggle state, defaulting to false (OFF)
  public isEnabled = signal<boolean>(false);
  
  // Track if we are currently playing the silent audio
  private isPlaying = false;

  constructor() {
    this.loadSetting();
  }

  private loadSetting() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('ganatube_bg_play');
      if (stored !== null) {
        this.isEnabled.set(stored === 'true');
      }
    }
  }

  public toggleSetting(value: boolean) {
    this.isEnabled.set(value);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('ganatube_bg_play', value ? 'true' : 'false');
    }
    
    // If we turned it off while it was playing, stop it.
    if (!value && this.isPlaying) {
      this.stopSilentAudio();
    }
  }

  /**
   * Starts a silent oscillator. Must be called after a user gesture.
   */
  public startSilentAudio() {
    if (!this.isEnabled()) return;
    if (this.isPlaying) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioContext) {
        this.audioContext = new AudioContextClass();
      }

      // Resume context if it was suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      // Completely silent
      this.gainNode.gain.value = 0;

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.oscillator.start();
      this.isPlaying = true;
    } catch (e) {
      console.warn('Failed to start silent audio for background playback:', e);
    }
  }

  public stopSilentAudio() {
    if (!this.isPlaying) return;
    
    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      
      // We can also suspend the context to save resources
      if (this.audioContext && this.audioContext.state === 'running') {
        this.audioContext.suspend();
      }
      
      this.isPlaying = false;
    } catch (e) {
      console.warn('Error stopping silent audio:', e);
    }
  }
}
