import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../../services/room.service';
import { AuthService } from '../../../services/auth.service';
import { LucideX, LucideGlobe, LucideLock } from '@lucide/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rooms-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideX, LucideGlobe, LucideLock],
  templateUrl: './rooms-create-modal.component.html',
  styleUrls: ['./rooms-create-modal.component.scss']
})
export class RoomsCreateModalComponent {
  @Output() close = new EventEmitter<void>();
  
  private roomService = inject(RoomService);
  private authService = inject(AuthService);
  private router = inject(Router);

  roomName = '';
  isPublic = true;

  constructor() {
    const user = this.authService.currentUser();
    if (user) {
      this.roomName = `${user.displayName}'s Room`;
    }
  }

  createRoom() {
    if (!this.roomName.trim()) return;
    
    const user = this.authService.currentUser();
    if (!user) return;
    
    this.roomService.createRoom(this.roomName, this.isPublic, user);
    
    // Listen for room state once to get the created room id
    const sub = this.roomService.getSocket().once('room:state', (state: any) => {
      this.closeModal();
      this.router.navigate(['/rooms', state.roomId]);
    });
  }

  closeModal() {
    this.close.emit();
  }
}
