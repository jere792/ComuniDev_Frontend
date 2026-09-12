import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./landing/landing.routes').then(m => m.routes),
  },
  {
    path: 'developer',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['developer', 'admin'] },
    loadChildren: () => import('./features/developer/developer.routes').then(m => m.routes),
  },
  {
    path: 'recruiter',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['recruiter', 'admin'] },
    loadChildren: () => import('./features/recruiter/recruiter.routes').then(m => m.routes),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.routes),
  },
  {
    path: 'moderator',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['moderator', 'admin'] },
    loadChildren: () => import('./features/moderator/moderator.routes').then(m => m.routes),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.routes),
  },
  {
    path: 'profile',
    loadChildren: () => import('./features/public/public.routes').then(m => m.routes),
  },
  { path: '**', redirectTo: '' },
];
