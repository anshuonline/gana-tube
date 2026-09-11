import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoomService } from '../../../services/room.service';
import { PlayerService, Track } from '../../../services/player.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { 
  LucideUsers, 
  LucideLogOut,
  LucidePlay,
  LucidePause,
  LucideSkipForward,
  LucideSkipBack,
  LucideSend,
  LucideGlobe,
  LucideLock,
  LucideCopy,
  LucideRefreshCw,
  LucideTrash2,
  LucideMusic,
  LucideSearch,
  LucideMoreVertical,
  LucideRepeat,
  LucideRepeat1,
  LucideShare2
} from '@lucide/angular';
import { RoomMembersPanelComponent } from '../room-members-panel/room-members-panel.component';
import { TrackMenuComponent } from '../../track-menu/track-menu.component';
import { AppStateService } from '../../../services/app-state.service';

@Component({
  selector: 'app-room-view',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    LucideUsers, 
    LucideLogOut,
    LucidePlay,
    LucidePause,
    LucideSkipForward,
    LucideSkipBack,
    LucideSend,
    LucideGlobe,
    LucideLock,
    LucideCopy,
    LucideRefreshCw,
    LucideTrash2,
    LucideMusic,
    LucideSearch,
    LucideMoreVertical,
    LucideRepeat,
    LucideRepeat1,
    LucideShare2,
    RoomMembersPanelComponent,
    TrackMenuComponent
  ],
  templateUrl: './room-view.component.html',
  styleUrls: ['./room-view.component.scss']
})
export class RoomViewComponent implements OnInit, OnDestroy, AfterViewChecked {
  public roomService = inject(RoomService);
  public playerService = inject(PlayerService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private appState = inject(AppStateService);

  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

  chatInput = '';
  showMembersPanel = false;
  activeMobileTab: 'queue' | 'chat' = 'chat';
  
  // Track Menu state
  isMenuOpen = false;
  menuX = 0;
  menuY = 0;
  activeMenuTrack: any = null;
  
  private routeSub: any;

  ngOnInit() {
    this.routeSub = this.router.events.subscribe(() => {
      this.checkDeepLink();
    });
    this.checkDeepLink();
  }

  private checkDeepLink() {
    const url = this.router.url;
    if (url.startsWith('/rooms/')) {
      const parts = url.split('/');
      if (parts.length > 2 && parts[2]) {
        const roomId = parts[2];
        const info = this.roomService.currentRoomInfo();
        if (!info || info.roomId !== roomId) {
          this.toastService.show('Please join through the Rooms page', 'info');
          this.router.navigate(['/rooms']);
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.chatScrollContainer) {
        this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  leaveRoom() {
    this.roomService.leaveRoom();
    this.playerService.pause();
    this.router.navigate(['/']);
  }

  toggleVisibility() {
    this.roomService.toggleVisibility();
  }

  copyJoinCode() {
    const info = this.roomService.currentRoomInfo();
    if (info?.joinCode) {
      navigator.clipboard.writeText(info.joinCode);
      this.toastService.show('Join code copied to clipboard!');
    }
  }

  regenerateCode() {
    this.roomService.regenerateCode();
  }

  shareRoom() {
    const info = this.roomService.currentRoomInfo();
    if (info) {
      const shareUrl = `${window.location.origin}/rooms/${info.roomId}`;
      navigator.clipboard.writeText(shareUrl);
      this.toastService.show('Room link copied to clipboard!');
    }
  }

  sendMessage() {
    if (!this.chatInput.trim()) return;
    const user = this.authService.currentUser();
    if (!user) return;
    
    this.roomService.sendChatMessage(this.chatInput, user.uid, user.displayName || 'User');
    this.chatInput = '';
  }

  // --- Admin Player Controls ---
  togglePlay() {
    if (!this.roomService.isAdmin()) return;
    const state = this.playerService.playerState();
    if (state === 'playing') {
      this.playerService.pause();
    } else if (state === 'paused' || state === 'unstarted') {
      this.playerService.togglePlayPause();
    }
  }

  nextTrack() {
    if (!this.roomService.isAdmin()) return;
    this.playerService.next();
  }

  previousTrack() {
    if (!this.roomService.isAdmin()) return;
    this.playerService.previous();
  }
  
  removeQueueItem(index: number) {
    if (!this.roomService.isAdmin()) return;
    this.playerService.removeFromQueue(index);
    this.roomService.adminQueueUpdate(this.playerService.queue());
  }

  formatTime(seconds: number): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  openSearch() {
    this.router.navigate(['/search']);
  }

  openTrackMenu(track: Track, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuTrack = track;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.isMenuOpen = true;
  }

  closeTrackMenu(): void {
    this.isMenuOpen = false;
    this.activeMenuTrack = null;
  }

  openSaveModal(track: any) {
    this.appState.openSavePlaylist(track);
  }

  removeFromPlaylist(track: any): void {
    // No-op for room view, removing from queue is handled by removeQueueItem
    this.closeTrackMenu();
  }
}
