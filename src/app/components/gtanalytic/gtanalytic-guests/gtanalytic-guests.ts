import { Component, inject, computed, signal, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GtanalyticDataService } from '../gtanalytic-data.service';

import { WORLD_MAP_PATHS, WorldCountryPath } from './world-map-paths';

export interface CountrySummary {
  code: string;
  name: string;
  flag: string;
  active_guests: number;
  percentage: number;
  total_plays: number;
  total_time_seconds: number;
  city_count: number;
}

export interface CityBeacon {
  city: string;
  country: string;
  country_code: string;
  flag: string;
  active_guests: number;
  total_plays: number;
  cx: number;
  cy: number;
}

@Component({
  selector: 'app-gtanalytic-guests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gtanalytic-guests.html',
  styleUrls: ['./gtanalytic-guests.scss']
})
export class GtanalyticGuestsComponent implements OnDestroy {
  dataService = inject(GtanalyticDataService);

  searchQuery = signal<string>('');
  activeTab = signal<'active' | 'songs' | 'activity'>('active');
  selectedGuest = signal<any | null>(null);

  guestSummary = computed(() => this.dataService.analyticsData()?.guest_summary || {
    total_guests: 0,
    active_guests_today: 0,
    online_guests_now: 0,
    total_guest_plays: 0,
    total_guest_time_seconds: 0
  });

  recentDeviceRatio = computed(() => {
    const list = this.dataService.analyticsData()?.recent_guests || [];
    let mobile = 0;
    let pc = 0;
    let tablet = 0;
    let unknown = 0;
    for (const g of list) {
      const t = (g.device_type || '').toLowerCase();
      if (t === 'mobile') mobile++;
      else if (t === 'pc') pc++;
      else if (t === 'tablet') tablet++;
      else unknown++;
    }
    const total = list.length || 1;
    return {
      total: list.length,
      mobile,
      pc,
      tablet,
      unknown,
      mobilePct: Math.round((mobile / total) * 100),
      pcPct: Math.round((pc / total) * 100),
      tabletPct: Math.round((tablet / total) * 100)
    };
  });

  onlineGuests = computed(() => {
    const list = this.dataService.analyticsData()?.online_guests || [];
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((g: any) =>
      (g.guest_id || '').toLowerCase().includes(q) ||
      (g.ip_address || '').toLowerCase().includes(q) ||
      (g.location || '').toLowerCase().includes(q) ||
      (g.current_page || '').toLowerCase().includes(q) ||
      (g.last_search || '').toLowerCase().includes(q) ||
      (g.last_song_title || '').toLowerCase().includes(q)
    );
  });

