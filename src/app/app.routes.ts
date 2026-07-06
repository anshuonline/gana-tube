import { Routes } from '@angular/router';
import { App } from './app';
import { PlaylistPageComponent } from './components/playlist-page/playlist-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', children: [] },
  { path: 'search', children: [] },
  { path: 'library', children: [] },
  { path: 'socials', children: [] },
  { path: 'profile', children: [] },
  { path: 'playlist/:id', children: [] },
  { path: 'admin/manage-songs', loadComponent: () => import('./components/admin-manage-songs/admin-manage-songs').then(m => m.AdminManageSongsComponent) },
  { 
    path: 'managegt', 
    loadComponent: () => import('./components/managegt-layout/managegt-layout').then(m => m.ManagegtLayoutComponent),
    children: [
      { path: '', redirectTo: 'sections', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./components/managegt-login/managegt-login').then(m => m.ManagegtLoginComponent) },
      { path: 'sections', loadComponent: () => import('./components/managegt-sections/managegt-sections').then(m => m.ManagegtSectionsComponent) },
      { path: 'playlists', loadComponent: () => import('./components/managegt-playlists/managegt-playlists').then(m => m.ManagegtPlaylistsComponent) },
      { path: 'header', loadComponent: () => import('./components/managegt-header/managegt-header').then(m => m.ManagegtHeaderComponent) }
    ]
  },
  { path: '**', children: [] } // Catch all for static pages like /terms, /privacy
];
