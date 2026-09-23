import { Routes } from '@angular/router';
import { RecruiterMain } from '@features/recruiter/main';

export const routes: Routes = [
  {
    path: '',
    component: RecruiterMain,
    data: {
      badgeText: 'Recruiter',
      badgeClass: '',
      sidebarLinks: [
        { label: 'Inicio', route: '/recruiter/inicio', icon: 'home' },
        { label: 'Reels', route: '/recruiter/reels', icon: 'smart_display' },
        { label: 'Candidatos', route: '/recruiter/candidates', icon: 'people' },
        { label: 'Ofertas', route: '/recruiter/offers', icon: 'work' },
      ],
    },
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', loadComponent: () => import('@features/recruiter/pages/inicio/feature/inicio').then(m => m.RecruiterInicio) },
      { path: 'reels', loadComponent: () => import('@features/recruiter/pages/reels/feature/reels').then(m => m.RecruiterReels) },
      { path: 'candidates', loadComponent: () => import('@features/recruiter/pages/candidates/feature/candidates').then(m => m.RecruiterCandidates) },
      { path: 'offers', loadComponent: () => import('@features/recruiter/pages/offers/feature/offers').then(m => m.RecruiterOffers) },
      { path: 'messages', loadComponent: () => import('@features/recruiter/pages/messages/feature/messages').then(m => m.RecruiterMessages) },
      { path: 'saved', loadComponent: () => import('@features/recruiter/pages/saved/feature/saved').then(m => m.RecruiterSaved) },
      { path: 'discover', loadComponent: () => import('@features/shared/feature/discover-users/discover-users').then(m => m.DiscoverUsers) },
      { path: 'solicitudes', loadComponent: () => import('@features/shared/feature/solicitudes/solicitudes').then(m => m.Solicitudes) },
      { path: 'profile', loadChildren: () => import('@features/recruiter/pages/profile/recruiter-profile.routes').then(m => m.routes) },
    ],
  },
];
