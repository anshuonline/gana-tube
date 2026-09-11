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

  roomId = '';
  joinCode = '';
  error = '';
  
  private errorSub: any;
  private stateSub: any;

  ngOnInit() {
    this.errorSub = this.roomService.getSocket().on('room:error', (err: string) => {
      this.error = err;
    });
    
    this.stateSub = this.roomService.getSocket().on('room:state', (state: any) => {
      this.closeModal();
      this.router.navigate(['/rooms', state.roomId]);
    });
  }

  ngOnDestroy() {
    if (this.errorSub) this.roomService.getSocket().off('room:error', this.errorSub);
    if (this.stateSub) this.roomService.getSocket().off('room:state', this.stateSub);
  }

  joinRoom() {
    if (!this.roomId.trim() || !this.joinCode.trim()) return;
    this.error = '';
    
    const user = this.authService.currentUser();
    if (!user) return;
    
    this.roomService.joinRoom(this.roomId.trim().toUpperCase(), this.joinCode.trim(), user);
  }

  closeModal() {
    this.close.emit();
  }
}
