import { Injectable, signal } from '@angular/core';

const COOKIE_NAME = 'gt_search_history';
const MAX_ITEMS = 10;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  history = signal<string[]>([]);

  constructor() {
    this.loadFromCookie();
  }

  private loadFromCookie(): void {
    if (typeof document === 'undefined') return;
    this.history.set(this.readCookie());
  }

  private readCookie(): string[] {
    try {
      const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
      if (!match) return [];
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      return Array.isArray(parsed) ? parsed.filter((q: any) => typeof q === 'string' && q.trim()) : [];
    } catch {
      return [];
    }
  }

  private writeCookie(items: string[]): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(items))}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }

  add(query: string): void {
    const q = query.trim();
    if (!q) return;
    const current = this.history().filter(h => h.toLowerCase() !== q.toLowerCase());
    this.history.set([q, ...current].slice(0, MAX_ITEMS));
    this.writeCookie(this.history());
  }

  remove(query: string): void {
    this.history.set(this.history().filter(h => h !== query));
    this.writeCookie(this.history());
  }

  clear(): void {
    this.history.set([]);
    this.writeCookie([]);
  }
}
