import { Routes } from '@angular/router';
import { LandingLayout } from './layout/layout';

export const routes: Routes = [
  {
    path: '',
    component: LandingLayout,
    children: [
      { path: '', loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio) },
      { path: 'features', loadComponent: () => import('./pages/features/features').then(m => m.Features) },
      { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
      { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
      { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
      { path: 'download-apk', loadComponent: () => import('./pages/download-apk/download-apk').then(m => m.DownloadApk) },
    ],
  },
];
