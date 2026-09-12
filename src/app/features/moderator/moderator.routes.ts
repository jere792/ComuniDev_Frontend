import { Routes } from '@angular/router';
import { ModeratorMain } from './main';

export const routes: Routes = [
  {
    path: '',
    component: ModeratorMain,
    data: {
      sidebarLinks: [
        { label: 'Dashboard', route: '/moderator/dashboard', icon: 'dashboard' },
        { label: 'Reportes', route: '/moderator/reports', icon: 'flag' },
        { label: 'Revisiones', route: '/moderator/reviews', icon: 'rate_review' },
      ],
    },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./feature/dashboard/moderator-dashboard').then(m => m.ModeratorDashboard) },
    ],
  },
];
