import { Routes } from '@angular/router';
import { AuditList } from './components/audit-list/audit-list.component';

export const auditRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    component: AuditList
  }
];