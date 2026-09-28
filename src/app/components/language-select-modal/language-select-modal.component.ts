import { Component, Output, EventEmitter, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LanguageOption {
  code: string;
  native: string;
  subtitle: string;
  badge?: string;
  isPopular?: boolean;
}

@Component({
  selector: 'app-language-select-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-select-modal.component.html',
  styleUrls: ['./language-select-modal.component.scss']
})
export class LanguageSelectModalComponent implements OnInit {
  @Input() currentLanguage = 'Hindi';
  @Input() initialSelectedLanguages: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() select = new EventEmitter<string>();
  @Output() saveLanguages = new EventEmitter<{ selected: string[]; active: string }>();

  selectedLanguages = signal<string[]>([]);
  activeLanguage = signal<string>('Hindi');

  languages: LanguageOption[] = [
    { code: 'Hindi', native: 'हिन्दी', subtitle: 'Bollywood & Indie Pop', badge: 'Most Popular', isPopular: true },
    { code: 'English', native: 'English', subtitle: 'Global & Pop Hits', badge: 'Global', isPopular: true },
    { code: 'Punjabi', native: 'ਪੰਜਾਬੀ', subtitle: 'Bhangra & Pop Beats', badge: 'Trending', isPopular: true },
    { code: 'Bhojpuri', native: 'भोजपुरी', subtitle: 'Viral Dance & Folk', badge: 'Trending', isPopular: true },
    { code: 'Haryanvi', native: 'हरियाणवी', subtitle: 'Desi Ragni & Beats', badge: 'Popular', isPopular: true },
    { code: 'Bengali', native: 'বাংলা', subtitle: 'Rabindra & Modern Melodies', isPopular: true },
    { code: 'Tamil', native: 'தமிழ்', subtitle: 'Kollywood & Melodies', badge: 'Popular', isPopular: true },
    { code: 'Telugu', native: 'తెలుగు', subtitle: 'Tollywood Mass & Hits', badge: 'Trending', isPopular: true },
    { code: 'Malayalam', native: 'മലയാളം', subtitle: 'Mollywood & Soulful Tunes' },
    { code: 'Kannada', native: 'ಕನ್ನಡ', subtitle: 'Sandalwood & Grooves' },
    { code: 'Marathi', native: 'मराठी', subtitle: 'Natya, Lavani & Beats' },
    { code: 'Gujarati', native: 'ગુજરાતી', subtitle: 'Garba, Folk & Pop' }
  ];

  ngOnInit(): void {
    let initial: string[] = [];
    if (this.initialSelectedLanguages && this.initialSelectedLanguages.length > 0) {
      initial = [...this.initialSelectedLanguages];
    } else if (this.currentLanguage) {
      initial = [this.currentLanguage];
    } else {
      initial = ['Hindi', 'English', 'Punjabi'];
    }

    this.selectedLanguages.set(initial);
    this.activeLanguage.set(this.currentLanguage || initial[0] || 'Hindi');
  }

  isSelected(code: string): boolean {
    return this.selectedLanguages().includes(code);
  }

  toggleLanguage(code: string): void {
    const current = this.selectedLanguages();
    if (current.includes(code)) {
      if (current.length > 1) {
        this.selectedLanguages.set(current.filter(l => l !== code));
        if (this.activeLanguage() === code) {
          const remaining = this.selectedLanguages();
          if (remaining.length > 0) {
            this.activeLanguage.set(remaining[0]);
          }
        }
      }
    } else {
      this.selectedLanguages.set([...current, code]);
    }
  }

  selectAll(): void {
    this.selectedLanguages.set(this.languages.map(l => l.code));
  }

  resetToDefaults(): void {
    this.selectedLanguages.set(['Hindi', 'English', 'Punjabi']);
    this.activeLanguage.set('Hindi');
  }

  closeModal(): void {
    this.close.emit();
  }

  confirmAndListen(): void {
    const selected = this.selectedLanguages();
    if (selected.length === 0) return;

    let active = this.activeLanguage();
    if (!selected.includes(active)) {
      active = selected[0];
    }

    // Emit single language for backwards compatibility
    this.select.emit(active);

    // Emit full multi-language payload
    this.saveLanguages.emit({
      selected: selected,
      active: active
    });
  }
}
