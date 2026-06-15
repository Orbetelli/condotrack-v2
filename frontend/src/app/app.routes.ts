import { Routes } from '@angular/router';
import { roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login').then(m => m.LoginComponent),
  },
  {
    path: 'porteiro',
    canActivate: [roleGuard(['porteiro', 'sindico', 'admin'])],
    loadComponent: () =>
      import('./porteiro/porteiro').then(m => m.PorteiroComponent),
  },
  {
    path: 'morador',
    canActivate: [roleGuard(['morador'])],
    loadComponent: () =>
      import('./morador/morador').then(m => m.MoradorComponent),
  },
  {
    path: 'sindico',
    canActivate: [roleGuard(['sindico', 'admin'])],
    loadComponent: () =>
      import('./sindico/sindico').then(m => m.SindicoComponent),
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['admin'])],
    loadComponent: () =>
      import('./admin/admin').then(m => m.AdminComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];