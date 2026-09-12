import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideX, LucideUser } from '@lucide/angular';

@Component({
  selector: 'app-guest-name-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideX, LucideUser],
  templateUrl: './guest-name-modal.component.html',
  styleUrls: ['./guest-name-modal.component.scss']
})
export class GuestNameModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();
  
  guestName = '';
  error = '';

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('gt_guest_name');
      if (saved) {
        this.guestName = saved;
      }
    }
  }

  closeModal() {
    this.close.emit();
  }

  submit() {
    const name = this.guestName.trim();
    if (!name) {
      this.error = 'Please enter a name.';
      return;
    }
    if (name.length < 3) {
      this.error = 'Name must be at least 3 characters.';
      return;
    }
    if (name.length > 20) {
      this.error = 'Name must be less than 20 characters.';
      return;
    }
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gt_guest_name', name);
    }
    this.confirm.emit(name);
  }
}
