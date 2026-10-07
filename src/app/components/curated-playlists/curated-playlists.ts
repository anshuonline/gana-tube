import { Component, OnInit, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PlaylistMeta } from '../../data/playlists.data';
import { PlayerService } from '../../services/player.service';
import { LucidePlay, LucideListMusic, LucideDisc3, LucideRefreshCw, LucideSearch, LucideSparkles } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

export interface BotCuratedItem {
  id: number;
  spotify_id: string;
  title: string;
  type: 'playlist' | 'album';
  language: string;
  cover_image: string;
  total_songs: number;
  songs: any[];
  updated_at?: string;
}

@Component({
  selector: 'app-curated-playlists',
  standalone: true,
  imports: [CommonModule, FormsModule, LucidePlay, LucideListMusic, LucideDisc3, LucideRefreshCw, LucideSearch, LucideSparkles],
  templateUrl: './curated-playlists.html',
  styleUrls: ['./curated-playlists.scss']
})
export class CuratedPlaylistsComponent implements OnInit {
  @Output() onOpenPlaylist = new EventEmitter<PlaylistMeta>();

  private http = inject(HttpClient);
  public playerService = inject(PlayerService);

  private apiUrl = window.location.origin.includes('localhost')
    ? 'http://localhost/manageads/managegt-api.php'
    : 'https://manageads.ganatube.in/managegt-api.php';

  isLoading = signal<boolean>(true);
  allItems = signal<BotCuratedItem[]>([]);
  availableLanguages = signal<string[]>(['All Languages']);
  
  selectedType = signal<'all' | 'playlist' | 'album'>('all');
  selectedLang = signal<string>('All Languages');
  searchQuery = signal<string>('');

  ngOnInit() {
    this.fetchCuratedContent();
  }

  async fetchCuratedContent() {
    this.isLoading.set(true);
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}?action=get_public_curated_content&t=${Date.now()}`)
      );
      if (res && res.status === 'success' && Array.isArray(res.items)) {
        this.allItems.set(res.items);
        const langs = ['All Languages', ...(res.languages || [])];
        this.availableLanguages.set(Array.from(new Set(langs)));
      } else {
        this.allItems.set([]);
      }
    } catch (err) {
      console.warn('Failed to load curated bot playlists:', err);
      this.allItems.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  get filteredItems(): BotCuratedItem[] {
    let items = this.allItems();
    const type = this.selectedType();
    const lang = this.selectedLang();
    const query = this.searchQuery().toLowerCase().trim();

    if (type !== 'all') {
      items = items.filter(item => item.type === type);
    }

    if (lang !== 'All Languages') {
      items = items.filter(item => item.language.toLowerCase() === lang.toLowerCase());
    }

    if (query) {
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        (item.language && item.language.toLowerCase().includes(query))
      );
    }

    return items;
  }

  selectType(type: 'all' | 'playlist' | 'album') {
    this.selectedType.set(type);
  }

  selectLanguage(lang: string) {
    this.selectedLang.set(lang);
  }

  openPlaylist(item: BotCuratedItem) {
    const meta: PlaylistMeta = {
      id: 'bot-' + (item.spotify_id || item.id),
      title: item.title,
      language: item.language || 'Hindi',
      coverImage: item.cover_image || 'ganatubenewlogo.png',
      searchQueries: [],
      preloadedSongs: item.songs || [],
      creator: 'GanaTube Bot'
    };
    this.onOpenPlaylist.emit(meta);
  }

  playDirect(item: BotCuratedItem, event: Event) {
    event.stopPropagation();
    if (item.songs && item.songs.length > 0) {
      this.playerService.setQueue(item.songs, 0);
    } else {
      this.openPlaylist(item);
    }
  }
}
