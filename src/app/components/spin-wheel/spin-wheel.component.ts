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
  
  // Base API url
  apiUrl = 'https://ganatube.in/manageads/wheel-api.php';
  
  // Audio elements
  private wheelAudio: HTMLAudioElement;
  private coinAudio: HTMLAudioElement;

  constructor() {
    this.wheelAudio = new Audio('sfx/wheelsound.mp3');
    this.wheelAudio.loop = true;
    this.coinAudio = new Audio('sfx/coin drop.mp3');
    
    effect(() => {
      if (this.isVisible() && this.authService.currentUser()) {
        this.spinService.fetchStatus();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    if (environment.production === false) {
      this.apiUrl = 'http://localhost/manageads/wheel-api.php';
    }
  }

  open() {
    this.isVisible.set(true);
    this.spinResultText.set('');
    // Ensure we fetch the latest status when opened
    this.spinService.fetchStatus();
  }
  
  close() {
    if (!this.isSpinning()) {
      this.isVisible.set(false);
    }
  }

  fadeAudio(audio: HTMLAudioElement, targetVolume: number, duration: number) {
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = (targetVolume - audio.volume) / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      let newVol = audio.volume + volumeStep;
      if (newVol > 1) newVol = 1;
      if (newVol < 0) newVol = 0;
      audio.volume = newVol;
      
      if (currentStep >= steps) {
        audio.volume = targetVolume;
        clearInterval(interval);
      }
    }, stepTime);
  }

  // Removed local fetchStatus as it's now in SpinService

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
    
    // Play wheel sound with fade in
    this.wheelAudio.volume = 0;
    this.wheelAudio.play().catch(e => console.log('Audio play failed', e));
    this.fadeAudio(this.wheelAudio, 1, 300); // fade in 300ms
    
    // Call API
    this.http.post<any>(`${this.apiUrl}?action=spin`, { email: user.email })
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.spinService.spinsLeft.set(res.spins_left);
            
            // Segments based on user image:
            // Top: iPhone (approx 0 deg)
            // Top Right: Rs 1000 Amazon (approx 60 deg)
            // Bottom Right: Rs 500 Gift (approx 120 deg)
            // Bottom: Better luck next time (approx 180 deg)
            // Bottom Left: G Coins (approx 240 deg)
            // Top Left: AirPods (approx 300 deg)
            
            let targetAngle = 0;
            if (res.segment === 0) {
              // G Coins -> 240 degrees + random offset in the segment
              targetAngle = 240 + Math.floor(Math.random() * 40 - 20);
            } else {
              // Better luck next time -> 180 degrees + offset
              targetAngle = 180 + Math.floor(Math.random() * 40 - 20);
            }
            
            // Calculate total rotation
            // We want it to spin a few times (e.g. 5 full rotations = 1800 deg)
            // and end up at targetAngle relative to current.
            // But CSS rotation is absolute. So we add rotations on top of the current rotation.
            
            const currentRot = this.wheelRotation();
            // Calculate how many full rotations we've done so far to keep spinning forward
            const fullRots = Math.floor(currentRot / 360);
            const baseRot = fullRots * 360 + 1800; // spin 5 times
            
            // The wheel spins clockwise. Wait, to land at 240 degrees at the TOP pointer, 
            // the wheel itself must be rotated by (360 - 240) = 120 degrees relative to 0.
            // Let's assume the pointer is at the TOP.
            // 0 deg: iPhone is at top.
            // To bring 240 deg (G Coins) to top, we need to rotate by -240 or 360-240 = +120.
            const pointerCorrection = (360 - targetAngle) % 360;
            
            const finalRotation = baseRot + pointerCorrection;
            
            this.wheelRotation.set(finalRotation);
            
            // Wait for animation (which will be 4 seconds via CSS)
            setTimeout(() => {
              this.isSpinning.set(false);
              this.spinService.gCoins.set(res.g_coins);
              
              // Fade out wheel sound
              this.fadeAudio(this.wheelAudio, 0, 400);
              setTimeout(() => this.wheelAudio.pause(), 400);
              
              if (res.result === 'win') {
                this.spinResultText.set(`🎉 You won ${res.coins_won} G Coins!`);
                // Play win sound
                this.coinAudio.currentTime = 0;
                this.coinAudio.volume = 1;
                this.coinAudio.play().catch(e => console.log('Audio play failed', e));
              } else {
                this.spinResultText.set(`Better luck next time!`);
              }
            }, 4000);
            
          } else {
            this.fadeAudio(this.wheelAudio, 0, 300);
            setTimeout(() => this.wheelAudio.pause(), 300);
            this.isSpinning.set(false);
            alert(res.message);
          }
        },
        error: (err) => {
          this.fadeAudio(this.wheelAudio, 0, 300);
          setTimeout(() => this.wheelAudio.pause(), 300);
          this.isSpinning.set(false);
          console.error(err);
        }
      });
  }
}
