import { Routes } from '@angular/router';
import { Admin } from './admin';

export const routes: Routes = [
  {
    path: '',
    component: Admin,
    data: {
      sidebarLinks: [
        { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
        { label: 'Usuarios', route: '/admin/users', icon: 'people' },
        { label: 'Configuración', route: '/admin/settings', icon: 'settings' },
      ],
    },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.AdminDashboard) },
    ],
  },
];
