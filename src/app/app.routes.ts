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
    loadChildren: () => import('./developer/developer.routes').then(m => m.routes),
  },
  {
    path: 'recruiter',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['recruiter', 'admin'] },
    loadChildren: () => import('./recruiter/recruiter.routes').then(m => m.routes),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./admin/admin.routes').then(m => m.routes),
  },
  {
    path: 'moderator',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['moderator', 'admin'] },
    loadChildren: () => import('./moderator/moderator.routes').then(m => m.routes),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./auth/callback/auth-callback.component').then(m => m.AuthCallbackComponent),
  },
  {
    path: 'auth/role-selection',
    loadComponent: () => import('./auth/role-selection/role-selection.component').then(m => m.RoleSelectionComponent),
  },
  { path: '**', redirectTo: '' },
];