  guestTopSongs = computed(() => {
    const list = this.dataService.analyticsData()?.guest_top_songs || [];
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((s: any) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.artist || '').toLowerCase().includes(q) ||
      (s.video_id || '').toLowerCase().includes(q)
    );
  });

  recentGuests = computed(() => {
    const list = this.dataService.analyticsData()?.recent_guests || [];
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((g: any) =>
      (g.guest_id || '').toLowerCase().includes(q) ||
      (g.ip_address || '').toLowerCase().includes(q) ||
      (g.location || '').toLowerCase().includes(q) ||
      (g.current_page || '').toLowerCase().includes(q) ||
      (g.last_search || '').toLowerCase().includes(q) ||
      (g.last_song_title || '').toLowerCase().includes(q)
    );
  });

  openGuestModal(guest: any) {
    this.selectedGuest.set(guest);
  }

  closeGuestModal() {
    this.selectedGuest.set(null);
  }

  getCountryFlag(code: string): string {
    if (!code || code.length !== 2) return '🌐';
    try {
      const c = code.toUpperCase();
      return String.fromCodePoint(c.charCodeAt(0) + 127397, c.charCodeAt(1) + 127397);
    } catch {
      return '🌐';
    }
  }

  deviceIcon(g: any): string {
    const t = (g?.device_type || '').toLowerCase();
    if (t === 'mobile') return '📱';
    if (t === 'tablet') return '📲';
    if (t === 'pc') return '💻';
    return '🖥️';
  }

  deviceLabel(g: any): string {
    if (!g?.device_type) return '';
    const screen = g?.screen_size ? ` · ${g.screen_size}` : '';
    return `${this.deviceIcon(g)} ${g.device_type}${screen}`;
  }

  formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    let dStr = dateStr;
    if (!dStr.includes('Z') && !dStr.includes('+')) {
      dStr = dStr.replace(' ', 'T') + '+05:30';
    }
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  }

  setFilter(filterId: string) {
    this.dataService.setFilter(filterId);
  }

  formatSeconds(sec: number): string {
    if (!sec) return '0 min';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} mins`;
  }

  formatIST(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    let dStr = dateStr;
    if (!dStr.includes('Z') && !dStr.includes('+')) {
      dStr = dStr.replace(' ', 'T') + '+05:30';
    }
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  formatISTDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    let dStr = dateStr;
    if (!dStr.includes('Z') && !dStr.includes('+')) {
      dStr = dStr.replace(' ', 'T') + '+05:30';
    }
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // ── Audience Geography Demographics Modal (Google Analytics Style) ──
  isGeoModalOpen = signal<boolean>(false);
  geoRange = signal<'dau' | 'wau' | 'mau' | 'yau' | 'all'>('dau');
  geoLoading = signal<boolean>(false);
  geoData = signal<any>(null);
  geoSearchQuery = signal<string>('');
  geoError = signal<string>('');
  selectedCountryCode = signal<string | null>(null);
  geoViewMode = signal<'map' | 'countries' | 'cities'>('map');
  mapZoom = signal<number>(1);
  mapPanX = signal<number>(0);
  mapPanY = signal<number>(0);
  isMapPanning = signal<boolean>(false);
  private startClientX = 0;
  private startClientY = 0;
  private startPanX = 0;
  private startPanY = 0;
  private hasDraggedMap = false;
  hoveredCountry = signal<CountrySummary | null>(null);
  hoveredBeacon = signal<CityBeacon | null>(null);
  tooltipPos = signal<{ x: number, y: number }>({ x: 0, y: 0 });

  readonly worldMapPaths: WorldCountryPath[] = WORLD_MAP_PATHS;

  // City coordinate map for live beacon radar on SVG map
  private readonly cityCoordinates: Record<string, { cx: number, cy: number }> = {
    'kolkata': { cx: 622, cy: 468 },
    'mumbai': { cx: 588, cy: 476 },
    'delhi': { cx: 589, cy: 445 },
    'new delhi': { cx: 589, cy: 445 },
    'noida': { cx: 591, cy: 446 },
    'gurugram': { cx: 588, cy: 446 },
    'srinagar': { cx: 585, cy: 432 },
    'jammu': { cx: 583, cy: 436 },
    'leh': { cx: 593, cy: 430 },
    'ladakh': { cx: 593, cy: 430 },
    'kashmir': { cx: 585, cy: 432 },
    'muzaffarabad': { cx: 579, cy: 433 },
    'gilgit': { cx: 580, cy: 429 },
    'anantnag': { cx: 586, cy: 433 },
    'baramulla': { cx: 584, cy: 431 },
    'udhampur': { cx: 584, cy: 435 },
    'bengaluru': { cx: 596, cy: 494 },
    'bangalore': { cx: 596, cy: 494 },
    'hyderabad': { cx: 598, cy: 480 },
    'chennai': { cx: 602, cy: 495 },
    'pune': { cx: 590, cy: 479 },
    'ludhiana': { cx: 588, cy: 438 },
    'chandigarh': { cx: 590, cy: 439 },
    'jaipur': { cx: 588, cy: 450 },
    'ahmedabad': { cx: 584, cy: 462 },
    'lucknow': { cx: 604, cy: 452 },
    'patna': { cx: 615, cy: 454 },
    'indore': { cx: 591, cy: 465 },
    'nagpur': { cx: 596, cy: 470 },
    'bhopal': { cx: 593, cy: 463 },
    'surat': { cx: 584, cy: 467 },
    'guwahati': { cx: 628, cy: 455 },
    'coimbatore': { cx: 595, cy: 501 },
    'kochi': { cx: 595, cy: 505 },
    'manchester': { cx: 416, cy: 368 },
    'london': { cx: 418, cy: 373 },
    'birmingham': { cx: 417, cy: 370 },
    'leeds': { cx: 417, cy: 367 },
    'glasgow': { cx: 413, cy: 361 },
    'edinburgh': { cx: 415, cy: 362 },
    'ellicott city': { cx: 184, cy: 398 },
    'new york': { cx: 186, cy: 394 },
    'brooklyn': { cx: 186, cy: 394 },
    'washington': { cx: 183, cy: 399 },
    'los angeles': { cx: 110, cy: 406 },
    'san francisco': { cx: 106, cy: 399 },
    'san jose': { cx: 107, cy: 400 },
    'chicago': { cx: 154, cy: 393 },
    'dallas': { cx: 147, cy: 416 },
    'houston': { cx: 148, cy: 422 },
    'austin': { cx: 145, cy: 420 },
    'seattle': { cx: 112, cy: 376 },
    'boston': { cx: 189, cy: 390 },
    'atlanta': { cx: 168, cy: 412 },
    'miami': { cx: 178, cy: 433 },
    'mountain view': { cx: 107, cy: 400 },
    'toronto': { cx: 178, cy: 384 },
    'vancouver': { cx: 113, cy: 373 },
    'montreal': { cx: 184, cy: 380 },
    'dubai': { cx: 532, cy: 468 },
    'abu dhabi': { cx: 530, cy: 470 },
    'sharjah': { cx: 533, cy: 467 },
    'riyadh': { cx: 519, cy: 469 },
    'doha': { cx: 528, cy: 465 },
    'paris': { cx: 421, cy: 395 },
    'berlin': { cx: 436, cy: 385 },
    'frankfurt': { cx: 430, cy: 391 },
    'amsterdam': { cx: 422, cy: 385 },
    'madrid': { cx: 408, cy: 415 },
    'rome': { cx: 437, cy: 415 },
    'sydney': { cx: 745, cy: 605 },
    'melbourne': { cx: 738, cy: 612 },
    'singapore': { cx: 659, cy: 527 },
    'tokyo': { cx: 718, cy: 418 },
    'dhaka': { cx: 620, cy: 462 },
    'kathmandu': { cx: 605, cy: 450 },
    'karachi': { cx: 567, cy: 465 },
    'lahore': { cx: 585, cy: 443 },
    'islamabad': { cx: 581, cy: 437 },
    'colombo': { cx: 604, cy: 508 }
  };

  private geoSub?: Subscription;

  // Group locations into countries (GA4 Country Metric Grouping)
  countryStats = computed<CountrySummary[]>(() => {
    const data = this.geoData();
    const list = data?.locations || [];
    const totalGuests = data?.summary?.total_active_guests || 0;
    const map = new Map<string, CountrySummary>();

    for (const loc of list) {
      const rawCode = (loc.country_code || '').toUpperCase().trim();
      const rawName = loc.country || 'Unknown';
      const key = rawCode || rawName;

      if (!map.has(key)) {
        map.set(key, {
          code: rawCode,
          name: rawName,
          flag: this.getCountryFlag(rawCode),
          active_guests: 0,
          percentage: 0,
          total_plays: 0,
          total_time_seconds: 0,
          city_count: 0
        });
      }

      const item = map.get(key)!;
      item.active_guests += Number(loc.active_guests || 0);
      item.total_plays += Number(loc.total_plays || 0);
      item.total_time_seconds += Number(loc.total_time_seconds || 0);
      item.city_count += 1;
    }

    const arr = Array.from(map.values());
    for (const item of arr) {
      item.percentage = totalGuests > 0 ? Number(((item.active_guests / totalGuests) * 100).toFixed(1)) : 0;
    }

    arr.sort((a, b) => b.active_guests - a.active_guests || b.total_plays - a.total_plays);
    return arr;
  });

  countryStatsMap = computed<Record<string, CountrySummary>>(() => {
    const stats = this.countryStats();
    const map: Record<string, CountrySummary> = {};
    for (const s of stats) {
      if (s.code) {
        map[s.code] = s;
      }
    }
    return map;
  });

  maxCountryGuests = computed<number>(() => {
    const stats = this.countryStats();
    if (!stats.length) return 1;
    return Math.max(...stats.map(s => s.active_guests), 1);
  });

  // Top 10 cities mapped with pulsing radar beacons
  activeCityBeacons = computed<CityBeacon[]>(() => {
    const list = this.filteredGeoLocations();
    const beacons: CityBeacon[] = [];
    for (const loc of list) {
      const cityKey = (loc.city || '').toLowerCase().trim();
      const coords = this.cityCoordinates[cityKey];
      if (coords && loc.active_guests > 0) {
        beacons.push({
          city: loc.city,
          country: loc.country,
          country_code: (loc.country_code || '').toUpperCase(),
          flag: this.getCountryFlag(loc.country_code),
          active_guests: loc.active_guests,
          total_plays: loc.total_plays,
          cx: coords.cx,
          cy: coords.cy
        });
      }
    }
    return beacons;
  });

  filteredGeoLocations = computed(() => {
    const data = this.geoData();
    let list = data?.locations || [];

    // Filter by selected country if drilled-down
    const selected = this.selectedCountryCode();
    if (selected) {
      list = list.filter((l: any) => (l.country_code || '').toUpperCase() === selected);
    }

    const q = this.geoSearchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((l: any) =>
      (l?.city || '').toLowerCase().includes(q) ||
      (l?.region || '').toLowerCase().includes(q) ||
      (l?.country || '').toLowerCase().includes(q)
    );
  });

  trackByCountryId(index: number, item: WorldCountryPath): string {
    return item.id;
  }

  openGeoModal() {
    this.geoSearchQuery.set('');
    this.geoError.set('');
    this.selectedCountryCode.set(null);
    this.mapZoom.set(1);
    this.mapPanX.set(0);
    this.mapPanY.set(0);
    this.hoveredCountry.set(null);
    this.hoveredBeacon.set(null);
    this.isGeoModalOpen.set(true);
    this.loadGeoData();
  }

  closeGeoModal() {
    this.isGeoModalOpen.set(false);
    this.selectedCountryCode.set(null);
    this.geoSub?.unsubscribe();
  }

  setGeoRange(range: 'dau' | 'wau' | 'mau' | 'yau' | 'all') {
    if (this.geoRange() === range) return;
    this.geoRange.set(range);
    this.selectedCountryCode.set(null);
    this.loadGeoData();
  }

  selectCountry(code: string | null) {
    if (this.hasDraggedMap) {
      this.hasDraggedMap = false;
      return;
    }
    if (!code) {
      this.selectedCountryCode.set(null);
      return;
    }
    const clean = code.toUpperCase();
    if (this.selectedCountryCode() === clean) {
      this.selectedCountryCode.set(null); // toggle off
    } else {
      this.selectedCountryCode.set(clean);
    }
  }

  clearCountryFilter() {
    this.selectedCountryCode.set(null);
  }

  setMapZoom(delta: number) {
    const current = this.mapZoom();
    const next = Math.max(0.7, Math.min(6.0, Number((current + delta).toFixed(1))));
    this.mapZoom.set(next);
  }

  resetMapZoom() {
    this.mapZoom.set(1);
    this.mapPanX.set(0);
    this.mapPanY.set(0);
  }

  getCountryFillColor(code: string): string {
    const upper = code.toUpperCase();
    const stat = this.countryStatsMap()[upper];
    if (!stat || stat.active_guests <= 0) {
      return '#12121c'; // Default sleek dark tile
    }

    if (this.selectedCountryCode() === upper) {
      return '#FF2A38'; // Selected vibrant red
    }

    const max = this.maxCountryGuests();
    const ratio = stat.active_guests / max;

    // GA4 Style Heat Intensity (Brand Red palette)
    if (ratio >= 0.7) {
      return '#F50919'; // Peak: Brand Red
    } else if (ratio >= 0.35) {
      return '#DC2626'; // High: Crimson
    } else if (ratio >= 0.12) {
      return '#EF4444'; // Medium: Warm Red
    } else {
      return '#B91C1C'; // Low: Deep Red
    }
  }

  onCountryHover(code: string, event: MouseEvent) {
    const upper = code.toUpperCase();
    const stat = this.countryStatsMap()[upper];
    if (stat) {
      this.hoveredCountry.set(stat);
    } else {
      this.hoveredCountry.set({
        code: upper,
        name: this.getCountryNameByCode(upper),
        flag: this.getCountryFlag(upper),
        active_guests: 0,
        percentage: 0,
        total_plays: 0,
        total_time_seconds: 0,
        city_count: 0
      });
    }
    this.hoveredBeacon.set(null);
    this.updateTooltipCoords(event);
  }

  onBeaconHover(beacon: CityBeacon, event: MouseEvent) {
    this.hoveredBeacon.set(beacon);
    this.hoveredCountry.set(null);
    this.updateTooltipCoords(event);
  }

  onMapMouseDown(event: MouseEvent) {
    if (event.button !== 0) return; // Only main button
    this.isMapPanning.set(true);
    this.hasDraggedMap = false;
    this.startClientX = event.clientX;
    this.startClientY = event.clientY;
    this.startPanX = this.mapPanX();
    this.startPanY = this.mapPanY();
  }

  onMapMouseMove(event: MouseEvent) {
    if (this.isMapPanning()) {
      const dx = event.clientX - this.startClientX;
      const dy = event.clientY - this.startClientY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.hasDraggedMap = true;
      }
      this.mapPanX.set(Math.round(this.startPanX + dx));
      this.mapPanY.set(Math.round(this.startPanY + dy));
    }

    if (this.hoveredCountry() || this.hoveredBeacon()) {
      this.updateTooltipCoords(event);
    }
  }

  onMapMouseUp(event?: MouseEvent) {
    this.isMapPanning.set(false);
  }

  onMapWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.25 : 0.8;
    const currentZoom = this.mapZoom();
    const next = Math.max(0.7, Math.min(6.0, Number((currentZoom * zoomFactor).toFixed(2))));
    
    // Zoom toward pointer position
    const target = event.currentTarget as HTMLElement;
    const container = target.closest('.geo-map-viewport');
    if (container) {
      const rect = container.getBoundingClientRect();
      const pointerX = event.clientX - rect.left - rect.width / 2;
      const pointerY = event.clientY - rect.top - rect.height / 2;
      const scaleChange = next / currentZoom;
      this.mapPanX.update(px => Math.round(pointerX - (pointerX - px) * scaleChange));
      this.mapPanY.update(py => Math.round(pointerY - (pointerY - py) * scaleChange));
    }
    this.mapZoom.set(next);
  }

  onMapTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.isMapPanning.set(true);
      this.hasDraggedMap = false;
      this.startClientX = event.touches[0].clientX;
      this.startClientY = event.touches[0].clientY;
      this.startPanX = this.mapPanX();
      this.startPanY = this.mapPanY();
    }
  }

  onMapTouchMove(event: TouchEvent) {
    if (this.isMapPanning() && event.touches.length === 1) {
      const dx = event.touches[0].clientX - this.startClientX;
      const dy = event.touches[0].clientY - this.startClientY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.hasDraggedMap = true;
      }
      this.mapPanX.set(Math.round(this.startPanX + dx));
      this.mapPanY.set(Math.round(this.startPanY + dy));
    }
  }

  onMapTouchEnd() {
    this.isMapPanning.set(false);
  }

  private updateTooltipCoords(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const container = target.closest('.geo-map-viewport');
    if (container) {
      const rect = container.getBoundingClientRect();
      this.tooltipPos.set({
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top)
      });
    }
  }

  onCountryLeave() {
    this.hoveredCountry.set(null);
    this.hoveredBeacon.set(null);
  }

  getCountryNameByCode(code: string): string {
    const c = code.toUpperCase();
    const names: Record<string, string> = {
      'IN': 'India',
      'US': 'United States',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'AE': 'United Arab Emirates',
      'SA': 'Saudi Arabia',
      'PK': 'Pakistan',
      'BD': 'Bangladesh',
      'NP': 'Nepal',
      'LK': 'Sri Lanka',
      'SG': 'Singapore',
      'MY': 'Malaysia',
      'ID': 'Indonesia',
      'JP': 'Japan',
      'KR': 'South Korea',
      'CN': 'China',
      'RU': 'Russia',
      'BR': 'Brazil',
      'IT': 'Italy',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'CH': 'Switzerland',
      'SE': 'Sweden',
      'NO': 'Norway',
      'NZ': 'New Zealand',
      'ZA': 'South Africa',
      'MX': 'Mexico',
      'TH': 'Thailand',
      'VN': 'Vietnam',
      'PH': 'Philippines',
      'TR': 'Turkey',
      'EG': 'Egypt',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'AR': 'Argentina',
      'CO': 'Colombia',
      'CL': 'Chile'
    };
    return names[c] || c;
  }

  loadGeoData() {
    this.geoSub?.unsubscribe();
    this.geoLoading.set(true);
    this.geoError.set('');
    this.geoSub = this.dataService.getGuestGeography(this.geoRange()).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.geoData.set(res.data);
        } else {
          this.geoError.set(res.message || 'Failed to load geography data');
        }
        this.geoLoading.set(false);
      },
      error: (err: any) => {
        this.geoError.set('Network error loading geography data');
        this.geoLoading.set(false);
      }
    });
  }

  // ── IP Exclusion & Bot Settings ──
  isSettingsModalOpen = signal<boolean>(false);
  excludedIps = signal<any[]>([]);
  newIpInput = signal<string>('');
  newIpNote = signal<string>('');
  myDetectedIp = signal<string>('');
  isSavingIp = signal<boolean>(false);
  isPurgingBots = signal<boolean>(false);
  settingsSuccessMsg = signal<string>('');
  settingsErrorMsg = signal<string>('');
  quickExcludingIp = signal<string | null>(null);

  openSettingsModal() {
    this.settingsSuccessMsg.set('');
    this.settingsErrorMsg.set('');
    this.newIpInput.set('');
    this.newIpNote.set('');
    this.isSettingsModalOpen.set(true);
    this.loadExcludedIps();
  }

  closeSettingsModal() {
    this.isSettingsModalOpen.set(false);
  }

  loadExcludedIps() {
    this.dataService.getExcludedIps().subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.excludedIps.set(res.data || []);
          if (res.client_ip) {
            this.myDetectedIp.set(res.client_ip);
          }
        }
      },
      error: () => {
        this.settingsErrorMsg.set('Failed to fetch excluded IP list');
      }
    });
  }

  fillMyIp() {
    if (this.myDetectedIp()) {
      this.newIpInput.set(this.myDetectedIp());
      this.newIpNote.set('My Device / Admin');
    }
  }

  addExcludedIp() {
    const ip = this.newIpInput().trim();
    if (!ip) {
      this.settingsErrorMsg.set('Please enter a valid IP address');
      return;
    }
    this.isSavingIp.set(true);
    this.settingsErrorMsg.set('');
    this.settingsSuccessMsg.set('');

    this.dataService.addExcludedIp(ip, this.newIpNote().trim() || 'Manual Exclusion').subscribe({
      next: (res: any) => {
        this.isSavingIp.set(false);
        if (res.status === 'success') {
          this.excludedIps.set(res.data || []);
          this.settingsSuccessMsg.set(res.message || `IP ${ip} excluded successfully`);
          this.newIpInput.set('');
          this.newIpNote.set('');
          this.dataService.triggerRefresh();
        } else {
          this.settingsErrorMsg.set(res.message || 'Failed to add excluded IP');
        }
      },
      error: () => {
        this.isSavingIp.set(false);
        this.settingsErrorMsg.set('Network error saving excluded IP');
      }
    });
  }

  removeExcludedIp(ip: string) {
    this.settingsErrorMsg.set('');
    this.settingsSuccessMsg.set('');
    this.dataService.removeExcludedIp(ip).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.excludedIps.set(res.data || []);
          this.settingsSuccessMsg.set(`IP ${ip} removed from exclusion list`);
          this.dataService.triggerRefresh();
        } else {
          this.settingsErrorMsg.set(res.message || 'Failed to remove IP');
        }
      },
      error: () => {
        this.settingsErrorMsg.set('Network error removing IP');
      }
    });
  }

  quickExcludeIp(ip: string, note: string = 'Quick Blocked from Guests') {
    if (!ip || ip === 'Hidden/Internal' || ip === '—') return;
    this.quickExcludingIp.set(ip);
    this.dataService.addExcludedIp(ip, note).subscribe({
      next: (res: any) => {
        this.quickExcludingIp.set(null);
        if (this.selectedGuest()?.ip_address === ip) {
          this.closeGuestModal();
        }
        this.dataService.triggerRefresh();
      },
      error: () => {
        this.quickExcludingIp.set(null);
      }
    });
  }

  purgeHostingerBots() {
    this.isPurgingBots.set(true);
    this.settingsErrorMsg.set('');
    this.settingsSuccessMsg.set('');

    this.dataService.purgeHostingerBots().subscribe({
      next: (res: any) => {
        this.isPurgingBots.set(false);
        if (res.status === 'success') {
          this.settingsSuccessMsg.set(res.message || `Cleaned ${res.purged_count || 0} Hostinger bot records!`);
          this.dataService.triggerRefresh();
        } else {
          this.settingsErrorMsg.set(res.message || 'Failed to purge bot records');
        }
      },
      error: () => {
        this.isPurgingBots.set(false);
        this.settingsErrorMsg.set('Network error purging bot records');
      }
    });
  }

  // ── Audience Device & Screen Demographics Modal ──
  isDevicesModalOpen = signal<boolean>(false);
  devicesRange = signal<'dau' | 'wau' | 'mau' | 'yau' | 'all'>('dau');
  devicesLoading = signal<boolean>(false);
  devicesData = signal<any>(null);
  devicesError = signal<string>('');
  devicesActiveTab = signal<'overview' | 'screens' | 'os' | 'browsers'>('overview');
  devicesSearchQuery = signal<string>('');
  private devicesSub?: Subscription;

  openDevicesModal() {
    this.devicesSearchQuery.set('');
    this.devicesError.set('');
    this.isDevicesModalOpen.set(true);
    this.loadDevicesData();
  }

  closeDevicesModal() {
    this.isDevicesModalOpen.set(false);
    this.devicesSub?.unsubscribe();
  }

  setDevicesRange(range: 'dau' | 'wau' | 'mau' | 'yau' | 'all') {
    if (this.devicesRange() === range) return;
    this.devicesRange.set(range);
    this.loadDevicesData();
  }

  loadDevicesData() {
    this.devicesSub?.unsubscribe();
    this.devicesLoading.set(true);
    this.devicesError.set('');

    this.devicesSub = this.dataService.getGuestDevices(this.devicesRange()).subscribe({
      next: (res: any) => {
        if (res.status === 'success' && res.data) {
          this.devicesData.set(res.data);
        } else {
          this.devicesError.set(res.message || 'Failed to load device analytics');
        }
        this.devicesLoading.set(false);
      },
      error: () => {
        this.devicesError.set('Network error loading device analytics');
        this.devicesLoading.set(false);
      }
    });
  }

  getFilteredScreens(): any[] {
    const list = this.devicesData()?.screen_sizes || [];
    const q = this.devicesSearchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter((s: any) => (s.name || '').toLowerCase().includes(q));
  }

  getScreenCategory(screen: string): string {
    if (!screen || screen === 'Unknown') return 'Unknown';
    const parts = screen.split('x');
    if (parts.length !== 2) return 'Standard';
    const w = parseInt(parts[0], 10);
    const h = parseInt(parts[1], 10);
    const maxDim = Math.max(w, h);
    const minDim = Math.min(w, h);
    if (minDim <= 500) return '📱 Mobile';
    if (minDim <= 850) return '📲 Tablet';
    if (maxDim >= 2560) return '🖥️ 2K / 4K Ultra';
    if (maxDim >= 1920) return '💻 1080p FHD PC';
    if (maxDim >= 1366) return '💻 HD Laptop';
    return '📱 Mobile / Handheld';
  }

  getScreenBadgeClass(screen: string): string {
    const cat = this.getScreenCategory(screen).toLowerCase();
    if (cat.includes('fhd') || cat.includes('ultra')) return 'badge-cyan';
    if (cat.includes('laptop')) return 'badge-blue';
    if (cat.includes('tablet')) return 'badge-emerald';
    return 'badge-pink';
  }

  getDeviceBadgeColor(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('mobile')) return 'linear-gradient(90deg, #ec4899, #f472b6)';
    if (n.includes('pc')) return 'linear-gradient(90deg, #0284c7, #38bdf8)';
    if (n.includes('tablet')) return 'linear-gradient(90deg, #059669, #34d399)';
    return 'linear-gradient(90deg, #6366f1, #818cf8)';
  }

  getOsBarColor(os: string): string {
    const o = (os || '').toLowerCase();
    if (o.includes('windows')) return 'linear-gradient(90deg, #0284c7, #38bdf8)';
    if (o.includes('android')) return 'linear-gradient(90deg, #059669, #10b981)';
    if (o.includes('ios') || o.includes('iphone') || o.includes('ipad')) return 'linear-gradient(90deg, #6366f1, #a855f7)';
    if (o.includes('mac')) return 'linear-gradient(90deg, #0ea5e9, #67e8f9)';
    if (o.includes('linux')) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    if (o.includes('chrome')) return 'linear-gradient(90deg, #06b6d4, #22d3ee)';
    return 'linear-gradient(90deg, #8b5cf6, #c084fc)';
  }

  getBrowserBarColor(browser: string): string {
    const b = (browser || '').toLowerCase();
    if (b.includes('chrome')) return 'linear-gradient(90deg, #0284c7, #06b6d4)';
    if (b.includes('edge')) return 'linear-gradient(90deg, #0ea5e9, #38bdf8)';
    if (b.includes('safari')) return 'linear-gradient(90deg, #3b82f6, #60a5fa)';
    if (b.includes('firefox')) return 'linear-gradient(90deg, #ea580c, #f59e0b)';
    if (b.includes('opera')) return 'linear-gradient(90deg, #9333ea, #c084fc)';
    if (b.includes('samsung')) return 'linear-gradient(90deg, #4f46e5, #6366f1)';
    return 'linear-gradient(90deg, #06b6d4, #38bdf8)';
  }

  getOsIcon(os: string): string {
    const o = (os || '').toLowerCase();
    if (o.includes('android')) return '🤖';
    if (o.includes('ios') || o.includes('iphone') || o.includes('ipad')) return '🍎';
    if (o.includes('windows')) return '🪟';
    if (o.includes('mac')) return '🍏';
    if (o.includes('linux')) return '🐧';
    if (o.includes('chrome')) return '🌐';
    return '💻';
  }

  getBrowserIcon(browser: string): string {
    const b = (browser || '').toLowerCase();
    if (b.includes('chrome')) return '🌐';
    if (b.includes('safari')) return '🧭';
    if (b.includes('edge')) return '🌊';
    if (b.includes('firefox')) return '🦊';
    if (b.includes('opera')) return '🔴';
    if (b.includes('samsung')) return '📱';
    return '🌐';
  }

  ngOnDestroy(): void {
    this.geoSub?.unsubscribe();
    this.devicesSub?.unsubscribe();
  }
}


