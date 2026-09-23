import { Routes } from '@angular/router';
import { DeveloperMain } from '@features/developer/main';

export const routes: Routes = [
  {
    path: '',
    component: DeveloperMain,
    data: {
      sidebarLinks: [
        { label: 'Inicio', route: '/developer/inicio', icon: 'home' },
        { label: 'Reels', route: '/developer/reels', icon: 'smart_display' },
        { label: 'Mensajes', route: '/developer/messages', icon: 'chat' },
        { label: 'Solicitudes', route: '/developer/solicitudes', icon: 'person_add' },
      ],
    },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio',
        loadComponent: () => import('@features/recruiter/pages/inicio/feature/inicio').then(m => m.RecruiterInicio),
        data: { role: 'developer' },
      },
      {
        path: 'reels',
        title: 'Reels',
        loadComponent: () => import('@features/recruiter/pages/reels/feature/reels').then(m => m.RecruiterReels),
      },
      {
        path: 'messages',
        title: 'Mensajes',
        loadComponent: () => import('@features/recruiter/pages/messages/feature/messages').then(m => m.RecruiterMessages),
      },
      {
        path: 'solicitudes',
        title: 'Solicitudes',
        loadComponent: () => import('@features/shared/feature/solicitudes/solicitudes').then(m => m.Solicitudes),
      },
      {
        path: 'discover',
        title: 'Descubrir',
        loadComponent: () => import('@features/shared/feature/discover-users/discover-users').then(m => m.DiscoverUsers),
      },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('@features/developer/feature/dashboard/developer-dashboard').then(m => m.DeveloperDashboard),
      },
      {
        path: 'profile',
        loadChildren: () => import('@features/developer/profile/developer-profile.routes').then(m => m.routes),
      },
    ],
  },
];
