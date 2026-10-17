import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  LucideShield,
  LucideShieldAlert,
  LucideShieldCheck,
  LucideBan,
  LucideSearch,
  LucidePlus,
  LucideTrash2,
  LucideCheck,
  LucideX,
  LucideArrowLeft,
  LucideExternalLink,
  LucideCopy,
  LucideMusic,
  LucideFilter,
  LucideRefreshCw,
  LucideAlertTriangle,
  LucideDownload,
  LucideUpload,
  LucideSlidersHorizontal,
  LucideInfo,
  LucideFlame,
  LucideLock
} from '@lucide/angular';
import { YoutubeApiService, YouTubeSearchResult, getHighResThumbnail } from '../../services/youtube-api.service';
import { ContentFilterService, BlockedItem } from '../../services/content-filter.service';
import { ToastService } from '../../services/toast.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-content-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideShield,
    LucideShieldAlert,
    LucideShieldCheck,
    LucideBan,
    LucideSearch,
    LucidePlus,
    LucideTrash2,
    LucideCheck,
    LucideX,
    LucideArrowLeft,
    LucideExternalLink,
    LucideCopy,
    LucideMusic,
    LucideFilter,
    LucideRefreshCw,
    LucideAlertTriangle,
    LucideDownload,
    LucideUpload,
    LucideSlidersHorizontal,
    LucideInfo,
    LucideFlame,
    LucideLock
  ],
  templateUrl: './content-filter.component.html',
  styleUrls: ['./content-filter.component.scss']
})
export class ContentFilterComponent implements OnInit {
  private youtubeApi = inject(YoutubeApiService);
  public contentFilter = inject(ContentFilterService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);

  // GTAnalytics-style Master Password Authentication
  isAuthenticated = signal<boolean>(false);
  adminPassword = signal<string>('');
  isVerifying = signal<boolean>(false);
  authError = signal<string>('');

  // Active view tab for adding items: 'search' | 'direct' | 'keyword'
  activeAddTab = signal<'search' | 'direct' | 'keyword'>('search');

  // Search & Select state (Priority #1: YTMusic API)
  searchQuery = signal<string>('');
  isSearching = signal<boolean>(false);
  searchResults = signal<YouTubeSearchResult[]>([]);
  hasSearched = signal<boolean>(false);

  // Common block reasons
  blockReasons = [
    'Inappropriate / Explicit Content',
    'Copyright / Distasteful Track',
    'Poor Audio Quality / Distortion',
    'Wrong Match / False Metadata',
    'Custom Administrative Block'
  ];
  selectedReason = signal<string>('Inappropriate / Explicit Content');
  customReasonText = signal<string>('');

  // Direct ID / URL form state
  directInput = signal<string>('');
  directTitle = signal<string>('');
  directArtist = signal<string>('');

  // Keyword / Artist form state
  keywordInput = signal<string>('');
  keywordType = signal<'title_contains' | 'artist_match'>('title_contains');

  // Blocklist Table Filter & Search state
  blocklistQuery = signal<string>('');
  blocklistFilterType = signal<'all' | 'exact_id' | 'title_contains' | 'artist_match'>('all');
  showClearModal = signal<boolean>(false);
  copiedId = signal<string | null>(null);

  // Computed filtered list
  filteredBlocklist = computed(() => {
    const list = this.contentFilter.blockedItems();
    const q = this.blocklistQuery().toLowerCase().trim();
    const type = this.blocklistFilterType();

    return list.filter(item => {
      // Type filter
      if (type !== 'all' && item.matchType !== type) {
        return false;
      }
      // Query filter
      if (q) {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const artistMatch = (item.artist || '').toLowerCase().includes(q);
        const videoIdMatch = (item.videoId || '').toLowerCase().includes(q);
        const reasonMatch = (item.reason || '').toLowerCase().includes(q);
        return titleMatch || artistMatch || videoIdMatch || reasonMatch;
      }
      return true;
    });
  });

  // KPI Metrics
  totalBlockedCount = computed(() => this.contentFilter.blockedItems().length);
  exactIdCount = computed(() => this.contentFilter.blockedItems().filter(i => i.matchType === 'exact_id' || i.videoId).length);
  keywordCount = computed(() => this.contentFilter.blockedItems().filter(i => i.matchType === 'title_contains' || i.matchType === 'artist_match').length);

  ngOnInit(): void {
    // Check for existing admin authentication (GTAnalytics master password or ManageGT token)
    const hasSessionPwd = typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('gtanalytic_pwd');
    const hasManageToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('managegt_token');

    if (hasSessionPwd || hasManageToken) {
      this.isAuthenticated.set(true);
    } else {
      this.isAuthenticated.set(false);
    }

    // Scroll to top
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ── Authentication (GTAnalytics Master Password Style - No Username Needed) ──
  unlockWithPassword(): void {
    const pwd = this.adminPassword().trim();
    if (!pwd) return;

    this.isVerifying.set(true);
    this.authError.set('');

    this.analyticsService.getAnalytics(pwd, 'all_time').subscribe({
      next: (res) => {
        this.isVerifying.set(false);
        if (res.status === 'success') {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('gtanalytic_pwd', pwd);
          }
          this.isAuthenticated.set(true);
          this.adminPassword.set('');
          this.toastService.show('Content filter panel unlocked', 'success');
        } else {
          this.authError.set(res.message || 'Invalid master password');
        }
      },
      error: () => {
        this.isVerifying.set(false);
        this.authError.set('Failed to verify password with server');
      }
    });
  }

