import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface RoomUser {
  id: string;
  nickname: string;
}

export interface RoomState {
  hostId: string;
  users: RoomUser[];
  currentTrack: any;
  currentTime: number;
  isPlaying: boolean;
  queue: any[];
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private socket!: Socket;
  
  public currentRoom = signal<string | null>(null);
  public currentUser = signal<string | null>(null);
  public users = signal<RoomUser[]>([]);
  public hostId = signal<string | null>(null);
  public isHost = signal<boolean>(false);
  public notification = signal<string | null>(null);

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

    this.socket.on('room_state', (state: RoomState) => {
      this.users.set(state.users);
      this.hostId.set(state.hostId);
      this.isHost.set(state.hostId === this.socket.id);
    });

    this.socket.on('users_updated', ({ users, hostId }: { users: RoomUser[], hostId: string }) => {
      this.users.set(users);
      this.hostId.set(hostId);
      this.isHost.set(hostId === this.socket.id);
    });

    this.socket.on('notification', (msg: string) => {
      this.notification.set(msg);
      setTimeout(() => this.notification.set(null), 3000);
    });
  }

  getSocket(): Socket {
    return this.socket;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  joinRoom(roomId: string, nickname: string) {
    this.socket.emit('join_room', { roomId, nickname });
    this.currentRoom.set(roomId);
    this.currentUser.set(nickname);
  }

  leaveRoom() {
    const room = this.currentRoom();
    if (room) {
      this.socket.emit('leave_room', room);
      this.currentRoom.set(null);
      this.currentUser.set(null);
      this.users.set([]);
      this.hostId.set(null);
      this.isHost.set(false);
    }
  }

  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
