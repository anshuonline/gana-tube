import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LucideRefreshCw, LucideMusic, LucideLayoutGrid, LucideImage, LucideUsers, LucideArrowRight, LucideRadio, LucideClock } from '@lucide/angular';

interface PlaylistRow {
  id: string;
  title: string;
  status: string;
  songs: any[];
  publishDate?: string;
}

@Component({
  selector: 'app-managegt-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideRefreshCw, LucideMusic, LucideLayoutGrid, LucideImage, LucideUsers, LucideArrowRight, LucideRadio, LucideClock],
  templateUrl: './managegt-dashboard.html',
  styleUrls: ['./managegt-dashboard.scss']
})
export class ManagegtDashboardComponent implements OnInit {
  isLoading = true;
  loadError = '';

  totalPlaylists = 0;
  publishedPlaylists = 0;
  scheduledPlaylists = 0;
  totalSections = 0;
  totalSectionSongs = 0;
  totalPopups = 0;
  activePopups = 0;

  recentPlaylists: PlaylistRow[] = [];
  upcomingScheduled: PlaylistRow[] = [];

  private apiUrl = window.location.origin.includes('localhost') ? 'http://localhost/manageads/managegt-api.php' : 'https://manageads.ganatube.in/managegt-api.php';

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadDashboard();
  }

  async loadDashboard() {
    this.isLoading = true;
    this.loadError = '';
    this.cdr.detectChanges();

    try {
      const cacheBuster = Date.now();

      const [playlistsData, sectionsData, popupsData] = await Promise.all([
        firstValueFrom(this.http.get<any>(`${this.apiUrl}?action=get_playlists&t=${cacheBuster}`)).catch(() => ({})),
        firstValueFrom(this.http.get<any>(`${this.apiUrl}?action=get_sections&t=${cacheBuster}`)).catch(() => ({})),
        firstValueFrom(this.http.get<any>(`${this.apiUrl}?action=get_popups&t=${cacheBuster}`)).catch(() => ({}))
      ]);

      // ─── Playlists ───
      const now = new Date();
      const allPlaylists: PlaylistRow[] = [];
      if (playlistsData && typeof playlistsData === 'object') {
        Object.keys(playlistsData).forEach(lang => {
          ((playlistsData[lang] || []) as any[]).forEach(p => {
            if (!p || !p.id) return;
            let status = p.status || 'private';
            if (status === 'schedule' && p.publishDate && new Date(p.publishDate) <= now) {
              status = 'publish';
            }
            allPlaylists.push({ id: p.id, title: p.title, status, songs: p.songs || [], publishDate: p.publishDate });
          });
        });
      }

      this.totalPlaylists = allPlaylists.length;
      this.publishedPlaylists = allPlaylists.filter(p => p.status === 'publish').length;
      this.scheduledPlaylists = allPlaylists.filter(p => p.status === 'schedule').length;

      // Recent: published, most recent first (by publishDate or order)
      this.recentPlaylists = [...allPlaylists]
        .filter(p => p.status === 'publish')
        .reverse()
        .slice(0, 5);

      // Upcoming scheduled: soonest publish date first
      this.upcomingScheduled = allPlaylists
        .filter(p => p.status === 'schedule' && p.publishDate)
        .sort((a, b) => new Date(a.publishDate!).getTime() - new Date(b.publishDate!).getTime())
        .slice(0, 5);

      // ─── Sections ───
      let sectionCount = 0;
      let songCount = 0;
      if (sectionsData && typeof sectionsData === 'object') {
        Object.keys(sectionsData).forEach(lang => {
          ((sectionsData[lang] || []) as any[]).forEach(s => {
            sectionCount++;
            songCount += (s.songs || []).length;
          });
        });
      }
      this.totalSections = sectionCount;
      this.totalSectionSongs = songCount;

      // ─── Popups ───
      const popups = (popupsData && popupsData.popups) || [];
      this.totalPopups = Array.isArray(popups) ? popups.length : 0;
      this.activePopups = Array.isArray(popups) ? popups.filter((p: any) => p && p.isActive).length : 0;

      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (e) {
      this.isLoading = false;
      this.loadError = 'Could not load dashboard data. Check your connection or the API.';
      this.cdr.detectChanges();
    }
  }

  openPlaylistRow(playlistId: string) {
    window.open(`https://ganatube.in/playlist/${playlistId}`, '_blank');
  }
}
