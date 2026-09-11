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
  LucideMusic
} from '@lucide/angular';
import { RoomMembersPanelComponent } from '../room-members-panel/room-members-panel.component';

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
    RoomMembersPanelComponent
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

  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

  chatInput = '';
  showMembersPanel = false;
  activeMobileTab: 'queue' | 'chat' = 'chat';
  
  private routeSub: any;

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const roomId = params.get('roomId');
      // If we are deep linking, check if we are already in this room
      if (roomId) {
        const info = this.roomService.currentRoomInfo();
        if (!info || info.roomId !== roomId) {
          // Deep link join not fully supported yet without join code
          this.toastService.show('Please join through the Rooms page', 'info');
          this.router.navigate(['/']);
        }
      }
    });
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
}
