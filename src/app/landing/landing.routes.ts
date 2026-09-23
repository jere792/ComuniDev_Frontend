import { Routes } from '@angular/router';
import { LandingLayout } from '@landing/layout/layout';

export const routes: Routes = [
  {
    path: '',
    component: LandingLayout,
    children: [
      { path: '', loadComponent: () => import('@landing/pages/inicio/inicio').then(m => m.Inicio) },
      { path: 'features', loadComponent: () => import('@landing/pages/features/features').then(m => m.Features) },
      { path: 'about', loadComponent: () => import('@landing/pages/about/about').then(m => m.About) },
      { path: 'contact', loadComponent: () => import('@landing/pages/contact/contact').then(m => m.Contact) },
      { path: 'register', loadComponent: () => import('@landing/pages/register/register').then(m => m.Register) },
      { path: 'forgot-password', loadComponent: () => import('@landing/pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
      { path: 'download-apk', loadComponent: () => import('@landing/pages/download-apk/download-apk').then(m => m.DownloadApk) },
    ],
  },
];
