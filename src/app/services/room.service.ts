import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Track } from './player.service';
import { ToastService } from './toast.service';
import { inject } from '@angular/core';

export interface RoomMember {
  socketId: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  type: 'text' | 'song-share';
  content: string;
  track?: Track;
  timestamp: number;
}

export interface RoomInfo {
  roomId: string;
  name: string;
  isPublic: boolean;
  joinCode?: string;
  adminUid: string;
  adminFirebaseUid?: string;
  adminName: string;
  members: RoomMember[];
  currentTrack: Track | null;
  queue: Track[];
  currentTime: number;
  isPlaying: boolean;
  chat: ChatMessage[];
  listenerCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private socket!: Socket;
  
  public currentRoomInfo = signal<RoomInfo | null>(null);
  public members = signal<RoomMember[]>([]);
  public chat = signal<ChatMessage[]>([]);
  public roomQueue = signal<Track[]>([]);
  public isAdmin = signal<boolean>(false);
  public publicRooms = signal<RoomInfo[]>([]);
  public roomError = signal<string | null>(null);

  private toastService = inject(ToastService);

  constructor() {
    this.connect();
  }

  private connect() {
    const backendUrl = (environment as any).backendUrl 
      ? (environment as any).backendUrl.replace('/api', '') 
      : 'http://localhost:3000';
      
    this.socket = io(backendUrl);

    this.socket.on('connect', () => {
      console.log('Connected to Listen Together server, id:', this.socket.id);
    });

    this.socket.on('room:state', (state: RoomInfo) => {
      this.currentRoomInfo.set(state);
      this.members.set(state.members);
      this.chat.set(state.chat || []);
      this.roomQueue.set(state.queue || []);
      this.isAdmin.set(state.adminUid === this.socket.id);
      this.roomError.set(null);
    });

    this.socket.on('room:member_joined', ({ members, listenerCount }) => {
      this.members.set(members);
      const info = this.currentRoomInfo();
      if (info) {
        this.currentRoomInfo.set({ ...info, members, listenerCount });
      }
    });

    this.socket.on('room:member_left', ({ members, listenerCount }) => {
      this.members.set(members);
      const info = this.currentRoomInfo();
      if (info) {
        this.currentRoomInfo.set({ ...info, members, listenerCount });
      }
    });

    this.socket.on('room:admin_changed', ({ newAdminUid, members }) => {
      this.members.set(members);
      const info = this.currentRoomInfo();
      if (info) {
        this.currentRoomInfo.set({ ...info, members, adminUid: newAdminUid, adminName: members.find((m: any) => m.socketId === newAdminUid)?.displayName || info.adminName });
      }
      
      const isNowAdmin = newAdminUid === this.socket.id;
      if (isNowAdmin && !this.isAdmin()) {
        this.toastService.show('You are now the host. You have the control.', 'success', 5000);
      }
      this.isAdmin.set(isNowAdmin);
    });

    this.socket.on('room:chat_new', (msg: ChatMessage) => {
      this.chat.update(current => {
        const newChat = [...current, msg];
        if (newChat.length > 100) return newChat.slice(-100);
        return newChat;
      });
      const info = this.currentRoomInfo();
      if (info) {
        info.chat = this.chat();
        this.currentRoomInfo.set({ ...info });
      }
    });

    this.socket.on('room:closed', () => {
      this.currentRoomInfo.set(null);
      this.members.set([]);
      this.chat.set([]);
      this.roomQueue.set([]);
      this.isAdmin.set(false);
      this.roomError.set('Room was closed by the admin');
    });

    this.socket.on('room:kicked', ({ reason }) => {
      this.currentRoomInfo.set(null);
      this.members.set([]);
      this.chat.set([]);
      this.roomQueue.set([]);
      this.isAdmin.set(false);
      this.roomError.set(reason || 'You were removed from the room');
    });

    this.socket.on('room:error', (err: string) => {
      this.roomError.set(err);
    });

    this.socket.on('room:discover_results', (rooms: RoomInfo[]) => {
      this.publicRooms.set(rooms);
    });
  }

