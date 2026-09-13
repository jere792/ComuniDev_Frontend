import { Routes } from '@angular/router';
import { RecruiterMain } from './main';

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
      { path: 'inicio', loadComponent: () => import('./feature/inicio/inicio').then(m => m.RecruiterInicio) },
      { path: 'reels', loadComponent: () => import('./feature/reels/reels').then(m => m.RecruiterReels) },
      { path: 'candidates', loadComponent: () => import('./feature/candidates/candidates').then(m => m.RecruiterCandidates) },
      { path: 'offers', loadComponent: () => import('./feature/offers/offers').then(m => m.RecruiterOffers) },
      { path: 'messages', loadComponent: () => import('./feature/messages/messages').then(m => m.RecruiterMessages) },
      { path: 'saved', loadComponent: () => import('./feature/saved/saved').then(m => m.RecruiterSaved) },
      { path: 'discover', loadComponent: () => import('../shared/feature/discover-users/discover-users').then(m => m.DiscoverUsers) },
      { path: 'profile', loadChildren: () => import('./profile/recruiter-profile.routes').then(m => m.routes) },
    ],
  },
];
