import { Routes } from '@angular/router';
import { App } from './app';
import { PlaylistPageComponent } from './components/playlist-page/playlist-page.component';
import { ManageAdsComponent } from './pages/manage-ads/manage-ads';

export const routes: Routes = [
  { path: '', component: App },
  { path: 'manageads', component: ManageAdsComponent },
  { path: 'playlist/:id', component: PlaylistPageComponent }
];
