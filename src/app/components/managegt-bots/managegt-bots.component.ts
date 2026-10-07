import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { 
  LucideSparkles, 
  LucidePlay, 
  LucideCheck, 
  LucideTrash2, 
  LucideShuffle, 
  LucideRefreshCw, 
  LucidePlus, 
  LucideSearch,
  LucideLayers
} from '@lucide/angular';

export interface BotPlaylist {
  id: number;
  spotify_id: string;
  spotify_url: string;
  title: string;
  type: 'playlist' | 'album';
  language: string;
  cover_image: string;
  total_songs: number;
  songs: any[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface SpotifySource {
  url: string;
  name: string;
  defaultLang: string;
  type: 'playlist' | 'album';
  enabled: boolean;
}

export interface BotConfig {
  isFullyAuto: boolean;
  syncIntervalMinutes: number;
  maxSectionsPerLanguage: number;
  lastRunTime?: string;
  lastRunStatus?: string;
  targetSpotifySources: SpotifySource[];
}

@Component({
  selector: 'app-managegt-bots',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucideSparkles, 
    LucidePlay, 
    LucideCheck, 
    LucideTrash2, 
    LucideShuffle, 
    LucideRefreshCw, 
    LucidePlus, 
    LucideSearch,
    LucideLayers
  ],
  templateUrl: './managegt-bots.component.html',
  styleUrls: ['./managegt-bots.component.scss']
})
export class ManagegtBotsComponent implements OnInit {
  apiUrl = window.location.origin.includes('localhost') 
    ? 'http://localhost/manageads/managegt-api.php' 
    : 'https://manageads.ganatube.in/managegt-api.php';

  languages = ['Hindi', 'Punjabi', 'English', 'Bhojpuri', 'Haryanvi', 'Tamil', 'Telugu', 'Bengali'];
  
  activeTab = signal<'pending' | 'approved' | 'config' | 'logs'>('pending');
  
  isLoading = signal<boolean>(false);
  isRunningBot = signal<boolean>(false);
  
  playlists = signal<BotPlaylist[]>([]);
  selectedLangFilter = signal<string>('all');
  searchFilter = signal<string>('');

  config = signal<BotConfig>({
    isFullyAuto: false,
    syncIntervalMinutes: 10,
    maxSectionsPerLanguage: 15,
    targetSpotifySources: []
  });

  newSourceUrl = '';
  newSourceName = '';
  newSourceLang = 'Hindi';
  newSourceType: 'playlist' | 'album' = 'playlist';

  botRunLogs = signal<string[]>([]);
  toastMessage = signal<string>('');

  previewPlaylist: BotPlaylist | null = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadAll();
  }

  async loadAll() {
    this.isLoading.set(true);
    await Promise.all([
      this.fetchPlaylists(),
      this.fetchConfig()
    ]);
    this.isLoading.set(false);
  }

