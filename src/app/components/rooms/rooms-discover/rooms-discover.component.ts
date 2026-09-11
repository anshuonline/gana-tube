import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomService, RoomInfo } from '../../../services/room.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { 
  LucideRadio, 
  LucidePlus, 
  LucideUsers,
  LucideMusic,
  LucideLock
} from '@lucide/angular';
import { RoomsCreateModalComponent } from '../rooms-create-modal/rooms-create-modal.component';
import { RoomsJoinModalComponent } from '../rooms-join-modal/rooms-join-modal.component';

@Component({
  selector: 'app-rooms-discover',
  standalone: true,
  imports: [
    CommonModule, 
    LucideRadio, 
    LucidePlus, 
    LucideUsers, 
    LucideMusic,
    LucideLock,
    RoomsCreateModalComponent,
    RoomsJoinModalComponent
  ],
  templateUrl: './rooms-discover.component.html',
  styleUrls: ['./rooms-discover.component.scss']
})
export class RoomsDiscoverComponent implements OnInit, OnDestroy {
  public roomService = inject(RoomService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  
  showCreateModal = false;
  showJoinModal = false;
  
  private refreshInterval: any;

  ngOnInit() {
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
      this.roomService.joinRoom(roomId, null, user);
    }
  }
}
