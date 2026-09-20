import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucidePlay, LucideMoreVertical, LucideMusic2, LucideAudioLines, LucideDisc3, LucideLibrary, LucideLoader2, LucideChevronDown, LucideChevronRight, LucideUser } from '@lucide/angular';
import { YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, LucidePlay, LucideMoreVertical, LucideMusic2, LucideAudioLines, LucideDisc3, LucideLibrary, LucideLoader2, LucideChevronDown, LucideChevronRight, LucideUser],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnChanges {
  @Input() results: YouTubeSearchResult[] = [];
  @Input() isLoading = false;
  @Input() hasSearched = false;
  @Input() currentFilter: 'all' | 'songs' | 'albums' | 'playlists' | 'artists' = 'all';
  @Input() isLoadingMore = false;
  @Input() hasMoreSongs = false;
  @Input() artistResults: { name: string; artistId: string; thumb?: string }[] = [];

  @Output() suggestSearch = new EventEmitter<string>();
  @Output() playTrack = new EventEmitter<YouTubeSearchResult>();
  @Output() ambientBgFound = new EventEmitter<string>();
  @Output() toggleMenu = new EventEmitter<{track: YouTubeSearchResult, event: MouseEvent}>();
  @Output() loadMore = new EventEmitter<void>();
  @Output() openArtist = new EventEmitter<{ artistId: string; name: string }>();

  skeletons = Array(8).fill(0);
  readonly songPageSize = 50;
  visibleSongCount = this.songPageSize;

  topResult: YouTubeSearchResult | null = null;
  songResults: YouTubeSearchResult[] = [];
  albumResults: YouTubeSearchResult[] = [];
  playlistResults: YouTubeSearchResult[] = [];
  artistTabs: string[] = [];

  constructor(private playerService: PlayerService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['results'] || changes['currentFilter']) {
      this.processResults();
    }
  }

  private lastFirstSongId: string | null = null;

  processResults() {
    const results = this.results || [];
    if (results.length === 0) {
      this.topResult = null;
      this.songResults = [];
      this.albumResults = [];
      this.playlistResults = [];
      this.artistTabs = [];
      this.visibleSongCount = this.songPageSize;
      this.lastFirstSongId = null;
      this.ambientBgFound.emit('');
      return;
    }

    this.albumResults = results.filter(r => r.type === 'album');
    this.playlistResults = results.filter(r => r.type === 'playlist' || r.type === 'community-playlist');
    this.songResults = results.filter(r => r.type !== 'album' && r.type !== 'playlist' && r.type !== 'community-playlist');
    this.artistTabs = this.extractArtists(this.songResults);

    // Reset pagination on new search, expand on Load More batches
    const firstSongId = this.songResults[0]?.videoId || null;
    if (firstSongId !== this.lastFirstSongId) {
      this.visibleSongCount = this.songPageSize;
      this.lastFirstSongId = firstSongId;
    } else if (this.songResults.length > this.visibleSongCount) {
      this.visibleSongCount += this.songPageSize;
    }

    if (this.currentFilter === 'all') {
      // Top result: best playlist match, otherwise first song
      this.topResult = this.playlistResults[0] || this.songResults[0] || null;

      if (this.topResult) {
        // Remove the top result from its section so it isn't shown twice
        if (this.topResult.type === 'playlist' || this.topResult.type === 'community-playlist') {
          this.playlistResults = this.playlistResults.slice(1);
        } else {
          this.songResults = this.songResults.slice(1);
        }
        this.ambientBgFound.emit(this.topResult.thumbnailHigh || this.topResult.thumbnail);
      }
    } else {
      this.topResult = null;
      // Keep the ambient background alive from the first item of the active view
      const first = this.currentFilter === 'albums'
        ? this.albumResults[0]
        : this.currentFilter === 'playlists'
          ? this.playlistResults[0]
          : this.songResults[0];
      this.ambientBgFound.emit(first ? (first.thumbnailHigh || first.thumbnail) : '');
    }
  }

  formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getSectionLabel(type: string): string {
    return type === 'community-playlist' ? 'Community Playlist' : type === 'album' ? 'Album' : type === 'playlist' ? 'Playlist' : 'Song';
  }

  onPlay(track: YouTubeSearchResult): void {
    this.playTrack.emit(track);
  }

  isCurrentTrack(track: YouTubeSearchResult): boolean {
    return this.playerService.currentTrack()?.videoId === track.videoId;
  }

  onRightClick(event: MouseEvent, track: YouTubeSearchResult): void {
    event.preventDefault(); // Prevent standard browser context menu
    event.stopPropagation();
    this.toggleMenu.emit({track, event});
  }

  onImgError(event: Event, track: YouTubeSearchResult): void {
    const img = event.target as HTMLImageElement;
    if (track.videoId && track.videoId.length === 11) {
      img.src = `https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`;
    }
    img.style.visibility = 'hidden';
  }

  get visibleSongResults(): YouTubeSearchResult[] {
    return this.songResults.slice(0, this.visibleSongCount);
  }

  get hiddenSongCount(): number {
    return Math.max(0, this.songResults.length - this.visibleSongCount);
  }

  onLoadMore(): void {
    if (!this.isLoadingMore) {
      this.loadMore.emit();
    }
  }

  searchArtist(artist: string): void {
    this.suggestSearch.emit(`${artist} songs`);
  }

  get artistsSource(): { name: string; artistId?: string; thumb?: string }[] {
    if (this.artistResults.length > 0) return this.artistResults;
    return this.artistTabs.map(name => ({ name }));
  }

  onArtistImgError(artist: { name: string; artistId?: string; thumb?: string }): void {
    artist.thumb = undefined;
  }

  onArtistClick(artist: { name: string; artistId?: string; thumb?: string }): void {
    if (artist?.artistId) {
      this.openArtist.emit({ artistId: artist.artistId, name: artist.name });
    } else if (artist?.name) {
      this.suggestSearch.emit(`${artist.name} songs`);
    }
  }

  private extractArtists(songs: YouTubeSearchResult[]): string[] {
    const seen = new Set<string>();
    const artists: string[] = [];
    for (const song of songs) {
      let name = (song.channelTitle || '').trim();
      if (!name) continue;
      name = name.replace(/\s*-\s*Topic$/i, '').replace(/\s*VEVO\s*/gi, '').replace(/Official/gi, '').trim();
      if (!name || name.toLowerCase() === 'artist' || name.toLowerCase() === 'various artists') continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      artists.push(name);
    }
    return artists.slice(0, 24);
  }

  getArtistInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getArtistGradient(name: string): string {
    const colors = [
      ['#a855f7', '#ec4899'],
      ['#8b5cf6', '#d946ef'],
      ['#9333ea', '#db2777'],
      ['#7c3aed', '#c026d3'],
      ['#a855f7', '#f43f5e'],
      ['#8b5cf6', '#ec4899']
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const pair = colors[Math.abs(hash) % colors.length];
    return `linear-gradient(135deg, ${pair[0]} 0%, ${pair[1]} 100%)`;
  }
}
