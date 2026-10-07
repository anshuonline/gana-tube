import { Component, EventEmitter, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CURATED_PLAYLISTS } from '../../data/curated-playlists.data';
import { PlaylistMeta } from '../../data/playlists.data';

@Component({
  selector: 'app-curated-playlists',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './curated-playlists.html',
  styleUrls: ['./curated-playlists.scss']
})
export class CuratedPlaylistsComponent {
  @Output() onOpenPlaylist = new EventEmitter<PlaylistMeta>();

  hindiPlaylists: PlaylistMeta[] = [];
  englishPlaylists: PlaylistMeta[] = [];

  constructor() {
    this.hindiPlaylists = CURATED_PLAYLISTS.filter(p => p.language === 'Hindi');
    this.englishPlaylists = CURATED_PLAYLISTS.filter(p => p.language === 'English');
  }

  openPlaylist(playlist: PlaylistMeta) {
    this.onOpenPlaylist.emit(playlist);
  }
}
