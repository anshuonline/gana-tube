import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  musicQuality = signal<'Low' | 'Standard' | 'Best'>('Standard');
  isListenTogetherVisible = signal<boolean>(false);

  setMusicQuality(quality: 'Low' | 'Standard' | 'Best') {
    this.musicQuality.set(quality);
  }

  openListenTogether() {
    this.isListenTogetherVisible.set(true);
  }

  savePlaylistTrack = signal<any | null>(null);

  openSavePlaylist(track: any) {
    this.savePlaylistTrack.set(track);
  }
}
