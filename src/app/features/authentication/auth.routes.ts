import { Routes } from '@angular/router';

export const AuthRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/login/login.component').then(c => c.LoginComponent)
  }
];
