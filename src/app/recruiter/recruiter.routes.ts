import { Routes } from '@angular/router';
import { Recruiter } from './recruiter';

export const routes: Routes = [
  {
    path: '',
    component: Recruiter,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.RecruiterDashboard) },
    ],
  },
];
