import { authGuard } from '../../core/security/guards/auth.guard';
import { RoleEnum } from '../../core/enums/role.enum';
import { Routes } from '@angular/router';

export const UsersRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list/enable',
    pathMatch: 'full'
  },
  {
    path: 'list/enable',
    loadComponent: () =>
      import('./components/user-list/user-list.component').then((c) => c.UserListComponent),
  },
  {
    path: 'list/disable',
    loadComponent: () =>
      import('./components/user-list/user-list.component').then((c) => c.UserListComponent),
  },
  {
    path: 'save',
    canActivate: [authGuard([RoleEnum.ADMINISTRATOR])],
    loadComponent: () =>
      import('./components/user-form/user-form.component').then((c) => c.UserFormComponent),
  },
  {
    path: 'save/:id',
    canActivate: [authGuard([RoleEnum.ADMINISTRATOR])],
    loadComponent: () =>
      import('./components/user-form/user-form.component').then((c) => c.UserFormComponent),
  },
];
