import { Routes } from '@angular/router';
import { mensajesMatcher } from '@core/routing/messages.matcher';
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
        { label: 'Perfil', route: '/developer/profile', icon: 'person' },
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
        // matcher propio: /developer/messages y /developer/messages/<userId> usan la
        // misma entrada (Angular no admite el "?" opcional en `path`), asi el
        // componente no se recrea al cambiar de chat
        matcher: mensajesMatcher,
        title: 'Mensajes',
        loadComponent: () => import('@features/shared/feature/messages/messages').then(m => m.Messages),
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
      {
        path: 'u/:userId',
        loadComponent: () => import('@features/public/feature/public-profile').then(m => m.PublicProfile),
      },
    ],
  },
];
