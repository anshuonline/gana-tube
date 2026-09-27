import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { 
  LucidePlus, LucideX, LucideTrash2, LucideEdit3, LucideRefreshCw, 
  LucideCheck, LucideUpload, LucideImage, LucideStar, LucideClock, 
  LucideSparkles, LucideChevronDown, LucideChevronUp, LucideUsers 
} from '@lucide/angular';
import { FeedbackPopupConfig, DEFAULT_FEEDBACK_POPUP_CONFIG } from '../feedback-popup/feedback-popup.component';

interface PopupItem {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl: string;
  frequencyHours: number;
  isActive: boolean;
  customCode?: string;
}

@Component({
  selector: 'app-managegt-popups',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LucidePlus, LucideX, LucideTrash2, 
    LucideEdit3, LucideRefreshCw, LucideCheck, LucideUpload, 
    LucideImage, LucideStar, LucideClock, LucideSparkles, 
    LucideChevronDown, LucideChevronUp, LucideUsers
  ],
  templateUrl: './managegt-popups.html',
  styleUrls: ['./managegt-popups.scss']
})
export class ManagegtPopupsComponent implements OnInit {
  activeTab: 'feedback' | 'promo' = 'feedback';

  // --- Feedback Popup Config & State ---
  feedbackConfig: FeedbackPopupConfig = { ...DEFAULT_FEEDBACK_POPUP_CONFIG };
  showAdvancedSettings = false;
  previewRating = 5;

  // Preset Chips
  delayPresets = [15, 30, 40, 60, 90, 120];
  frequencyPresets = [
    { label: '24h (1 Day)', hours: 24 },
    { label: '72h (3 Days)', hours: 72 },
    { label: '168h (1 Week)', hours: 168 },
    { label: '720h (1 Month)', hours: 720 }
  ];
  cooldownPresets = [
    { label: '6h', hours: 6 },
    { label: '12h', hours: 12 },
    { label: '24h (1 Day)', hours: 24 },
    { label: '48h (2 Days)', hours: 48 },
    { label: '72h (3 Days)', hours: 72 }
  ];
  songPresets = [
    { label: '0 (Turant)', count: 0 },
    { label: '1 Song', count: 1 },
    { label: '2 Songs', count: 2 },
    { label: '3 Songs', count: 3 },
    { label: '5 Songs', count: 5 }
  ];

  // --- Promo Popups State ---
  popups: PopupItem[] = [];

  // Form state
  showForm = false;
  editingPopupId: string | null = null;
  popupName = '';
  popupImageUrl = '';
  popupLinkUrl = '';
  popupFrequencyHours = 5;
  popupActive = true;
  popupCustomCode = '';

  isUploading = false;
  isSaving = false;
  saveMessage = '';
  formError = '';

  apiUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') 
    ? 'http://localhost/manageads/managegt-api.php' 
    : 'https://manageads.ganatube.in/managegt-api.php';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchPopups();
  }

  async fetchPopups() {
    try {
      const cacheBuster = Date.now();
      const data: any = await firstValueFrom(this.http.get(`${this.apiUrl}?action=get_popups&t=${cacheBuster}`));
      
      const list = (data && data.popups) || (Array.isArray(data) ? data : []);
      this.popups = Array.isArray(list) ? list : [];

      if (data && data.feedbackPopup) {
        this.feedbackConfig = {
          ...DEFAULT_FEEDBACK_POPUP_CONFIG,
          ...data.feedbackPopup
        };
      }
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load popups', e);
      this.popups = [];
      this.cdr.detectChanges();
    }
  }

  // --- Feedback Popup Actions ---
  async toggleFeedbackEnabled() {
    this.feedbackConfig.enabled = !this.feedbackConfig.enabled;
    this.cdr.detectChanges();
    await this.persistPopups(
      this.feedbackConfig.enabled 
        ? 'Review popup enabled and active!' 
        : 'Review popup turned OFF.'
    );
  }

  setDelayPreset(sec: number) {
    this.feedbackConfig.delaySeconds = sec;
  }

  setFrequencyPreset(hrs: number) {
    this.feedbackConfig.frequencyHours = hrs;
  }

  setCooldownPreset(hrs: number) {
    this.feedbackConfig.dismissCooldownHours = hrs;
  }

  setSongPreset(count: number) {
    this.feedbackConfig.minSongsPlayed = count;
  }

  resetFeedbackDefaults() {
    if (confirm('Reset review popup settings to original defaults?')) {
      this.feedbackConfig = { ...DEFAULT_FEEDBACK_POPUP_CONFIG };
      this.cdr.detectChanges();
    }
  }

  async saveFeedbackSettings() {
    if (!this.feedbackConfig.title?.trim()) {
      this.formError = 'Please provide a popup title.';
      this.cdr.detectChanges();
      return;
    }
    await this.persistPopups('Review & Feedback popup settings saved successfully!');
  }

  startCreate() {
    this.showForm = true;
    this.editingPopupId = null;
    this.popupName = '';
    this.popupImageUrl = '';
    this.popupLinkUrl = '/rooms';
    this.popupFrequencyHours = 5;
    this.popupActive = true;
    this.popupCustomCode = '';
    this.formError = '';
  }

  startEdit(popup: PopupItem) {
    this.showForm = true;
    this.editingPopupId = popup.id;
    this.popupName = popup.name;
    this.popupImageUrl = popup.imageUrl;
    this.popupLinkUrl = popup.linkUrl;
    this.popupFrequencyHours = popup.frequencyHours > 0 ? popup.frequencyHours : 5;
    this.popupActive = popup.isActive;
    this.popupCustomCode = popup.customCode || '';
    this.formError = '';
  }

  async uploadImage(event: any) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    this.isUploading = true;
    this.formError = '';
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}?action=upload_image`, formData));
      if (res && res.status === 'success' && res.url) {
        this.popupImageUrl = res.url;
        this.saveMessage = 'Image uploaded!';
        setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 3000);
      } else {
        this.formError = res?.message || 'Image upload failed.';
      }
    } catch (e) {
      this.formError = 'Image upload failed. Check your connection.';
    }
    this.isUploading = false;
    event.target.value = '';
    this.cdr.detectChanges();
  }

  validateForm(): boolean {
    if (!this.popupName.trim()) {
      this.formError = 'Please enter a popup name.';
      return false;
    }
    if (!this.popupCustomCode.trim() && !this.popupImageUrl.trim()) {
      this.formError = 'Please provide an image link or upload an image.';
      return false;
    }
    if (!this.popupLinkUrl.trim()) {
      this.formError = 'Please provide a link URL (where users land on click).';
      return false;
    }
    if (!(this.popupFrequencyHours > 0)) {
      this.formError = 'Frequency must be at least 1 hour.';
      return false;
    }
    return true;
  }

  async savePopup() {
    this.formError = '';
    this.saveMessage = '';

    if (!this.validateForm()) {
      this.cdr.detectChanges();
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    const popupItem: PopupItem = {
      id: this.editingPopupId || ('popup_' + Date.now() + Math.floor(Math.random() * 1000)),
      name: this.popupName.trim(),
      imageUrl: this.popupImageUrl.trim(),
      linkUrl: this.popupLinkUrl.trim(),
      frequencyHours: this.popupFrequencyHours,
      isActive: this.popupActive,
      customCode: this.popupCustomCode.trim()
    };

    if (this.editingPopupId) {
      const idx = this.popups.findIndex(p => p.id === this.editingPopupId);
      if (idx > -1) {
        this.popups[idx] = popupItem;
      }
    } else {
      this.popups.unshift(popupItem);
    }

    await this.persistPopups();

    this.isSaving = false;
    this.cancelForm();
    this.cdr.detectChanges();
  }

  async togglePopupActive(popup: PopupItem) {
    popup.isActive = !popup.isActive;
    this.cdr.detectChanges();
    await this.persistPopups();
  }

  async deletePopup(id: string) {
    if (confirm('Are you sure you want to delete this popup?')) {
      this.popups = this.popups.filter(p => p.id !== id);
      await this.persistPopups();
    }
  }

  cancelForm() {
    this.showForm = false;
    this.editingPopupId = null;
    this.popupName = '';
    this.popupImageUrl = '';
    this.popupLinkUrl = '';
    this.popupFrequencyHours = 5;
    this.popupActive = true;
    this.popupCustomCode = '';
    this.formError = '';
  }

  private async persistPopups(customMsg?: string) {
    this.isSaving = true;
    this.saveMessage = '';
    this.formError = '';
    this.cdr.detectChanges();

    try {
      const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}?action=save_popups`, {
        popupsData: { 
          popups: this.popups,
          feedbackPopup: this.feedbackConfig
        }
      }, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }));

      if (res && res.status === 'success') {
        this.saveMessage = customMsg || 'Settings saved successfully!';
      } else {
        throw new Error(res?.message || 'Save failed');
      }
    } catch (e: any) {
      this.formError = 'Failed to save popups. ' + (e.message || '');
    }

    this.isSaving = false;
    setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 3500);
    this.cdr.detectChanges();
  }
}
