import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/users/feature/users-list-page').then(m => m.UsersListPage),
  },
];
