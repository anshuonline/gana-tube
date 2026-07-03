import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  musicQuality = signal<'High' | 'Standard' | 'Data Saver'>('High');
  isListenTogetherVisible = signal<boolean>(false);

  setMusicQuality(quality: 'High' | 'Standard' | 'Data Saver') {
    this.musicQuality.set(quality);
  }

  openListenTogether() {
    this.isListenTogetherVisible.set(true);
  }
}
