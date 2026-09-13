import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideX, LucideRadio, LucideUsers, LucideMessageSquare, LucideMusic } from '@lucide/angular';
import { Router } from '@angular/router';

const DISMISS_KEY = 'gt_room_features_popup_dismissed';

@Component({
  selector: 'app-room-features-popup',
  standalone: true,
  imports: [CommonModule, LucideX, LucideRadio, LucideUsers, LucideMessageSquare, LucideMusic],
  templateUrl: './room-features-popup.component.html',
  styleUrls: ['./room-features-popup.component.scss']
})
export class RoomFeaturesPopupComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  visible = false;
  leaving = false;

  features = [
    { icon: 'users', title: 'Listen Together', text: 'Join live rooms and enjoy perfectly synced music with friends.' },
    { icon: 'radio', title: 'Always Live', text: 'Rooms are always buzzing — hop in anytime, music is already playing.' },
    { icon: 'chat', title: 'Live Chat & Requests', text: 'Chat with listeners and request songs for the host to play.' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // One-time popup: never show again once dismissed
    if (typeof localStorage !== 'undefined' && localStorage.getItem(DISMISS_KEY)) {
      return;
    }
    setTimeout(() => {
      this.visible = true;
    }, 5000);
  }

  exploreRooms(): void {
    this.dismiss();
    this.router.navigate(['/rooms']);
  }

  exploreLater(): void {
    this.dismiss();
  }

  private dismiss(): void {
    if (this.leaving) return;
    this.leaving = true;
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch (e) {}
    this.visible = false;
    this.closed.emit();
  }
}
