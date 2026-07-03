import { Routes } from '@angular/router';
import { BlankComponent } from './pages/blank/blank.component';

export const routes: Routes = [
  { path: '', component: BlankComponent },
  { path: '**', component: BlankComponent }
];
