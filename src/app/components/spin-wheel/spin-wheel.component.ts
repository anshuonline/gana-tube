import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideX, LucideCoins, LucideInfo } from '@lucide/angular';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

export interface WheelStatus {
  status: string;
  g_coins: number;
  spins_left: number;
}

import { SpinService } from '../../services/spin.service';

@Component({
  selector: 'app-spin-wheel',
  standalone: true,
  imports: [CommonModule, LucideX, LucideCoins, LucideInfo],
  templateUrl: './spin-wheel.component.html',
  styleUrls: ['./spin-wheel.component.scss']
})
export class SpinWheelComponent implements OnInit {
  authService = inject(AuthService);
  http = inject(HttpClient);
  spinService = inject(SpinService);

  isVisible = signal<boolean>(false);
  isSpinning = signal<boolean>(false);
  
  // Use signals from service
  gCoins = this.spinService.gCoins;
  spinsLeft = this.spinService.spinsLeft;
  
  wheelRotation = signal<number>(0);
  spinResultText = signal<string>('');
  showCongratsPopup = signal<boolean>(false);
  wonCoinsAmount = signal<number>(0);
  
  // Base API url
  apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost/manageads/wheel-api.php'
    : 'https://manageads.ganatube.in/wheel-api.php';
  
  // Audio elements
  private wheelAudio: HTMLAudioElement;
  private coinAudio: HTMLAudioElement;
  private fadeInterval: any = null;

