import { Routes } from '@angular/router';
import { DeveloperMain } from '@features/developer/main';

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
      { path: 'dashboard', loadComponent: () => import('@features/developer/feature/dashboard/developer-dashboard').then(m => m.DeveloperDashboard) },
      { path: 'discover', loadComponent: () => import('@features/shared/feature/discover-users/discover-users').then(m => m.DiscoverUsers) },
      { path: 'solicitudes', loadComponent: () => import('@features/shared/feature/solicitudes/solicitudes').then(m => m.Solicitudes) },
      { path: 'profile', loadChildren: () => import('@features/developer/profile/developer-profile.routes').then(m => m.routes) },
    ],
  },
];
