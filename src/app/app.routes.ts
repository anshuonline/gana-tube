import { Routes } from '@angular/router';
import { App } from './app';
import { PlaylistPageComponent } from './components/playlist-page/playlist-page.component';
import { managegtAuthGuard } from './guards/managegt-auth.guard';

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
  { path: 'gtanalytic', loadComponent: () => import('./components/analytics-page/analytics-page.component').then(m => m.AnalyticsPageComponent) },
  { path: ':id', children: [] },

  { 
    path: 'managegt', 
    loadComponent: () => import('./components/managegt-layout/managegt-layout').then(m => m.ManagegtLayoutComponent),
    children: [
      { path: '', redirectTo: 'sections', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./components/managegt-login/managegt-login').then(m => m.ManagegtLoginComponent) },
      { path: 'sections/discovery', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-discovery/managegt-discovery').then(m => m.ManagegtDiscoveryComponent) },
      { path: 'sections', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-sections/managegt-sections').then(m => m.ManagegtSectionsComponent) },
      { path: 'playlists', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-playlists/managegt-playlists').then(m => m.ManagegtPlaylistsComponent) },
      { path: 'header', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-header/managegt-header').then(m => m.ManagegtHeaderComponent) },
      { path: 'users', canActivate: [managegtAuthGuard], loadComponent: () => import('./components/managegt-users/managegt-users').then(m => m.ManagegtUsersComponent) }
    ]
  },
  { path: '**', children: [] } // Catch all for static pages like /terms, /privacy
];