  getSocket(): Socket {
    return this.socket;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Actions
  createRoom(name: string, isPublic: boolean, adminUser: any) {
    this.socket.emit('room:create', { name, isPublic, adminUser });
  }

  joinRoom(roomId: string, joinCode: string | null, user: any) {
    this.socket.emit('room:join', { roomId, joinCode, user });
  }

  leaveRoom() {
    this.socket.emit('room:leave');
    this.currentRoomInfo.set(null);
    this.members.set([]);
    this.chat.set([]);
    this.roomQueue.set([]);
    this.isAdmin.set(false);
  }

  transferAdmin(targetSocketId: string) {
    if (this.isAdmin()) {
      this.socket.emit('room:transfer_admin', { targetSocketId });
    }
  }

  toggleVisibility() {
    if (this.isAdmin()) {
      this.socket.emit('room:toggle_visibility');
    }
  }

  kickMember(targetSocketId: string) {
    if (this.isAdmin()) {
      this.socket.emit('room:kick_member', { targetSocketId });
    }
  }

  // Spam Filter State
  private messageHistory: { time: number; content: string }[] = [];

  private getSpamMuteState(): { level: number; expiresAt: number } | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const saved = localStorage.getItem('gt_chat_mute');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() > parsed.expiresAt) {
          // Reset level if 24 hours passed since expiration
          if (Date.now() > parsed.expiresAt + 24 * 60 * 60 * 1000) {
            localStorage.removeItem('gt_chat_mute');
            return null;
          }
          // Expired but in decay window
          return { level: parsed.level, expiresAt: 0 };
        }
        return parsed;
      }
    } catch(e) {}
    return null;
  }

  private applySpamMute() {
    const currentState = this.getSpamMuteState();
    let newLevel = 1;
    if (currentState) {
      newLevel = currentState.level + 1;
    }
    if (newLevel > 4) newLevel = 4;

    const durations = [0, 2 * 60 * 1000, 10 * 60 * 1000, 30 * 60 * 1000, 24 * 60 * 60 * 1000];
    const duration = durations[newLevel];
    const expiresAt = Date.now() + duration;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_chat_mute', JSON.stringify({ level: newLevel, expiresAt }));
    }

    if (newLevel === 1) {
      this.toastService.show('Chat Muted for 2 minutes due to excessive messaging.', 'error', 5000);
    } else if (newLevel === 2) {
      this.toastService.show('Chat Muted for 10 Minutes. Please slow down and avoid flooding.', 'error', 5000);
    } else if (newLevel === 3) {
      this.toastService.show('Chat Muted for 30 Minutes for continued flooding.', 'error', 5000);
    } else {
      this.toastService.show('Chat Restricted. You have reached 4 warnings. Muted for 24 hours in all rooms.', 'error', 7000);
    }
  }

  private checkSpam(content: string): boolean {
    const now = Date.now();
    this.messageHistory = this.messageHistory.filter(m => now - m.time < 10000);
    this.messageHistory.push({ time: now, content });

    if (this.messageHistory.length > 5) {
      this.applySpamMute();
      this.messageHistory = [];
      return true;
    }

    if (this.messageHistory.length >= 3) {
      const last3 = this.messageHistory.slice(-3).map(m => m.content);
      if (last3[0] === content && last3[1] === content && last3[2] === content) {
        this.applySpamMute();
        this.messageHistory = [];
        return true;
      }
    }
    return false;
  }

  sendChatMessage(content: string, senderUid: string, senderName: string) {
    if (!content.trim()) return;
    
    const muteState = this.getSpamMuteState();
    if (muteState && Date.now() < muteState.expiresAt) {
      const remain = Math.ceil((muteState.expiresAt - Date.now()) / 60000);
      this.toastService.show(`You are muted. Try again in ${remain} minute(s).`, 'error');
      return;
    }

    if (this.checkSpam(content)) {
      return;
    }

    this.socket.emit('room:chat_message', {
      type: 'text',
      content,
      senderUid,
      senderName
    });
  }

  sendSongShare(track: Track, senderUid: string, senderName: string) {
    const muteState = this.getSpamMuteState();
    if (muteState && Date.now() < muteState.expiresAt) {
      const remain = Math.ceil((muteState.expiresAt - Date.now()) / 60000);
      this.toastService.show(`You are muted. Try again in ${remain} minute(s).`, 'error');
      return;
    }

    if (this.checkSpam('song-share-' + track.videoId)) {
      return;
    }

    this.socket.emit('room:chat_message', {
      type: 'song-share',
      content: '',
      track,
      senderUid,
      senderName
    });
  }

  discoverRooms() {
    this.socket.emit('room:discover');
  }

  // Playback & Queue Actions for Admin
  adminPlayTrack(track: Track) {
    if (this.isAdmin()) {
      this.socket.emit('room:play_track', { track });
    }
  }

  adminPause(currentTime: number) {
    if (this.isAdmin()) {
      this.socket.emit('room:playback_sync', { isPlaying: false, currentTime });
    }
  }

  adminResume(currentTime: number) {
    if (this.isAdmin()) {
      this.socket.emit('room:playback_sync', { isPlaying: true, currentTime });
    }
  }

  adminSeek(currentTime: number) {
    if (this.isAdmin()) {
      this.socket.emit('room:playback_sync', { isPlaying: true, currentTime });
    }
  }

  adminQueueUpdate(queue: Track[], currentIndex: number) {
    if (this.isAdmin()) {
      this.socket.emit('room:queue_updated', { queue, currentIndex });
    }
  }
}
