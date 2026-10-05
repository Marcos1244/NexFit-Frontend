import { Routes } from '@angular/router';

export const ScheduleRoutes: Routes = [
    {
        path: '',
        redirectTo: 'list/enable',
        pathMatch: 'full'
    },
    {
        path: 'list/enable',
        loadComponent: () => import('./components/schedule-list/schedule-list.component').then(m => m.ScheduleListComponent),
    },
    {
        path: 'list/disable',
        loadComponent: () => import('./components/schedule-list/schedule-list.component').then(m => m.ScheduleListComponent),
    },
    {
        path: 'save',
        loadComponent: () => import('./components/schedule-form/schedule-form.component').then(m => m.ScheduleFormComponent),
    },
    {
        path: 'save/:id',
        loadComponent: () => import('./components/schedule-form/schedule-form.component').then(m => m.ScheduleFormComponent),
    }
];