import { Component, Output, EventEmitter, inject, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService, RoomInfo } from '../../../services/room.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { LucideX, LucideKey, LucideRadio, LucideUsers, LucideMusic, LucideSearch, LucideArrowLeftRight } from '@lucide/angular';

@Component({
  selector: 'app-room-switch-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideX, LucideKey, LucideRadio, LucideUsers, LucideMusic, LucideSearch, LucideArrowLeftRight],
  templateUrl: './room-switch-modal.component.html',
  styleUrls: ['./room-switch-modal.component.scss']
})
export class RoomSwitchModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  public roomService = inject(RoomService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'code' | 'public' = 'public';
  roomCode = '';
  searchQuery = '';
  error = '';
  isSwitching = false;

  private errorHandler: ((err: string) => void) | null = null;
  private stateHandler: ((state: any) => void) | null = null;
  private refreshInterval: any;

  currentRoomId: string | null = null;

  filteredRooms = signal<RoomInfo[]>([]);

  ngOnInit() {
    const info = this.roomService.currentRoomInfo();
    this.currentRoomId = info?.roomId || null;

    this.errorHandler = (err: string) => {
      this.error = err;
      this.isSwitching = false;
      this.cdr.detectChanges();
    };
    this.stateHandler = (state: any) => {
      this.isSwitching = false;
      this.close.emit();
      this.router.navigate(['/rooms', state.roomId]);
    };

    this.roomService.getSocket().on('room:error', this.errorHandler);
    this.roomService.getSocket().on('room:state', this.stateHandler);

    // Load public rooms (excluding the current one)
    this.refreshRooms();
    this.refreshInterval = setInterval(() => this.refreshRooms(), 30000);
  }

  ngOnDestroy() {
    if (this.errorHandler) this.roomService.getSocket().off('room:error', this.errorHandler);
    if (this.stateHandler) this.roomService.getSocket().off('room:state', this.stateHandler);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  refreshRooms() {
    this.roomService.getSocket().once('room:discover_results', (rooms: RoomInfo[]) => {
      this.filteredRooms.set((rooms || []).filter(r => r.roomId !== this.currentRoomId));
      this.cdr.detectChanges();
    });
    this.roomService.discoverRooms();
  }

  onSearchChange() {
    const q = this.searchQuery.trim().toLowerCase();
    this.roomService.getSocket().once('room:discover_results', (rooms: RoomInfo[]) => {
      const list = (rooms || []).filter(r => r.roomId !== this.currentRoomId);
      this.filteredRooms.set(
        q
          ? list.filter(r =>
              (r.name || '').toLowerCase().includes(q) ||
              (r.adminName || '').toLowerCase().includes(q) ||
              (r.roomId || '').toLowerCase().includes(q)
            )
          : list
      );
      this.cdr.detectChanges();
    });
    this.roomService.discoverRooms();
  }

  switchToRoom(roomId: string) {
    if (this.isSwitching) return;
    this.leaveAndJoin(roomId, null);
  }

  switchByCode() {
    if (!this.roomCode.trim() || this.isSwitching) return;
    this.error = '';
    const code = this.roomCode.trim().toUpperCase();
    this.leaveAndJoin(code, code);
  }

  private leaveAndJoin(roomId: string, joinCode: string | null) {
    this.isSwitching = true;
    this.error = 'Leaving current room...';
    this.cdr.detectChanges();

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

    if (!user) {
      this.isSwitching = false;
      this.error = 'Please login or set a guest name first.';
      this.cdr.detectChanges();
      return;
    }

    // Leave the current room, then join the new one
    this.roomService.leaveRoom();
    setTimeout(() => {
      this.error = 'Joining room...';
      this.cdr.detectChanges();
      this.roomService.joinRoom(roomId, joinCode, user);
    }, 300);
  }

  closeModal() {
    this.close.emit();
  }
}
