import { Routes } from '@angular/router';
import { AUTH_REPOSITORY } from './domain/ports/auth.repository';
import { AuthHttpService } from './data-access/api/auth-http.service';

export const routes: Routes = [
  {
    path: 'callback',
    providers: [
      { provide: AUTH_REPOSITORY, useClass: AuthHttpService },
    ],
    loadComponent: () => import('./feature/callback/auth-callback.component').then(m => m.AuthCallbackComponent),
  },
  {
    path: 'role-selection',
    providers: [
      { provide: AUTH_REPOSITORY, useClass: AuthHttpService },
    ],
    loadComponent: () => import('./feature/role-selection/role-selection.component').then(m => m.RoleSelectionComponent),
  },
];
