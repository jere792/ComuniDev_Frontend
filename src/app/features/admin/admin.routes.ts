import { Routes } from '@angular/router';
import { AdminMain } from '@features/admin/main';

export const routes: Routes = [
  {
    path: '',
    component: AdminMain,
    data: {
      sidebarLinks: [
        { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
        { label: 'Usuarios', route: '/admin/users', icon: 'people' },
        { label: 'Configuración', route: '/admin/settings', icon: 'settings' },
      ],
    },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('@features/admin/feature/dashboard/admin-dashboard').then(m => m.AdminDashboard) },
      { path: 'users', loadChildren: () => import('@features/users/users.routes').then(m => m.routes) },
      { path: 'discover', loadComponent: () => import('@features/shared/feature/discover-users/discover-users').then(m => m.DiscoverUsers) },
    ],
  },
];
