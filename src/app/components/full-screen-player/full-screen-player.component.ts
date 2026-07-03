import { Component, Input, Output, EventEmitter, inject, OnInit, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService, Track } from '../../services/player.service';
import { YoutubeApiService } from '../../services/youtube-api.service';
import { 
  LucideChevronDown, 
  LucidePlay, 
  LucidePause, 
  LucideSkipForward, 
  LucideSkipBack, 
  LucideVolume2, 
  LucideVolumeX,
  LucideListMusic,
  LucideMic2,
  LucideShare2
} from '@lucide/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-full-screen-player',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    LucideChevronDown, 
    LucidePlay, 
    LucidePause, 
    LucideSkipForward, 
    LucideSkipBack, 
    LucideVolume2, 
    LucideVolumeX,
    LucideListMusic,
    LucideMic2,
    LucideShare2
  ],
  templateUrl: './full-screen-player.component.html',
  styleUrls: ['./full-screen-player.component.scss']
})
export class FullScreenPlayerComponent implements OnInit {
  @Input() isVisible = false;
  @Output() closePlayer = new EventEmitter<void>();
  @ViewChild('lyricsContainer') lyricsContainer!: ElementRef;

  public playerService = inject(PlayerService);
  private youtubeApi = inject(YoutubeApiService);

  activeView: 'artwork' | 'queue' | 'lyrics' = 'artwork';
  lyrics: string | null = null; // Plain text fallback
  parsedLyrics: { time: number, text: string }[] = [];
  activeLineIndex: number = -1;
  lyricsLoading = false;
  showToast = false;

  constructor() {
    // Automatically fetch lyrics when track changes if lyrics view is open
    effect(() => {
      const track = this.playerService.currentTrack();
      if (track && this.activeView === 'lyrics') {
        this.fetchLyrics();
      }
    });

    // Automatically track active lyric line based on playback time
    effect(() => {
      const time = this.playerService.currentTime();
      if (this.parsedLyrics.length > 0 && this.activeView === 'lyrics') {
        let newIndex = -1;
        for (let i = 0; i < this.parsedLyrics.length; i++) {
          if (time >= this.parsedLyrics[i].time) {
            newIndex = i;
          } else {
            break; // Since it's sorted, we can stop early
          }
        }
        if (newIndex !== this.activeLineIndex) {
          this.activeLineIndex = newIndex;
          this.scrollToActiveLine();
        }
      }
    });
  }

  ngOnInit(): void {}

  close(): void {
    this.closePlayer.emit();
  }

  toggleView(view: 'artwork' | 'queue' | 'lyrics'): void {
    if (this.activeView === view) {
      this.activeView = 'artwork';
    } else {
      this.activeView = view;
      if (view === 'lyrics') {
        this.fetchLyrics();
      }
    }
  }

  fetchLyrics(): void {
    const track = this.playerService.currentTrack();
    if (!track) return;
    
    this.lyricsLoading = true;
    this.lyrics = null;
    this.parsedLyrics = [];
    this.activeLineIndex = -1;
    
    const query = `${track.title} ${track.channelTitle}`;
    
    this.youtubeApi.getSyncedLyrics(query).subscribe(res => {
      if (res && res.syncedLyrics) {
        this.parseLrc(res.syncedLyrics);
      } else if (res && res.plainLyrics) {
        this.lyrics = res.plainLyrics.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
      } else {
        // Fallback to ytmusic-api static lyrics
        this.youtubeApi.getLyrics(track.videoId).subscribe(ly => {
          this.lyrics = ly;
        });
      }
      this.lyricsLoading = false;
    });
  }

  parseLrc(lrc: string): void {
    const lines = lrc.split('\n');
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    
    this.parsedLyrics = [];
    
    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);
        const text = match[4].trim();
        
        // Skip empty lines to keep it clean, or keep them for instrumental breaks
        if (text) {
          const time = min * 60 + sec + ms / 1000;
          this.parsedLyrics.push({ time, text });
        }
      }
    }
  }

  scrollToActiveLine(): void {
    if (!this.lyricsContainer) return;
    setTimeout(() => {
      const el = this.lyricsContainer.nativeElement as HTMLElement;
      const activeLine = el.querySelector('.lyric-line.active') as HTMLElement;
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  playQueueTrack(index: number): void {
    const queue = this.playerService.queue();
    this.playerService.setQueue(queue, index);
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  onSeek(event: any): void {
    const time = event.target.value;
    if ((this.playerService as any).ytPlayer) {
      (this.playerService as any).ytPlayer.seekTo(time, true);
    }
  }

  copyShareLink(): void {
    const track = this.playerService.currentTrack();
    if (!track) return;
    
    const url = `${window.location.origin}/?play=${track.videoId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast = true;
      setTimeout(() => this.showToast = false, 3000);
    });
  }
}
