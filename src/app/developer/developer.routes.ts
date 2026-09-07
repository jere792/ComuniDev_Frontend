import { Routes } from '@angular/router';
import { Developer } from './developer';

export const routes: Routes = [
  {
    path: '',
    component: Developer,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DeveloperDashboard) },
    ],
  },
];
