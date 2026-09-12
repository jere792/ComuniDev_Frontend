import { Routes } from '@angular/router';
import { RECRUITER_PROFILE_REPOSITORY } from './domain/ports/recruiter-profile.repository';
import { RecruiterProfileGraphqlService } from './data-access/api/recruiter-profile-graphql.service';

export const routes: Routes = [
  {
    path: '',
    providers: [
      { provide: RECRUITER_PROFILE_REPOSITORY, useClass: RecruiterProfileGraphqlService },
    ],
    loadComponent: () => import('./feature/recruiter-profile-page').then(m => m.RecruiterProfilePage),
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./configuracion/feature/configuracion-page').then(m => m.ConfiguracionPage),
  },
];
