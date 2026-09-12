import { Routes } from '@angular/router';
import { DeveloperMain } from './main';

export const routes: Routes = [
  {
    path: '',
    component: DeveloperMain,
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
      { path: 'dashboard', loadComponent: () => import('./feature/dashboard/developer-dashboard').then(m => m.DeveloperDashboard) },
      { path: 'profile', loadChildren: () => import('./profile/developer-profile.routes').then(m => m.routes) },
    ],
  },
];