  lockPanel(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('gtanalytic_pwd');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('managegt_token');
    }
    this.isAuthenticated.set(false);
    this.adminPassword.set('');
    this.toastService.show('Content filter panel locked', 'info');
  }

  // ── Navigation ──
  navigateToMusic(): void {
    this.router.navigate(['/home']);
  }

  // ── Search & Select (Strict Priority #1: YTMusic API) ──
  onSearchSubmit(): void {
    const q = this.searchQuery().trim();
    if (!q) return;

    this.isSearching.set(true);
    this.hasSearched.set(true);
    this.searchResults.set([]);

    // Using official YTMusic API via youtubeApi
    this.youtubeApi.searchMusic(q, 16, 'song').subscribe({
      next: (songs) => {
        this.searchResults.set(songs || []);
        this.isSearching.set(false);
      },
      error: (err) => {
        console.warn('Search failed:', err);
        this.searchResults.set([]);
        this.isSearching.set(false);
        this.toastService.show('Failed to search songs. Please try again.', 'error');
      }
    });
  }

  getEffectiveReason(): string {
    if (this.selectedReason() === 'Custom Administrative Block') {
      return this.customReasonText().trim() || 'Custom Administrative Block';
    }
    return this.selectedReason();
  }

  blockSearchResult(track: YouTubeSearchResult): void {
    if (!track) return;
    const reason = this.getEffectiveReason();

    this.contentFilter.blockSong(
      {
        videoId: track.videoId,
        title: track.title,
        artist: track.channelTitle || track.artist,
        thumbnail: track.thumbnailHigh || track.thumbnail
      },
      reason,
      'exact_id'
    ).subscribe();
  }

  isSongBlocked(videoId: string): boolean {
    return this.contentFilter.isBlockedVideoId(videoId);
  }

  // ── Direct Video ID or YouTube URL ──
  blockDirectSubmit(): void {
    const raw = this.directInput().trim();
    if (!raw) {
      this.toastService.show('Please enter a YouTube URL or 11-character Video ID', 'error');
      return;
    }

    // Extract Video ID
    let videoId = raw;
    const urlMatch = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (urlMatch && urlMatch[1]) {
      videoId = urlMatch[1];
    } else if (raw.length === 11 && !raw.includes('/')) {
      videoId = raw;
    }

    const title = this.directTitle().trim() || `YouTube Video (${videoId})`;
    const artist = this.directArtist().trim() || 'Direct Block';
    const reason = this.getEffectiveReason();

    this.contentFilter.blockSong(
      {
        videoId: videoId,
        title: title,
        artist: artist,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      },
      reason,
      'exact_id'
    ).subscribe(success => {
      if (success) {
        this.directInput.set('');
        this.directTitle.set('');
        this.directArtist.set('');
      }
    });
  }

  // ── Keyword / Artist Match ──
  blockKeywordSubmit(): void {
    const kw = this.keywordInput().trim();
    if (!kw) {
      this.toastService.show('Please enter a keyword, artist name or phrase', 'error');
      return;
    }

    const type = this.keywordType();
    const reason = this.getEffectiveReason();

    this.contentFilter.blockSong(
      {
        videoId: '',
        title: kw,
        artist: type === 'artist_match' ? 'All songs by this artist' : 'Any title containing this phrase'
      },
      reason,
      type
    ).subscribe(success => {
      if (success) {
        this.keywordInput.set('');
      }
    });
  }

  // ── Unblock Item ──
  unblockItem(item: BlockedItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.contentFilter.unblockSong(item.id || item.videoId).subscribe();
  }

  // ── Bulk Clear ──
  confirmClearAll(): void {
    this.contentFilter.clearAll().subscribe(() => {
      this.showClearModal.set(false);
    });
  }

  // ── Copy ID ──
  copyVideoId(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (!id || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(id).then(() => {
      this.copiedId.set(id);
      this.toastService.show(`Copied "${id}" to clipboard`, 'info', 2000);
      setTimeout(() => {
        if (this.copiedId() === id) {
          this.copiedId.set(null);
        }
      }, 2000);
    });
  }

  // ── Export / Import ──
  exportBlocklist(): void {
    const json = this.contentFilter.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ganatube-blocked-content-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toastService.show('Blocklist exported successfully', 'success');
  }

  triggerImportFile(input: HTMLInputElement): void {
    input.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        this.contentFilter.importJson(content).subscribe();
      }
    };
    reader.readAsText(file);
    target.value = ''; // Reset input
  }

  formatDate(timestamp: number): string {
    if (!timestamp) return 'Just now';
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
