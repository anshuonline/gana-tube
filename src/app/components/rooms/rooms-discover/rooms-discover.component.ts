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
    RoomsJoinModalComponent
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
  
  private refreshInterval: any;

  ngOnInit() {
    const info = this.roomService.currentRoomInfo();
    if (info) {
      this.router.navigate(['/rooms', info.roomId]);
      return;
    }
    this.refreshRooms();
    this.refreshInterval = setInterval(() => this.refreshRooms(), 10000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  refreshRooms() {
    this.roomService.discoverRooms();
  }

  openCreateModal() {
    if (this.authService.currentUser() === null || this.authService.currentUser() === undefined) {
      this.toastService.show('Please log in to create a room.', 'info');
      return;
    }
    this.showCreateModal = true;
  }

  openJoinModal() {
    if (this.authService.currentUser() === null || this.authService.currentUser() === undefined) {
      this.toastService.show('Please log in to join a private room.', 'info');
      return;
    }
    this.showJoinModal = true;
  }

  joinPublicRoom(roomId: string) {
    if (this.authService.currentUser() === null || this.authService.currentUser() === undefined) {
      this.toastService.show('Please log in to join a room.', 'info');
      return;
    }
    
    const user = this.authService.currentUser();
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
