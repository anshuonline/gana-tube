import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineService } from '../../services/offline.service';
import { PlayerService, Track } from '../../services/player.service';
import { LucidePlay, LucideTrash2, LucideDownload, LucideInfo } from '@lucide/angular';

@Component({
  selector: 'app-offline-library',
  standalone: true,
  imports: [CommonModule, LucidePlay, LucideTrash2, LucideDownload, LucideInfo],
  template: `
    <div class="offline-library-container fade-in">
      <div class="header">
        <h1 class="page-title">Offline Library</h1>
        <p class="subtitle">Songs you've downloaded to listen without internet.</p>
      </div>

      <div class="info-notice">
        <svg lucideInfo [attr.size]="24" class="info-icon"></svg>
        <div class="notice-text">
          <strong>Notice:</strong> We are aware that the download option is currently not working. We are actively working on fixing it and it will be available soon!
        </div>
      </div>

      <div class="empty-state" *ngIf="offlineTracks().length === 0">
        <div class="empty-icon">
          <svg lucideDownload [attr.size]="48"></svg>
        </div>
        <h2>No songs downloaded yet</h2>
        <p>Click the download icon on any song to save it for offline listening.</p>
      </div>

      <div class="tracks-list" *ngIf="offlineTracks().length > 0">
        <div 
          class="track-item" 
          *ngFor="let track of offlineTracks(); let i = index"
          [class.playing]="playerService.currentTrack()?.videoId === track.videoId"
        >
          <div class="track-info" (click)="playOfflineTrack(i)">
            <img [src]="track.thumbnail" [alt]="track.title" class="track-thumb" />
            <div class="track-meta">
              <span class="track-title" [title]="track.title">{{ track.title }}</span>
              <span class="track-artist">{{ track.channelTitle }}</span>
            </div>
          </div>
          
          <div class="track-actions">
            <button class="action-btn play-btn" (click)="playOfflineTrack(i)" title="Play">
              <svg lucidePlay [attr.size]="20"></svg>
            </button>
            <button class="action-btn remove-btn" (click)="removeTrack(track.videoId)" title="Remove Download">
              <svg lucideTrash2 [attr.size]="20"></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .offline-library-container {
      padding: 100px 24px 120px 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      margin-bottom: 32px;
    }
    
    .page-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    
    .subtitle {
      color: #9ca3af;
      font-size: 1.1rem;
      margin: 0;
    }

    .info-notice {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: rgba(234, 179, 8, 0.1);
      border: 1px solid rgba(234, 179, 8, 0.2);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 32px;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
    }
    
    .info-notice .info-icon {
      color: #eab308;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 24px;
      border: 1px dashed rgba(255, 255, 255, 0.1);
    }
    
    .empty-icon {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: rgba(139, 92, 246, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8b5cf6;
      margin-bottom: 24px;
    }
    
    .empty-state h2 {
      font-size: 1.5rem;
      color: #fff;
      margin: 0 0 12px 0;
    }
    
    .empty-state p {
      color: #9ca3af;
      margin: 0;
      max-width: 400px;
      line-height: 1.5;
    }

    .tracks-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .track-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.2s ease;
    }
    
    .track-item:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    .track-item.playing {
      background: rgba(139, 92, 246, 0.1);
      border-color: rgba(139, 92, 246, 0.3);
    }
    
    .track-info {
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      flex: 1;
      min-width: 0;
    }
    
    .track-thumb {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      object-fit: cover;
    }
    
    .track-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    
    .track-title {
      color: #fff;
      font-weight: 600;
      font-size: 1.05rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .track-artist {
      color: #9ca3af;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .track-item.playing .track-title {
      color: #a78bfa;
    }
    
    .track-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.6;
      transition: opacity 0.2s ease;
    }
    
    .track-item:hover .track-actions {
      opacity: 1;
    }
    
    .action-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
    }
    
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.05);
    }
    
    .play-btn {
      background: rgba(139, 92, 246, 0.1);
      color: #a78bfa;
    }
    
    .play-btn:hover {
      background: rgba(139, 92, 246, 0.2);
    }
    
    .remove-btn {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
    }
    
    .remove-btn:hover {
      background: rgba(239, 68, 68, 0.2);
    }

    @media (max-width: 768px) {
      .page-title {
        font-size: 2rem;
      }
      .track-actions {
        opacity: 1;
      }
    }
  `]
})
export class OfflineLibraryComponent {
  offlineService = inject(OfflineService);
  playerService = inject(PlayerService);

  get offlineTracks(): () => Track[] {
    return () => this.offlineService.getDownloadedTrackList();
  }

  playOfflineTrack(index: number) {
    const tracks = this.offlineTracks();
    // Load the whole offline library as the queue
    this.playerService.queue.set(tracks);
    this.playerService.playFromQueue(index);
  }

  removeTrack(videoId: string) {
    if (confirm('Are you sure you want to remove this downloaded song?')) {
      this.offlineService.removeTrack(videoId);
    }
  }
}
