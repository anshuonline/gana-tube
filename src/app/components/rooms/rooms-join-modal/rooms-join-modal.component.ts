import { Component, Output, EventEmitter, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  roomCode = '';
  error = '';
  
  private errorHandler: ((err: string) => void) | null = null;
  private stateHandler: ((state: any) => void) | null = null;

  ngOnInit() {
    this.errorHandler = (err: string) => {
      this.error = err;
      this.cdr.detectChanges();
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
    
    let user: any = this.authService.currentUser();
    if (!user && typeof localStorage !== 'undefined') {
      const guestName = localStorage.getItem('gt_guest_name');
      if (guestName) {
        user = {
          uid: `guest-${localStorage.getItem('gt_guest_id') || Math.random().toString(36).substring(2, 10)}`,
          displayName: guestName,
          photoURL: null
        } as any;
      }
    }

    if (!user) return;
    
    const code = this.roomCode.trim().toUpperCase();
    this.roomService.joinRoom(code, code, user);
  }

  closeModal() {
    this.close.emit();
  }
}
