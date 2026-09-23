import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':userId',
    loadComponent: () => import('@features/public/feature/public-profile').then(m => m.PublicProfile),
  },
];
