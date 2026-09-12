import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RoomService, RoomInfo } from '../../../services/room.service';
import { PlayerService } from '../../../services/player.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { RoomsCreateModalComponent } from '../rooms-create-modal/rooms-create-modal.component';
import { RoomsJoinModalComponent } from '../rooms-join-modal/rooms-join-modal.component';
import { 
  LucideRadio, 
  LucideLock, 
  LucidePlus, 
  LucideMusic, 
  LucideUsers 
} from '@lucide/angular';

import { GuestNameModalComponent } from '../guest-name-modal/guest-name-modal.component';

@Component({
  selector: 'app-rooms-discover',
  standalone: true,
  imports: [
    CommonModule, 
    LucideRadio, 
    LucideLock, 
    LucidePlus, 
    LucideMusic, 
    LucideUsers,
    RoomsCreateModalComponent,
    RoomsJoinModalComponent,
    GuestNameModalComponent
  ],
  templateUrl: './rooms-discover.component.html',
  styleUrls: ['./rooms-discover.component.scss']
})
export class RoomsDiscoverComponent implements OnInit, OnDestroy {
  public roomService = inject(RoomService);
  public playerService = inject(PlayerService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  
  showCreateModal = false;
  showJoinModal = false;
  showGuestModal = false;
  
  pendingAction: 'create' | 'join_private' | 'join_public' | null = null;
  pendingRoomId: string | null = null;
  
  private refreshInterval: any;

  ngOnInit() {
    const info = this.roomService.currentRoomInfo();
    if (info) {
      this.router.navigate(['/rooms', info.roomId]);
      return;
    }
    this.roomService.discoverRooms();
    
    // Auto-refresh every 30s
    this.refreshInterval = setInterval(() => {
      this.roomService.discoverRooms();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  openCreateModal() {
    if (this.authService.currentUser() === null || this.authService.currentUser() === undefined) {
      if (!this.checkGuestNameAndProceed('create')) return;
    }
    this.showCreateModal = true;
  }

  openJoinModal() {
    if (this.authService.currentUser() === null || this.authService.currentUser() === undefined) {
      if (!this.checkGuestNameAndProceed('join_private')) return;
    }
    this.showJoinModal = true;
  }

  joinPublicRoom(roomId: string) {
    if (this.authService.currentUser() === null || this.authService.currentUser() === undefined) {
      if (!this.checkGuestNameAndProceed('join_public', roomId)) return;
    }
    
    this.executeJoinPublicRoom(roomId);
  }
  
  private checkGuestNameAndProceed(action: 'create' | 'join_private' | 'join_public', roomId: string | null = null): boolean {
    if (typeof localStorage !== 'undefined') {
      const guestName = localStorage.getItem('gt_guest_name');
      if (guestName) {
        return true;
      }
    }
    
    this.pendingAction = action;
    this.pendingRoomId = roomId;
    this.showGuestModal = true;
    return false;
  }
  
  onGuestNameConfirmed(name: string) {
    this.showGuestModal = false;
    
    if (this.pendingAction === 'create') {
      this.showCreateModal = true;
    } else if (this.pendingAction === 'join_private') {
      this.showJoinModal = true;
    } else if (this.pendingAction === 'join_public' && this.pendingRoomId) {
      this.executeJoinPublicRoom(this.pendingRoomId);
    }
    
    this.pendingAction = null;
    this.pendingRoomId = null;
  }
  
  private executeJoinPublicRoom(roomId: string) {
    let user: any = this.authService.currentUser();
    if (!user && typeof localStorage !== 'undefined') {
      user = {
        uid: `guest-${localStorage.getItem('gt_guest_id') || Math.random().toString(36).substring(2, 10)}`,
        displayName: localStorage.getItem('gt_guest_name'),
        photoURL: null
      } as any;
      if (!localStorage.getItem('gt_guest_id')) {
        localStorage.setItem('gt_guest_id', user.uid.replace('guest-', ''));
      }
    }
    
    if (user) {
      this.roomService.getSocket().once('room:state', (state: any) => {
        if (state.roomId === roomId) {
          this.router.navigate(['/rooms', state.roomId]);
        }
      });
      this.roomService.joinRoom(roomId, null, user);
    }
  }
}
