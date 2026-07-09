import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close.emit()">
      <div class="confirm-modal" (click)="$event.stopPropagation()">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        
        <div class="modal-actions">
          <button class="btn-cancel" (click)="close.emit()">{{ cancelText }}</button>
          <button class="btn-confirm" (click)="confirm.emit()">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(5px);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    .confirm-modal {
      background: #000000;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      h3 {
        margin: 0 0 12px 0;
        color: #fff;
        font-size: 1.2rem;
      }

      p {
        margin: 0 0 24px 0;
        color: rgba(255,255,255,0.7);
        font-size: 0.95rem;
        line-height: 1.5;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;

      button {
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }

      .btn-cancel {
        background: transparent;
        color: #fff;
        &:hover { background: rgba(255,255,255,0.1); }
      }

      .btn-confirm {
        background: #f44336;
        color: #fff;
        &:hover { background: #d32f2f; }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Delete';
  @Input() cancelText = 'Cancel';
  
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen) this.close.emit();
  }
}
