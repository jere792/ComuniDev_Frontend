import { Routes, CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';

/**
 * Si el usuario tiene sesión, el perfil se muestra DENTRO del layout de su rol
 * (header + sidebar, como las demás vistas); si no, se renderiza como página
 * pública. Las rutas internas de cada rol usan `/u/:userId`.
 */
const profileInAppGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const userId = route.paramMap.get('userId');
  const role = (localStorage.getItem('role') || '').toLowerCase();

  const base =
    role === 'developer' ? '/developer'
    : role === 'recruiter' ? '/recruiter'
    : role === 'admin' ? '/admin'
    : role === 'moderator' ? '/moderator'
    : null;

  if (base && userId) {
    return inject(Router).createUrlTree([base, 'u', userId]);
  }
  return true;
};

export const routes: Routes = [
  {
    path: ':userId',
    canActivate: [profileInAppGuard],
    loadComponent: () => import('@features/public/feature/public-profile').then(m => m.PublicProfile),
  },
];
