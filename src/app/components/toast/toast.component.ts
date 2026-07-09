import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';
import { LucideCheckCircle, LucideXCircle, LucideInfo, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideCheckCircle, LucideXCircle, LucideInfo, LucideX],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
  toastService = inject(ToastService);
}
