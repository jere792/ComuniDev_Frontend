import { Routes } from '@angular/router';
import { ModeratorMain } from '@features/moderator/main';

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
      { path: 'dashboard', loadComponent: () => import('@features/moderator/feature/dashboard/moderator-dashboard').then(m => m.ModeratorDashboard) },
      { path: 'reports', loadComponent: () => import('@features/moderator/feature/reports/reports-page').then(m => m.ReportsPage) },
      // "Revisiones" es el historial de reportes ya resueltos (mismo panel con RESUELTO)
      { path: 'reviews', loadComponent: () => import('@features/moderator/feature/reports/reports-page').then(m => m.ReportsPage), data: { estadoInicial: 'RESUELTO' } },
      { path: 'discover', loadComponent: () => import('@features/shared/feature/discover-users/discover-users').then(m => m.DiscoverUsers) },
      { path: 'u/:userId', loadComponent: () => import('@features/public/feature/public-profile').then(m => m.PublicProfile) },
    ],
  },
];
