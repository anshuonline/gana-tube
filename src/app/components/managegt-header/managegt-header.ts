import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

export interface HeroSlide {
  badge: string;       // e.g. "TRENDING PLAYLIST"
  title: string;       // e.g. "Bollywood Blockbusters"
  subtitle: string;    // e.g. "DIVE INTO THE MOST TRENDING..."
  imageUrl: string;    // URL of the right-side hero image
  buttonText: string;  // e.g. "EXPLORE PLAYLIST"
  buttonLink: string;  // e.g. "/playlist/latest"
}

@Component({
  selector: 'app-managegt-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './managegt-header.html',
  styleUrls: ['./managegt-header.scss']
})
export class ManagegtHeaderComponent implements OnInit {
  languages = ['Hindi', 'English', 'Punjabi', 'Tamil', 'Telugu', 'Bengali', 'Bhojpuri', 'Haryanvi'];
  selectedLanguage = 'Hindi';

  // All language header data
  allHeaderData: Record<string, HeroSlide> = {};

  // Current form fields
  form: HeroSlide = {
    badge: 'TRENDING PLAYLIST',
    title: '',
    subtitle: '',
    imageUrl: '',
    buttonText: 'EXPLORE PLAYLIST',
    buttonLink: ''
  };

  isUploadingImage = false;

  isSaving = false;
  isLoading = false;
  saveMessage = '';
  saveError = '';

  apiUrl = window.location.origin.includes('localhost') ? 'http://localhost/manageads/managegt-api.php' : 'https://manageads.ganatube.in/managegt-api.php';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchHeaderData();
  }

  async fetchHeaderData() {
    this.isLoading = true;
    try {
      const cacheBuster = Date.now();
      const data = await firstValueFrom(
        this.http.get<Record<string, HeroSlide>>(`${this.apiUrl}?action=get_header&t=${cacheBuster}`).pipe(
          timeout(6000),
          catchError(() => of({} as Record<string, HeroSlide>))
        )
      );
      this.allHeaderData = data || {};
      this.loadLanguage(this.selectedLanguage);
    } catch (e) {
      console.warn('Failed to load header data, using defaults', e);
      this.loadDefaults(this.selectedLanguage);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onLanguageChange() {
    // Save current form to allHeaderData before switching
    this.allHeaderData[this.selectedLanguage] = { ...this.form };
    this.loadLanguage(this.selectedLanguage);
  }

  selectLanguage(lang: string) {
    // Save current tab before switching
    this.allHeaderData[this.selectedLanguage] = { ...this.form };
    this.selectedLanguage = lang;
    this.loadLanguage(lang);
    this.saveMessage = '';
    this.saveError = '';
  }

  loadLanguage(lang: string) {
    if (this.allHeaderData[lang]) {
      this.form = { ...this.allHeaderData[lang] };
    } else {
      this.loadDefaults(lang);
    }
  }

  loadDefaults(lang: string) {
    const defaults: Record<string, Partial<HeroSlide>> = {
      'Hindi':    { title: 'Bollywood Blockbusters', subtitle: 'DIVE INTO THE MOST TRENDING HINDI MELODIES AND CLUB ANTHEMS', imageUrl: 'images/hindi-singers.png', buttonLink: '' },
      'English':  { title: 'Global Essentials', subtitle: 'EXPERIENCE THE BIGGEST INTERNATIONAL TRACKS STREAMING RIGHT NOW', imageUrl: 'images/english-singers.png', buttonLink: '' },
      'Punjabi':  { title: 'Punjabi Powerhouse', subtitle: 'HIGH-ENERGY BEATS AND VOCALS THAT RULE THE CHARTS WORLDWIDE', imageUrl: 'images/punjabi-singers.png', buttonLink: '' },
      'Tamil':    { title: 'Kollywood Supreme', subtitle: 'DISCOVER TOP CHARTING TAMIL COMPOSITIONS AND BLOCKBUSTER HITS', imageUrl: 'images/tamil-singers.png', buttonLink: '' },
      'Telugu':   { title: 'Tollywood Hits', subtitle: 'THE BIGGEST AND BEST TELUGU SONGS TRENDING ACROSS THE NATION', imageUrl: 'images/hindi-singers.png', buttonLink: '' },
      'Bengali':  { title: 'Soulful Bengali', subtitle: 'IMMERSE YOURSELF IN THE RICH MUSICAL HERITAGE OF BENGAL', imageUrl: 'images/bengali-singers.png', buttonLink: '' },
      'Bhojpuri': { title: 'Bhojpuri Chartbusters', subtitle: 'FEEL THE PULSE WITH THE MOST VIRAL BHOJPURI DANCE NUMBERS', imageUrl: 'images/bhojpuri-singers.png', buttonLink: '' },
      'Haryanvi': { title: 'Haryanvi Dominance', subtitle: 'UNSTOPPABLE GROOVES AND REGIONAL HITS TAKING OVER THE NATION', imageUrl: 'images/haryanvi-singers.png', buttonLink: '' },
    };
    this.form = {
      badge: 'TRENDING PLAYLIST',
      buttonText: 'EXPLORE PLAYLIST',
      buttonLink: defaults[lang]?.buttonLink || '',
      title: defaults[lang]?.title || `${lang} Essentials`,
      subtitle: defaults[lang]?.subtitle || `DISCOVER THE LATEST AND GREATEST ${lang.toUpperCase()} HITS`,
      imageUrl: defaults[lang]?.imageUrl || 'images/hindi-singers.png',
    };
  }

  async uploadImage(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.isUploadingImage = true;
    this.saveError = '';
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}?action=upload_image`, formData)
      );
      if (res?.status === 'success' && res.imageUrl) {
        this.form.imageUrl = res.imageUrl;
      } else {
        throw new Error(res?.message || 'Unknown error during upload');
      }
    } catch (e: any) {
      this.saveError = '❌ Failed to upload image: ' + (e.message || 'Unknown error');
    } finally {
      this.isUploadingImage = false;
      // Reset file input so same file can be selected again if needed
      event.target.value = '';
    }
  }

  async save() {
    this.saveMessage = '';
    this.saveError = '';
    // Persist current form to allHeaderData
    this.allHeaderData[this.selectedLanguage] = { ...this.form };
    this.isSaving = true;

    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}?action=save_header`, {
          headerData: this.allHeaderData
        }, {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        })
      );
      if (res?.status === 'success') {
        this.saveMessage = '✅ Header updated successfully! Changes are live.';
      } else {
        throw new Error(res?.message || 'Unknown error');
      }
    } catch (e: any) {
      this.saveError = '❌ Failed to save: ' + (e.message || 'Unknown error');
    }

    this.isSaving = false;
    setTimeout(() => { this.saveMessage = ''; }, 4000);
  }

  resetToDefault() {
    this.loadDefaults(this.selectedLanguage);
  }
}
