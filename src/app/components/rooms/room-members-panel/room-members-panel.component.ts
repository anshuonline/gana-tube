import { Component, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService, RoomMember } from '../../../services/room.service';
import { LucideX, LucideUser, LucideCrown, LucideMoreVertical, LucideUserX, LucideSettings, LucideLogOut } from '@lucide/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-room-members-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideX, LucideUser, LucideCrown, LucideMoreVertical, LucideUserX, LucideSettings, LucideLogOut],
  templateUrl: './room-members-panel.component.html',
  styleUrls: ['./room-members-panel.component.scss']
})
export class RoomMembersPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  
  public roomService = inject(RoomService);
  private router = inject(Router);
  
  activeMenuSocketId: string | null = null;
  maxMembersInput: number = 10;
  
  ngOnInit() {
    this.maxMembersInput = this.roomService.currentRoomInfo()?.maxMembers || 10;
  }

  leaveRoom() {
    this.roomService.leaveRoom();
    this.closePanel();
    this.router.navigate(['/rooms']);
  }
  
  saveLimit() {
    if (this.maxMembersInput < 2) this.maxMembersInput = 2;
    if (this.maxMembersInput > 100) this.maxMembersInput = 100;
    this.roomService.updateRoomSettings(this.maxMembersInput);
  }

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

  kickMember(targetSocketId: string) {
    this.roomService.kickMember(targetSocketId);
    this.activeMenuSocketId = null;
  }
}
