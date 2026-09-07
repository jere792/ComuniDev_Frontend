import { Routes } from '@angular/router';
import { LandingLayout } from './layout/layout';

export const routes: Routes = [
  {
    path: '',
    component: LandingLayout,
    children: [
      { path: '', loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio) },
      { path: 'features', loadComponent: () => import('./pages/features/features').then(m => m.Features) },
      { path: 'about', loadComponent: () => import('./pages/about/about').then(m => m.About) },
      { path: 'contact', loadComponent: () => import('./pages/contact/contact').then(m => m.Contact) },
      { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
      { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
      { path: 'download-apk', loadComponent: () => import('./pages/download-apk/download-apk').then(m => m.DownloadApk) },
    ],
  },
];
