import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomService, RoomMember } from '../../../services/room.service';
import { LucideX, LucideUser, LucideCrown, LucideMoreVertical } from '@lucide/angular';

@Component({
  selector: 'app-room-members-panel',
  standalone: true,
  imports: [CommonModule, LucideX, LucideUser, LucideCrown, LucideMoreVertical],
  templateUrl: './room-members-panel.component.html',
  styleUrls: ['./room-members-panel.component.scss']
})
export class RoomMembersPanelComponent {
  @Output() close = new EventEmitter<void>();
  
  public roomService = inject(RoomService);
  
  activeMenuSocketId: string | null = null;

  closePanel() {
    this.close.emit();
  }

  toggleMenu(socketId: string, event: Event) {
    event.stopPropagation();
    if (this.activeMenuSocketId === socketId) {
      this.activeMenuSocketId = null;
    } else {
      this.activeMenuSocketId = socketId;
    }
  }

  makeAdmin(targetSocketId: string) {
    this.roomService.transferAdmin(targetSocketId);
    this.activeMenuSocketId = null;
  }
}
