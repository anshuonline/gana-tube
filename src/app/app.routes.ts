import { Routes } from '@angular/router';
import { App } from './app';
import { PlaylistPageComponent } from './components/playlist-page/playlist-page.component';
import { managegtAuthGuard } from './guards/managegt-auth.guard';
import { gtanalyticAuthGuard } from './guards/gtanalytic-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', children: [] },
  { path: 'search', children: [] },
  { path: 'discovery', children: [] },
  { path: 'library', children: [] },
  { path: 'offline', children: [] },
  { path: 'curated-playlists', children: [] },
  { path: 'socials', children: [] },
  { path: 'play', children: [] },
  { path: 'profile', children: [] },
  { path: 'language/:lang', children: [] },
  { path: 'artist/:name', children: [] },
  { path: 'playlist/:id', children: [] },
  { path: 'user/:username/:id', children: [] },
  { path: 'rooms', children: [] },
  { path: 'rooms/:roomId', children: [] },
  { path: 'release-notes', children: [] },
  { path: 'advertise', redirectTo: 'home', pathMatch: 'full' },
  { path: 'ad-booking', redirectTo: 'home', pathMatch: 'full' },
  { path: 'ad-terms', redirectTo: 'home', pathMatch: 'full' },
  { path: 'ad-prohibited', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'gtanalytic',
    loadComponent: () => import('./components/gtanalytic/gtanalytic-layout/gtanalytic-layout').then(m => m.GtanalyticLayoutComponent),
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./components/gtanalytic/gtanalytic-login/gtanalytic-login').then(m => m.GtanalyticLoginComponent) },
      { path: 'overview', canActivate: [gtanalyticAuthGuard], loadComponent: () => import('./components/gtanalytic/gtanalytic-overview/gtanalytic-overview').then(m => m.GtanalyticOverviewComponent) },
      { path: 'streamanalytics', canActivate: [gtanalyticAuthGuard], loadComponent: () => import('./components/gtanalytic/gtanalytic-streams/gtanalytic-streams').then(m => m.GtanalyticStreamsComponent) },
      { path: 'guests', canActivate: [gtanalyticAuthGuard], loadComponent: () => import('./components/gtanalytic/gtanalytic-guests/gtanalytic-guests').then(m => m.GtanalyticGuestsComponent) },
      { path: 'users', canActivate: [gtanalyticAuthGuard], loadComponent: () => import('./components/gtanalytic/gtanalytic-users/gtanalytic-users').then(m => m.GtanalyticUsersComponent) },
      { path: 'rooms', canActivate: [gtanalyticAuthGuard], loadComponent: () => import('./components/gtanalytic/gtanalytic-rooms/gtanalytic-rooms').then(m => m.GtanalyticRoomsComponent) }
    ]
  },
  { path: ':id', children: [] },

  {
    path: 'managegt',
    loadComponent: () => import('./components/managegt-layout/managegt-layout').then(m => m.ManagegtLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./components/managegt-login/managegt-login').then(m => m.ManagegtLoginComponent) },
      { path: 'dashboard', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-dashboard/managegt-dashboard').then(m => m.ManagegtDashboardComponent) },
      { path: 'sections/discovery', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-discovery/managegt-discovery').then(m => m.ManagegtDiscoveryComponent) },
      { path: 'sections', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-sections/managegt-sections').then(m => m.ManagegtSectionsComponent) },
      { path: 'roombots', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-roombots/managegt-roombots').then(m => m.ManagegtRoombotsComponent) },
      { path: 'playlists', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-playlists/managegt-playlists').then(m => m.ManagegtPlaylistsComponent) },
      { path: 'header', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-header/managegt-header').then(m => m.ManagegtHeaderComponent) },
      { path: 'popups', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-popups/managegt-popups').then(m => m.ManagegtPopupsComponent) },
      { path: 'users', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-users/managegt-users').then(m => m.ManagegtUsersComponent) }
    ]
  },
  { path: '**', children: [] } // Catch all for static pages like /terms, /privacy
];
