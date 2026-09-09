import { Routes } from '@angular/router';
import { Recruiter } from './recruiter';

export const routes: Routes = [
  {
    path: '',
    component: Recruiter,
    data: {
      badgeText: 'Recruiter',
      badgeClass: '',
      sidebarLinks: [
        { label: 'Inicio', route: '/recruiter/inicio', icon: 'home' },
        { label: 'Reels', route: '/recruiter/reels', icon: 'smart_display' },
        { label: 'Candidatos', route: '/recruiter/candidates', icon: 'people' },
        { label: 'Ofertas', route: '/recruiter/offers', icon: 'work' },
        { label: 'Mensajes', route: '/recruiter/messages', icon: 'chat' },
        { label: 'Guardados', route: '/recruiter/saved', icon: 'bookmark' },
        { label: 'Perfil', route: '/recruiter/profile', icon: 'person' },
      ],
    },
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', loadComponent: () => import('./pages/inicio/inicio').then(m => m.RecruiterInicio) },
      { path: 'reels', loadComponent: () => import('./pages/reels/reels').then(m => m.RecruiterReels) },
      { path: 'candidates', loadComponent: () => import('./pages/candidates/candidates').then(m => m.RecruiterCandidates) },
      { path: 'offers', loadComponent: () => import('./pages/offers/offers').then(m => m.RecruiterOffers) },
      { path: 'messages', loadComponent: () => import('./pages/messages/messages').then(m => m.RecruiterMessages) },
      { path: 'saved', loadComponent: () => import('./pages/saved/saved').then(m => m.RecruiterSaved) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.RecruiterProfile) },
    ],
  },
];
