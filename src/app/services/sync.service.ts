import { Injectable, signal, inject, effect } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface DeviceInfo {
  socketId?: string;
  deviceId: string;
  deviceName: string;
  isMobile: boolean;
  isActive: boolean;
}

export interface SyncState {
  isPlaying: boolean;
  currentTime: number;
  currentTrackId?: string;
  queue?: any[];
  currentIndex?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private socket!: Socket;
  public authService = inject(AuthService); // changed to public so it can be accessed in template
  
  // Local tab sync
  private bc = typeof window !== 'undefined' ? new BroadcastChannel('ganatube_local_sync') : null;
  
  deviceId: string = '';
  deviceName: string = '';
  isMobile: boolean = false;
  
  availableDevices = signal<DeviceInfo[]>([]);
  remoteState = signal<SyncState | null>(null);
  
  // Callback when a takeover is requested
  onTakeoverRequested: (fromDeviceId: string) => void = () => {};
  onRemoteStateReceived: (state: SyncState) => void = () => {};

  constructor() {
    this.initDevice();
    this.setupLocalSync();
    this.setupSocket();
    
    // Watch for login changes and join sync room if logged in
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.email && this.socket?.connected) {
        this.joinDeviceSync(user.email);
      } else if (!user) {
        this.availableDevices.set([]);
      }
    });
  }

  private initDevice() {
    if (typeof window === 'undefined') return;
    
    // Check local storage for existing ID
    let id = localStorage.getItem('gt_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('gt_device_id', id);
    }
    this.deviceId = id;
    
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Guess device name
    let os = 'Unknown OS';
    if (navigator.userAgent.indexOf("Win") != -1) os = "Windows";
    if (navigator.userAgent.indexOf("Mac") != -1) os = "Mac";
    if (navigator.userAgent.indexOf("X11") != -1) os = "UNIX";
    if (navigator.userAgent.indexOf("Linux") != -1) os = "Linux";
    if (navigator.userAgent.indexOf("Android") != -1) os = "Android";
    if (navigator.userAgent.indexOf("like Mac") != -1) os = "iOS";
    
    this.deviceName = `${this.isMobile ? 'Mobile' : 'Desktop'} (${os})`;
  }

  private setupLocalSync() {
    if (!this.bc) return;
    this.bc.onmessage = (event) => {
      const { type, payload, senderId } = event.data;
      if (senderId === this.deviceId) return;
      
      if (type === 'STATE_UPDATE') {
        this.onRemoteStateReceived(payload);
      } else if (type === 'TAKEOVER') {
        this.onTakeoverRequested(senderId);
      }
    };
  }

  private setupSocket() {
    if (typeof window === 'undefined') return;
    const backendUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000' 
      : 'https://ganatube.in'; // assuming server.js runs here

    this.socket = io(backendUrl);
    
    this.socket.on('connect', () => {
      // Join device sync room if logged in
      const user = this.authService.currentUser();
      if (user && user.email) {
        this.joinDeviceSync(user.email);
      }
    });

    this.socket.on('available_devices', (devices: DeviceInfo[]) => {
      this.availableDevices.set(devices);
    });

    this.socket.on('remote_state_update', ({ deviceId, state }: any) => {
      if (deviceId !== this.deviceId) {
        this.remoteState.set(state);
        this.onRemoteStateReceived(state);
      }
    });

    this.socket.on('takeover_requested', ({ fromDeviceId, toDeviceId }: any) => {
      if (this.deviceId === fromDeviceId) {
        // We were active, now we are losing it to toDeviceId
        this.onTakeoverRequested(toDeviceId);
      }
    });
  }

  public joinDeviceSync(email: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_device_sync', {
        email,
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        isMobile: this.isMobile
      });
    }
  }

  private lastRemoteSyncTime = 0;

  // Called when this device plays/pauses/seeks
  public broadcastState(state: SyncState, forceRemote: boolean = false) {
    // 1. Local sync (BroadcastChannel)
    if (this.bc) {
      this.bc.postMessage({ type: 'STATE_UPDATE', payload: state, senderId: this.deviceId });
    }
    
    // 2. Remote sync (Socket) - Throttle to prevent spamming server, unless forced
    const now = Date.now();
    if (forceRemote || (now - this.lastRemoteSyncTime > 3000)) {
      this.lastRemoteSyncTime = now;
      const user = this.authService.currentUser();
      if (user && user.email && this.socket && this.socket.connected) {
        this.socket.emit('device_state_update', {
          email: user.email,
          deviceId: this.deviceId,
          state
        });
      }
    }
  }

  // Request to become the active player and pause the previous active player
  public requestTakeover() {
    // 1. Local sync
    if (this.bc) {
      this.bc.postMessage({ type: 'TAKEOVER', payload: {}, senderId: this.deviceId });
    }
    
    // 2. Remote sync
    const user = this.authService.currentUser();
    const activeDevice = this.availableDevices().find(d => !d.isActive && d.deviceId !== this.deviceId); 
    // Wait, the logic is: tell everyone I am taking over
    if (user && user.email && this.socket && this.socket.connected) {
      this.socket.emit('takeover_device', {
        email: user.email,
        fromDeviceId: this.deviceId, // well it's to everyone
        toDeviceId: this.deviceId
      });
    }
  }
}
