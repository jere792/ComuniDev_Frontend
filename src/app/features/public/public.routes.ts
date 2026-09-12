import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':userId',
    loadComponent: () => import('./feature/public-profile').then(m => m.PublicProfile),
  },
];
