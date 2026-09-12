import { Component, effect, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoomService } from '../../../services/room.service';
import { PlayerService, Track } from '../../../services/player.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { YoutubeApiService } from '../../../services/youtube-api.service';
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private appState = inject(AppStateService);
  private youtubeApi = inject(YoutubeApiService);

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
          this.playerService.pause();
        } else if (err.includes('removed from the room')) {
          this.toastService.show(err, 'info', 5000);
          this.playerService.pause();
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

    // Auto-join effect
    effect(() => {
      const user = this.authService.currentUser();
      const info = this.roomService.currentRoomInfo();
      const url = this.router.url;

      // Wait until auth state is determined
      if (user === undefined) return;

      if (url.startsWith('/rooms/')) {
        const parts = url.split('/');
        if (parts.length > 2 && parts[2]) {
          const roomId = parts[2];
          
          if (!info || info.roomId !== roomId) {
            if (user) {
              this.roomService.joinRoom(roomId, null, user);
            } else {
              this.toastService.show('Please log in to join a room', 'info');
              this.router.navigate(['/rooms']);
            }
          }
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
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
    
    // Check if the input is a GanaTube URL
    const gtRegex = /(?:betatesting\.)?ganatube\.in\/(?:play|share\.php)\?v=([a-zA-Z0-9_-]{11})/;
    const match = this.chatInput.match(gtRegex);
    
    const currentInput = this.chatInput;
    this.chatInput = '';
    this.showEmojiPicker = false;

    if (match && match[1]) {
      const videoId = match[1];
      this.toastService.show('Loading track details...', 'info', 2000);
      
      this.youtubeApi.getVideoDetails([videoId]).subscribe({
        next: (results) => {
          if (results && results.length > 0) {
            this.roomService.sendSongShare(results[0], user.uid, user.displayName || 'User');
          } else {
            this.roomService.sendChatMessage(currentInput, user.uid, user.displayName || 'User');
          }
        },
        error: (err) => {
          console.error('Failed to load track details:', err);
          this.roomService.sendChatMessage(currentInput, user.uid, user.displayName || 'User');
        }
      });
    } else {
      this.roomService.sendChatMessage(currentInput, user.uid, user.displayName || 'User');
    }
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
  
  playEmbeddedSong(track: any) {
    if (!this.roomService.isAdmin()) return;
    this.playerService.playTrack(track);
    
    // Add an automated system message saying the host picked it
    const user = this.authService.currentUser();
    if (user) {
      this.roomService.sendChatMessage(`Host picked this music: ${track.title}`, user.uid, 'System');
    }
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
