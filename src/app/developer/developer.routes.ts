import { Routes } from '@angular/router';
import { Developer } from './developer';

export const routes: Routes = [
  {
    path: '',
    component: Developer,
    data: {
      badgeText: 'Developer',
      badgeClass: '',
      sidebarLinks: [
        { label: 'Dashboard', route: '/developer/dashboard', icon: 'dashboard' },
        { label: 'Perfil', route: '/developer/profile', icon: 'person' },
        { label: 'Proyectos', route: '/developer/projects', icon: 'folder' },
      ],
    },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DeveloperDashboard) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.DeveloperProfile) },
    ],
  },
];
