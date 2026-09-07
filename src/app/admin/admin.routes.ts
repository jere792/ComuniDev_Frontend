import { Routes } from '@angular/router';
import { Admin } from './admin';

export const routes: Routes = [
  {
    path: '',
    component: Admin,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.AdminDashboard) },
    ],
  },
];