  async fetchPlaylists() {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}?action=get_bot_playlists&status=all&t=${Date.now()}`)
      );
      if (res && res.status === 'success') {
        this.playlists.set(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load bot playlists:', err);
    }
  }

  async fetchConfig() {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}?action=get_bot_config&t=${Date.now()}`)
      );
      if (res && res.status === 'success' && res.config) {
        this.config.set(res.config);
      }
    } catch (err) {
      console.error('Failed to load bot config:', err);
    }
  }

  get pendingList(): BotPlaylist[] {
    return this.filteredList.filter(p => p.status === 'pending');
  }

  get approvedList(): BotPlaylist[] {
    return this.filteredList.filter(p => p.status === 'approved');
  }

  get filteredList(): BotPlaylist[] {
    let list = this.playlists();
    const lang = this.selectedLangFilter();
    const query = this.searchFilter().toLowerCase().trim();

    if (lang !== 'all') {
      list = list.filter(p => p.language.toLowerCase() === lang.toLowerCase());
    }

    if (query) {
      list = list.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.spotify_id.toLowerCase().includes(query)
      );
    }

    return list;
  }

  get pendingCount(): number {
    return this.playlists().filter(p => p.status === 'pending').length;
  }

  get approvedCount(): number {
    return this.playlists().filter(p => p.status === 'approved').length;
  }

  async toggleFullyAuto() {
    const cur = this.config();
    cur.isFullyAuto = !cur.isFullyAuto;
    await this.saveConfig();
    this.showToast(`Fully Auto Mode is now ${cur.isFullyAuto ? 'ENABLED (Direct Publish)' : 'DISABLED (Manual Approval Required)'}`);
  }

  async saveConfig() {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}?action=save_bot_config`, { config: this.config() })
      );
      if (res && res.status === 'success') {
        this.showToast('Bot configuration saved!');
      }
    } catch (err) {
      console.error('Failed to save config:', err);
      this.showToast('Failed to save config');
    }
  }

  async approvePlaylist(pl: BotPlaylist) {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}?action=approve_bot_playlist`, {
          id: pl.id,
          language: pl.language,
          title: pl.title
        })
      );
      if (res && res.status === 'success') {
        pl.status = 'approved';
        this.showToast(`'${pl.title}' approved for ${pl.language}!`);
      }
    } catch (err) {
      console.error('Approve failed:', err);
      this.showToast('Failed to approve playlist');
    }
  }

  async rejectPlaylist(pl: BotPlaylist, mode: 'delete' | 'reject' = 'delete') {
    if (!confirm(`Are you sure you want to ${mode} '${pl.title}'?`)) return;
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}?action=reject_bot_playlist`, { id: pl.id, mode })
      );
      if (res && res.status === 'success') {
        this.playlists.set(this.playlists().filter(p => p.id !== pl.id));
        this.showToast(`Playlist ${mode}d`);
      }
    } catch (err) {
      console.error('Reject failed:', err);
    }
  }

  async shufflePlaylist(pl: BotPlaylist) {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}?action=shuffle_bot_playlist`, { id: pl.id })
      );
      if (res && res.status === 'success' && res.songs) {
        pl.songs = res.songs;
        this.showToast(`Tracks shuffled for '${pl.title}'!`);
      }
    } catch (err) {
      console.error('Shuffle failed:', err);
    }
  }

  async triggerManualRun() {
    this.isRunningBot.set(true);
    this.botRunLogs.set(['[Bot Triggered] Running Spotify Importer & Section Manager...']);
    this.activeTab.set('logs');

    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}?action=trigger_bot_run&token=gt_cron_bot&t=${Date.now()}`)
      );
      if (res && res.status === 'success') {
        const logs = [
          `[Completed] ${res.timestamp}`,
          `Processed Playlists: ${res.processed}`,
          `Section Limit (Max ${res.maxSectionsPerLanguage} per lang): Active`,
          ...(res.logs || []),
          ...(res.sectionLogs || [])
        ];
        this.botRunLogs.set(logs);
        this.showToast(`Bot run complete: ${res.processed} collections processed!`);
        await this.fetchPlaylists();
        await this.fetchConfig();
      } else {
        this.botRunLogs.set(['[Error] ' + JSON.stringify(res)]);
      }
    } catch (err: any) {
      this.botRunLogs.set(['[Error] Bot run failed or timed out: ' + (err.message || err)]);
    } finally {
      this.isRunningBot.set(false);
    }
  }

  addSource() {
    if (!this.newSourceUrl.trim()) return;
    const cur = this.config();
    if (!cur.targetSpotifySources) cur.targetSpotifySources = [];
    cur.targetSpotifySources.push({
      url: this.newSourceUrl.trim(),
      name: this.newSourceName.trim() || 'Spotify Collection',
      defaultLang: this.newSourceLang,
      type: this.newSourceType,
      enabled: true
    });
    this.newSourceUrl = '';
    this.newSourceName = '';
    this.saveConfig();
  }

  removeSource(index: number) {
    const cur = this.config();
    cur.targetSpotifySources.splice(index, 1);
    this.saveConfig();
  }

  toggleSource(src: SpotifySource) {
    src.enabled = !src.enabled;
    this.saveConfig();
  }

  openPreview(pl: BotPlaylist) {
    this.previewPlaylist = pl;
  }

  closePreview() {
    this.previewPlaylist = null;
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set('');
    }, 3500);
  }
}
