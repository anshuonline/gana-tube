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
  { path: '**', children: [] } // Catch all for static pages like /terms, /privacy
];
