import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideX, LucideCheck } from '@lucide/angular';

@Component({
  selector: 'app-language-select-modal',
  standalone: true,
  imports: [CommonModule, LucideX, LucideCheck],
  templateUrl: './language-select-modal.component.html',
  styleUrls: ['./language-select-modal.component.scss']
})
export class LanguageSelectModalComponent {
  @Input() currentLanguage = '';
  @Output() close = new EventEmitter<void>();
  @Output() select = new EventEmitter<string>();

  languages = [
    { code: 'English', native: 'English' },
    { code: 'Hindi', native: 'हिन्दी' },
    { code: 'Tamil', native: 'தமிழ்' },
    { code: 'Bengali', native: 'বাংলা' }
  ];

  closeModal(): void {
    this.close.emit();
  }

  choose(lang: string): void {
    this.select.emit(lang);
  }
}
