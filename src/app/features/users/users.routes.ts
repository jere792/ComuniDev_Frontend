import { Routes } from '@angular/router';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { UserGraphqlService } from './data-access/api/user-graphql.service';

export const routes: Routes = [
  {
    path: '',
    providers: [
      { provide: USER_REPOSITORY, useClass: UserGraphqlService },
    ],
    loadComponent: () => import('./feature/users-list-page').then(m => m.UsersListPage),
  },
];
