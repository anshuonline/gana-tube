import { Component, inject, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../services/room.service';
import { LucideUsers, LucideX, LucideCopy, LucideLogOut } from '@lucide/angular';

@Component({
  selector: 'app-listen-together',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideUsers, LucideX, LucideCopy, LucideLogOut],
  templateUrl: './listen-together.component.html',
  styleUrls: ['./listen-together.component.scss']
})
export class ListenTogetherComponent {
  @Output() close = new EventEmitter<void>();
  
  public roomService = inject(RoomService);
  
  nickname = '';
  roomIdInput = '';
  showToast = false;
  
  icons = [LucideUsers, LucideX, LucideCopy, LucideLogOut];

  createRoom() {
    if (!this.nickname.trim()) return;
    const newRoomId = this.roomService.generateRoomId();
    this.roomService.joinRoom(newRoomId, this.nickname.trim());
  }

  joinRoom() {
    if (!this.nickname.trim() || !this.roomIdInput.trim()) return;
    this.roomService.joinRoom(this.roomIdInput.trim().toUpperCase(), this.nickname.trim());
  }

  leaveRoom() {
    this.roomService.leaveRoom();
  }

  copyRoomId() {
    const roomId = this.roomService.currentRoom();
    if (roomId) {
      navigator.clipboard.writeText(roomId).then(() => {
        this.showToast = true;
        setTimeout(() => this.showToast = false, 3000);
      });
    }
  }
}