  constructor() {
    this.wheelAudio = new Audio('sfx/wheelsound.mp3');
    this.wheelAudio.loop = true;
    this.wheelAudio.preload = 'auto';
    this.coinAudio = new Audio('sfx/coin drop.mp3');
    this.coinAudio.preload = 'auto';
    
    effect(() => {
      if (this.isVisible() && this.authService.currentUser()) {
        this.spinService.fetchStatus();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
  }

  open() {
    this.isVisible.set(true);
    this.spinResultText.set('');
    this.showCongratsPopup.set(false);
    // Ensure we fetch the latest status when opened
    this.spinService.fetchStatus();
  }
  
  close() {
    if (!this.isSpinning()) {
      this.isVisible.set(false);
      // Ensure audio is fully stopped when closing
      this.stopWheelAudio();
    }
  }

  private stopWheelAudio() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    this.wheelAudio.pause();
    this.wheelAudio.currentTime = 0;
    this.wheelAudio.volume = 0;
  }

  fadeAudio(audio: HTMLAudioElement, targetVolume: number, duration: number, callback?: () => void) {
    // Clear any existing fade on this audio
    if (audio === this.wheelAudio && this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    
    const steps = 25;
    const stepTime = duration / steps;
    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Use easeInOut curve for smoother fading
      const easedProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      let newVol = startVolume + volumeDiff * easedProgress;
      newVol = Math.max(0, Math.min(1, newVol));
      audio.volume = newVol;
      
      if (currentStep >= steps) {
        audio.volume = Math.max(0, Math.min(1, targetVolume));
        clearInterval(interval);
        if (audio === this.wheelAudio) this.fadeInterval = null;
        if (callback) callback();
      }
    }, stepTime);
    
    if (audio === this.wheelAudio) {
      this.fadeInterval = interval;
    }
  }

  spin() {
    const user = this.authService.currentUser();
    if (!user) {
      alert("Please log in to spin!");
      return;
    }
    
    if (this.spinsLeft() <= 0) {
      alert("No chances left today! Listen to music for 2 minutes to earn a chance.");
      return;
    }
    
    if (this.isSpinning()) return;
    this.isSpinning.set(true);
    this.spinResultText.set('');
    this.showCongratsPopup.set(false);
    
    // Stop any previous audio cleanly
    this.stopWheelAudio();
    
    // Play wheel sound with smooth fade in
    this.wheelAudio.volume = 0;
    this.wheelAudio.currentTime = 0;
    this.wheelAudio.play().catch(e => console.log('Audio play failed', e));
    this.fadeAudio(this.wheelAudio, 0.8, 500); // fade in to 80% over 500ms
    
    // Sync audio speed and pitch with the wheel's deceleration
    this.syncAudioSpeed(9000);
    
    // Call API
    this.http.post<any>(`${this.apiUrl}?action=spin`, { email: user.email })
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.spinService.spinsLeft.set(res.spins_left);
            
            // Segments based on user image:
            // Wheel segments (clockwise rotation means pointer sweeps counter-clockwise):
            // 0: iPhone, 300: AirPods, 240: G Coins, 180: Better Luck, 120: Rs 500, 60: Amazon
            
            let targetAngle = 0;
            if (res.segment === 0) {
              // G Coins (210 to 270)
              // 268: Barely ticked over from AirPods
              // 212: Almost fell into Better Luck
              targetAngle = Math.random() > 0.5 ? 268 : 212;
              // add a tiny sub-degree randomness so it doesn't look identical every time
              targetAngle += (Math.random() * 2 - 1);
            } else {
              // Better luck next time (150 to 210)
              // 208: Barely ticked over from G Coins
              // 152: Almost fell into Rs 500
              targetAngle = Math.random() > 0.5 ? 208 : 152;
              targetAngle += (Math.random() * 2 - 1);
            }
            
            const currentRot = this.wheelRotation();
            const fullRots = Math.floor(currentRot / 360);
            // Spin 10 full rotations for an intense, long spin
            const baseRot = fullRots * 360 + 3600;
            
            const pointerCorrection = (360 - targetAngle) % 360;
            const finalRotation = baseRot + pointerCorrection;
            
            this.wheelRotation.set(finalRotation);
            
            // Start fading out wheel sound at ~7s mark (2s before animation ends at 9s)
            setTimeout(() => {
              this.fadeAudio(this.wheelAudio, 0, 2000, () => {
                this.wheelAudio.pause();
                this.wheelAudio.currentTime = 0;
              });
            }, 7000);
            
            // Wait for full 9s animation to complete
            setTimeout(() => {
              this.isSpinning.set(false);
              this.spinService.gCoins.set(res.g_coins);
              
              if (res.result === 'win') {
                this.spinResultText.set(`🎉 You won ${res.coins_won} G Coins!`);
                this.wonCoinsAmount.set(res.coins_won);
                this.showCongratsPopup.set(true);
                // Play coin drop sound
                this.coinAudio.currentTime = 0;
                this.coinAudio.volume = 1;
                this.coinAudio.play().catch(e => console.log('Audio play failed', e));
              } else {
                this.spinResultText.set(`Better luck next time!`);
              }
            }, 9000);
            
          } else {
            this.stopWheelAudio();
            this.isSpinning.set(false);
            alert(res.message);
          }
        },
        error: (err) => {
          this.stopWheelAudio();
          this.isSpinning.set(false);
          console.error(err);
        }
      });
  }

  private syncAudioSpeed(durationMs: number) {
    const startTime = performance.now();
    
    // Attempt to drop pitch for realistic slowing down effect
    try {
      (this.wheelAudio as any).preservesPitch = false;
      (this.wheelAudio as any).webkitPreservesPitch = false;
      (this.wheelAudio as any).mozPreservesPitch = false;
    } catch(e) {}

    const updateRate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      let rate = 3.0;
      if (progress < 0.2) {
        // Drop from 3.0 to 1.5 in the first 20%
        rate = 3.0 - (progress / 0.2) * 1.5;
      } else {
        // Drop from 1.5 to 0.4 over the remaining 80% (cubic-bezier approximation)
        const p2 = (progress - 0.2) / 0.8;
        // Ease-out curve for the audio slowdown
        rate = 1.5 - (p2 * 1.1);
      }
      
      this.wheelAudio.playbackRate = Math.max(0.4, rate);

      if (progress < 1 && this.isSpinning()) {
        requestAnimationFrame(updateRate);
      } else {
        this.wheelAudio.playbackRate = 1.0;
      }
    };
    
    requestAnimationFrame(updateRate);
  }
}
