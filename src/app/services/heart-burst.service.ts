import { Injectable } from '@angular/core';

export interface HeartBurstOptions {
  x: number;
  y: number;
  particleCount?: number;
  sparkCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HeartBurstService {
  // Inline SVG so no extra network/asset request on every tap
  private readonly HEART_SVG =
    `<svg viewBox="0 0 24 24">` +
    `<defs>` +
    `<linearGradient id="hp-grad" x1="0%" y1="0%" x2="100%" y2="100%">` +
    `<stop offset="0%" stop-color="#ff0055" />` +
    `<stop offset="100%" stop-color="#ff66a3" />` +
    `</linearGradient>` +
    `</defs>` +
    `<path d="M12 21s-6.7-4.35-9.3-8.1C.7 9.7 1.6 6 4.9 5.1 7 4.5 9 5.4 12 8.2 15 5.4 17 4.5 19.1 5.1c3.3.9 4.2 4.6 2.2 7.7C18.7 16.65 12 21 12 21z" fill="url(#hp-grad)"/>` +
    `</svg>`;

  /** Call this on double-tap with the tap's screen x/y. Fires the full cute burst. */
  public trigger(opts: HeartBurstOptions): void {
    const { x, y } = opts;
    const particleCount = opts.particleCount ?? 8;
    const sparkCount = opts.sparkCount ?? 6;

    this.spawnMainHeart(x, y);
    this.spawnRing(x, y);
    this.spawnParticles(x, y, particleCount);
    this.spawnSparks(x, y, sparkCount);
  }

  private spawnMainHeart(x: number, y: number): void {
    const el = document.createElement('div');
    el.className = 'floating-heart';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerHTML = this.HEART_SVG;
    document.body.appendChild(el);
    this.cleanupAfter(el, 900);
  }

  private spawnRing(x: number, y: number): void {
    const el = document.createElement('div');
    el.className = 'heart-ring';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    this.cleanupAfter(el, 600);
  }

  /** Mini hearts thrown outward in a roughly even circle, with a little randomness so it never looks mechanical. */
  private spawnParticles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i + (Math.random() * 20 - 10);
      const distance = 70 + Math.random() * 50;
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * distance;
      const ty = Math.sin(rad) * distance - 20; // slight upward bias, feels lighter

      const el = document.createElement('div');
      el.className = 'mini-heart';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.setProperty('--tx', `${tx}px`);
      el.style.setProperty('--ty', `${ty}px`);
      el.style.setProperty('--rot', `${Math.random() * 60 - 30}deg`);
      el.style.setProperty('--size', `${12 + Math.random() * 14}px`);
      el.style.setProperty('--delay', `${Math.random() * 120}ms`);
      el.innerHTML = this.HEART_SVG;
      document.body.appendChild(el);
      this.cleanupAfter(el, 1000);
    }
  }

  private spawnSparks(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 360;
      const distance = 30 + Math.random() * 40;
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * distance;
      const ty = Math.sin(rad) * distance;

      const el = document.createElement('div');
      el.className = 'mini-spark';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.setProperty('--tx', `${tx}px`);
      el.style.setProperty('--ty', `${ty}px`);
      el.style.setProperty('--delay', `${Math.random() * 150}ms`);
      document.body.appendChild(el);
      this.cleanupAfter(el, 800);
    }
  }

  private cleanupAfter(el: HTMLElement, ms: number): void {
    setTimeout(() => el.remove(), ms + 50);
  }
}
