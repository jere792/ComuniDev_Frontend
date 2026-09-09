import { Routes } from '@angular/router';
import { Moderator } from './moderator';

export const routes: Routes = [
  {
    path: '',
    component: Moderator,
    data: {
      sidebarLinks: [
        { label: 'Dashboard', route: '/moderator/dashboard', icon: 'dashboard' },
        { label: 'Reportes', route: '/moderator/reports', icon: 'flag' },
        { label: 'Revisiones', route: '/moderator/reviews', icon: 'rate_review' },
      ],
    },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.ModeratorDashboard) },
    ],
  },
];
