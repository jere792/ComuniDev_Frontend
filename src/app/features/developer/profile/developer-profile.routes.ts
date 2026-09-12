import { Routes } from '@angular/router';
import { DEVELOPER_PROFILE_REPOSITORY } from './domain/ports/developer-profile.repository';
import { DeveloperProfileGraphqlService } from './data-access/api/developer-profile-graphql.service';

export const routes: Routes = [
  {
    path: '',
    providers: [
      { provide: DEVELOPER_PROFILE_REPOSITORY, useClass: DeveloperProfileGraphqlService },
    ],
    loadComponent: () => import('./feature/developer-profile-page').then(m => m.DeveloperProfilePage),
  },
];
