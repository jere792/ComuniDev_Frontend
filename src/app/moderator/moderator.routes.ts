import { Routes } from '@angular/router';
import { Moderator } from './moderator';

export const routes: Routes = [
  {
    path: '',
    component: Moderator,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.ModeratorDashboard) },
    ],
  },
];
