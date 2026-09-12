import { Component, effect, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
  LucideX,
  LucideMusic,
  LucideMoreVertical,
  LucideShare2,
  LucideSmile
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
    LucideX,
    LucideMusic,
    LucideMoreVertical,
    LucideShare2,
    LucideSmile,
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
  showEmojiPicker = false;
  
  // Track Menu state
  isMenuOpen = false;
  menuX = 0;
  menuY = 0;
  activeMenuTrack: any = null;

  // Common emojis for picker
  emojis = [
    '😀', '😂', '🥰', '😎', '🤩', '😍', '🥳', '😢',
    '🔥', '❤️', '💜', '🎵', '🎶', '🎧', '🎤', '🎸',
    '👏', '🙌', '💯', '✨', '⭐', '🌟', '👍', '👎',
    '🤘', '🎉', '🎊', '💃', '🕺', '🎹', '🥁', '🎺'
  ];

  constructor() {
    effect(() => {
      const err = this.roomService.roomError();
      if (err) {
        if (err === 'Room was closed by the admin') {
          this.toastService.show('Host has closed the room', 'info', 5000);
        } else if (err.includes('removed from the room')) {
          this.toastService.show(err, 'info', 5000);
        } else {
          this.toastService.show(err, 'info', 3000);
        }
        this.roomService.roomError.set(null);
        // Navigate back to rooms list if we lost room access
        if (!this.roomService.currentRoomInfo()) {
          this.router.navigate(['/rooms']);
        }
      }
    });
  }

  ngOnInit() {
    // If user lands on /rooms/:roomId without being in the room, try to auto-join
    this.tryAutoJoin();
  }

  private tryAutoJoin() {
    const url = this.router.url;
    if (url.startsWith('/rooms/')) {
      const parts = url.split('/');
      if (parts.length > 2 && parts[2]) {
        const roomId = parts[2];
        const info = this.roomService.currentRoomInfo();
        if (!info || info.roomId !== roomId) {
          // Not in this room — try auto-join for logged in users
          const user = this.authService.currentUser();
          if (user) {
            this.roomService.joinRoom(roomId, null, user);
          } else {
            this.toastService.show('Please log in to join a room', 'info');
            this.router.navigate(['/rooms']);
          }
        }
      }
    }
  }

  ngOnDestroy() {
    // Do NOT leave room on destroy — room persists while navigating
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
    this.router.navigate(['/rooms']);
  }

  toggleVisibility() {
    this.roomService.toggleVisibility();
  }

  copyRoomCode() {
    const info = this.roomService.currentRoomInfo();
    if (info?.roomId) {
      navigator.clipboard.writeText(info.roomId);
      this.toastService.show('Room code copied!');
    }
  }

  shareRoom() {
    const info = this.roomService.currentRoomInfo();
    if (info) {
      const shareUrl = `${window.location.origin}/rooms/${info.roomId}`;
      navigator.clipboard.writeText(shareUrl);
      this.toastService.show('Room link copied!');
    }
  }

  sendMessage() {
    if (!this.chatInput.trim()) return;
    const user = this.authService.currentUser();
    if (!user) return;
    
    this.roomService.sendChatMessage(this.chatInput, user.uid, user.displayName || 'User');
    this.chatInput = '';
    this.showEmojiPicker = false;
  }

  addEmoji(emoji: string) {
    this.chatInput += emoji;
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
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
    this.roomService.adminQueueUpdate(this.playerService.queue(), this.playerService.currentIndex());
  }

  formatTime(seconds: number): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
    this.closeTrackMenu();
  }
}
