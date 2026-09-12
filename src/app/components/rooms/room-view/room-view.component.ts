import { Component, effect, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
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
  LucideSmile,
  LucideChevronDown,
  LucideInfo,
  LucideSearch,
  LucideHeart
} from '@lucide/angular';
import { RoomMembersPanelComponent } from '../room-members-panel/room-members-panel.component';
import { TrackMenuComponent } from '../../track-menu/track-menu.component';
import { AppStateService } from '../../../services/app-state.service';
import { GuestNameModalComponent } from '../guest-name-modal/guest-name-modal.component';

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
    LucideChevronDown,
    LucideInfo,
    LucideSearch,
    LucideHeart,
    RoomMembersPanelComponent,
    TrackMenuComponent,
    GuestNameModalComponent
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
  mobileOptionsOpen = signal(false);
  showInfoModal = signal(false);
  showSearchModal = signal(false);
  searchQuery = '';
  searchResults: Track[] = [];
  isSearching = false;

  floatingHearts: { id: number, color: string, left: number, animationDuration: number }[] = [];
  heartColors = ['white', 'orange', 'pink', 'blue'];
  heartIdCounter = 0;
  pendingHearts = 0;
  heartInterval: any;
  private lastEmitTime = 0;
  
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
      const showingRules = this.showRulesPopup();
      const showingGuestModal = this.showGuestModal();

      // Wait until auth state is determined
      if (user === undefined) return;

      if (url.startsWith('/rooms/')) {
        const parts = url.split('/');
        if (parts.length > 2 && parts[2]) {
          const roomId = parts[2];
          
          if (!info || info.roomId !== roomId) {
            if (user) {
              if (showingRules || showingGuestModal) return; // Do not join until rules are accepted
              this.roomService.joinRoom(roomId, null, user);
            } else {
              // Guest Flow
              if (typeof localStorage !== 'undefined') {
                const guestName = localStorage.getItem('gt_guest_name');
                if (guestName) {
                  // We have a guest name, join as guest
                  if (showingRules || showingGuestModal) return;
                  const guestUser = {
                    uid: `guest-${localStorage.getItem('gt_guest_id') || Math.random().toString(36).substring(2, 10)}`,
                    displayName: guestName,
                    photoURL: null
                  };
                  if (!localStorage.getItem('gt_guest_id')) {
                    localStorage.setItem('gt_guest_id', guestUser.uid.replace('guest-', ''));
                  }
                  this.roomService.joinRoom(roomId, null, guestUser);
                } else {
                  // Prompt for guest name
                  this.pendingRoomIdToJoin = roomId;
                  this.showGuestModal.set(true);
                }
              }
            }
          }
        }
      }
    }, { allowSignalWrites: true });
  }

  onGuestNameConfirmed(name: string) {
    this.showGuestModal.set(false);
    // The effect will re-run and join automatically since localStorage is set
  }

  showGuestModal = signal(false);
  pendingRoomIdToJoin = '';
  
  showRulesPopup = signal(false);
  rulesAccepted = false;

  private errorHandler = (err: string) => {
    this.toastService.show(err, 'error');
    this.router.navigate(['/rooms']);
  };

  private likeSub?: any;

  ngOnInit() {
    if (typeof sessionStorage !== 'undefined') {
      if (!sessionStorage.getItem('gt_room_rules_accepted')) {
        this.showRulesPopup.set(true);
      }
    }
    
    this.roomService.getSocket().on('room:error', this.errorHandler);

    this.likeSub = this.roomService.onLikeReceived.subscribe(() => {
      this.pendingHearts++;
      if (this.pendingHearts > 40) this.pendingHearts = 40; // Max cap to prevent infinite rendering
    });

    this.heartInterval = setInterval(() => {
      if (this.pendingHearts > 0) {
        // Spawn 1 or 2 hearts per tick to make a continuous stream
        const spawnCount = Math.min(this.pendingHearts, Math.floor(Math.random() * 2) + 1);
        for(let i = 0; i < spawnCount; i++) {
          this.spawnHeart();
        }
        this.pendingHearts -= spawnCount;
      }
    }, 250); // Check 4 times a second
  }

  sendLike() {
    const user = this.authService.currentUser();
    if (user) {
      // Throttle socket emits to prevent network flood (max 2 per second)
      const now = Date.now();
      if (now - this.lastEmitTime > 500) {
        this.roomService.sendLike(user.uid, user.displayName || 'User');
        this.lastEmitTime = now;
      }
      
      // Locally spawn instantly by adding to queue
      this.pendingHearts++;
      if (this.pendingHearts > 40) this.pendingHearts = 40;
    }
  }

  spawnHeart() {
    const color = this.heartColors[Math.floor(Math.random() * this.heartColors.length)];
    const left = Math.random() * 20 + 80; // random between 80% to 100% of the screen width
    const animationDuration = Math.random() * 1.5 + 2; // 2-3.5s
    const id = this.heartIdCounter++;
    
    this.floatingHearts.push({ id, color, left, animationDuration });
    
    setTimeout(() => {
      this.floatingHearts = this.floatingHearts.filter(h => h.id !== id);
    }, animationDuration * 1000);
  }

  acceptRules() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('gt_room_rules_accepted', 'true');
    }
    this.showRulesPopup.set(false);
  }

  ngOnDestroy() {
    this.roomService.getSocket().off('room:error', this.errorHandler);
    if (this.likeSub) {
      this.likeSub.unsubscribe();
    }
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
    if (this.heartInterval) {
      clearInterval(this.heartInterval);
    }
    // Do NOT leave room on destroy — room persists while navigating
  }

  isUserScrolledUp = false;
  private previousChatLength = 0;

  ngAfterViewChecked() {
    const currentLength = this.roomService.chat().length;
    if (currentLength > this.previousChatLength) {
      this.previousChatLength = currentLength;
      this.scrollToBottom();
    }
  }

  onChatScroll() {
    if (!this.chatScrollContainer) return;
    const el = this.chatScrollContainer.nativeElement;
    // Allow a 20px threshold for being "at the bottom"
    this.isUserScrolledUp = (el.scrollHeight - el.scrollTop - el.clientHeight) > 20;
  }

  private scrollToBottom(): void {
    if (this.isUserScrolledUp) return; // Pause auto-scroll if user scrolled up
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

  minimizeRoom() {
    // Navigate away without leaving the room — music keeps playing
    this.router.navigate(['/']);
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
    let user = this.authService.currentUser();
    if (!user) {
      const guestName = localStorage.getItem('gt_guest_name');
      const guestId = localStorage.getItem('gt_guest_id');
      if (guestName && guestId) {
        user = {
          uid: guestId,
          email: '',
          displayName: guestName,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${guestName}`
        } as any;
      } else {
        return;
      }
    }
    
    // Ensure we have a valid user object before proceeding
    const currentUser = user;
    if (!currentUser || !currentUser.uid) return;
    
    // Check for third-party links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = this.chatInput.match(urlRegex);
    
    if (urls) {
      let hasExternalLink = false;
      for (const url of urls) {
        if (!url.includes('ganatube.in') && !url.includes('betatesting.ganatube.in')) {
          hasExternalLink = true;
          break;
        }
      }
      if (hasExternalLink) {
        this.toastService.show('Third-party links not allowed', 'error');
        this.chatInput = '';
        this.showEmojiPicker = false;
        return;
      }
    }

    // Check if the input is a GanaTube URL
    const ganatubeUrlPattern = /https?:\/\/(?:www\.)?(?:betatesting\.)?ganatube\.in\/(?:play|home)\?v=([a-zA-Z0-9_-]+)/;
    const currentInput = this.chatInput.trim();
    this.chatInput = '';
    this.showEmojiPicker = false;

    const match = currentInput.match(ganatubeUrlPattern);
    if (match && match[1]) {
      const videoId = match[1];
      
      this.youtubeApi.getVideoDetails([videoId]).subscribe({
        next: (results) => {
          if (results && results.length > 0) {
            this.roomService.sendSongShare(results[0], currentUser.uid, currentUser.displayName || 'User');
          } else {
            this.roomService.sendChatMessage(currentInput, currentUser.uid, currentUser.displayName || 'User');
          }
        },
        error: (err) => {
          console.error('Failed to load track details:', err);
          this.roomService.sendChatMessage(currentInput, currentUser.uid, currentUser.displayName || 'User');
        }
      });
    } else {
      this.roomService.sendChatMessage(currentInput, currentUser.uid, currentUser.displayName || 'User');
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

  playQueueItem(index: number) {
    if (!this.roomService.isAdmin()) return;
    this.playerService.playFromQueue(index);
  }

  seekProgress(event: MouseEvent, progressBar: HTMLElement) {
    if (!this.roomService.isAdmin()) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * this.playerService.duration();
    
    this.playerService.seekTo(newTime);
  }

  private cdr = inject(ChangeDetectorRef);
  searchSub?: Subscription;

  // --- Search functionality ---
  
  async searchSongs() {
    if (!this.searchQuery.trim()) return;
    this.isSearching = true;
    
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
    
    try {
      this.searchSub = this.youtubeApi.searchMusic(this.searchQuery.trim()).subscribe(results => {
        this.searchResults = results;
        this.isSearching = false;
        this.cdr.detectChanges();
      });
    } catch (e) {
      this.toastService.show('Failed to search. Try again.', 'error');
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  selectSearchResult(track: Track) {
    if (this.roomService.isAdmin()) {
      // Add directly to queue
      this.playerService.addToQueue(track);
      this.toastService.show(`Added "${track.title}" to queue`);
    } else {
      // Listeners can suggest by sharing to chat
      const user = this.authService.currentUser();
      if (user) {
        this.roomService.sendSongShare(track, user.uid, user.displayName || 'User');
        this.toastService.show(`Shared "${track.title}" in chat!`);
      }
    }
    this.showSearchModal.set(false);
    this.searchQuery = '';
    this.searchResults = [];
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
