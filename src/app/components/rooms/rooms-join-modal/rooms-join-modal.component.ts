import { Component, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../../services/room.service';
import { AuthService } from '../../../services/auth.service';
import { LucideX, LucideKey } from '@lucide/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rooms-join-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideX, LucideKey],
  templateUrl: './rooms-join-modal.component.html',
  styleUrls: ['./rooms-join-modal.component.scss']
})
export class RoomsJoinModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  
  private roomService = inject(RoomService);
  private authService = inject(AuthService);
  private router = inject(Router);

  roomCode = '';
  error = '';
  
  private errorHandler: ((err: string) => void) | null = null;
  private stateHandler: ((state: any) => void) | null = null;

  ngOnInit() {
    this.errorHandler = (err: string) => {
      this.error = err;
    };
    this.stateHandler = (state: any) => {
      this.closeModal();
      this.router.navigate(['/rooms', state.roomId]);
    };
    
    this.roomService.getSocket().on('room:error', this.errorHandler);
    this.roomService.getSocket().on('room:state', this.stateHandler);
  }

  ngOnDestroy() {
    if (this.errorHandler) this.roomService.getSocket().off('room:error', this.errorHandler);
    if (this.stateHandler) this.roomService.getSocket().off('room:state', this.stateHandler);
  }

  joinRoom() {
    if (!this.roomCode.trim()) return;
    this.error = '';
    
    const user = this.authService.currentUser();
    if (!user) return;
    
    const code = this.roomCode.trim().toUpperCase();
    this.roomService.joinRoom(code, code, user);
  }

  closeModal() {
    this.close.emit();
  }
}
