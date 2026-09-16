import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideX, LucideHeart, LucideGlobe, LucideListMusic } from '@lucide/angular';

@Component({
  selector: 'app-login-prompt-modal',
  standalone: true,
  imports: [CommonModule, LucideX, LucideHeart, LucideGlobe, LucideListMusic],
  templateUrl: './login-prompt-modal.component.html',
  styleUrls: ['./login-prompt-modal.component.scss']
})
export class LoginPromptModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() login = new EventEmitter<void>();
}
