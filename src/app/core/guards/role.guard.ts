import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as string[];
  const userRole = authService.getRole();

  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
