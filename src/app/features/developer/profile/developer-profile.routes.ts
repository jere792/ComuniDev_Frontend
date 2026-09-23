import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/developer/profile/feature/developer-profile-page').then(m => m.DeveloperProfilePage),
  },
];
