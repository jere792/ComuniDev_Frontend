import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'callback',
    loadComponent: () => import('@features/auth/feature/callback/auth-callback.component').then(m => m.AuthCallbackComponent),
  },
  {
    path: 'role-selection',
    loadComponent: () => import('@features/auth/feature/role-selection/role-selection.component').then(m => m.RoleSelectionComponent),
  },
];
