import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/recruiter/pages/profile/feature/recruiter-profile-page').then(m => m.RecruiterProfilePage),
  },
  {
    path: 'configuracion',
    loadComponent: () => import('@features/recruiter/pages/configuracion/feature/configuracion-page').then(m => m.ConfiguracionPage),
  },
];
