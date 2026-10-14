import { authGuard } from './core/security/guards/auth.guard';
import { RoleEnum } from './core/enums/role.enum';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/authentication/auth.routes').then(c => c.AuthRoutes)
  },
  {
    path: 'application',
    canActivate: [authGuard([RoleEnum.ADMINISTRATOR, RoleEnum.SUPERVISOR])],
    loadComponent: () =>
      import('./layouts/components/main-layout/main-layout.component').then(c => c.MainLayoutComponent),
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('./features/home/home.routes').then(c => c.HomeRoutes)
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then(c => c.UsersRoutes)
      },
      {
        path: 'audits',
        loadChildren: () =>
          import('./features/audits/audit.routes').then(c => c.auditRoutes)
      },
      {
        path: 'schedules',
        loadChildren: () =>
          import('./features/schedules/schedule.routes').then(c => c.ScheduleRoutes)
      },
      {
        path: 'coaches',
        loadChildren: () =>
          import('./features/coaches/coach.routes').then(c => c.CoachRoutes)
      },
      {
        path: 'clients',
        loadChildren: () =>
          import('./features/clients/client.routes').then(c => c.ClientRoutes)
      },
      {
        path: 'contributions',
        loadChildren: () =>
          import('./features/contribution/contribution.routes').then(c => c.contributionRoutes)
      },
      {
        path: 'settings',
        loadChildren: () => 
          import('./features/settings/settings.route').then(c => c.SettingsRoutes)
      }
    ]
  }
];
