import { Routes } from "@angular/router";

export const CoachRoutes: Routes = [
    {
        path: '',
        redirectTo: 'list/enable',
        pathMatch: 'full'
    },
    {
        path: 'list/enable',
        loadComponent: () => import('./components/coach-list/coach-list.component').then(c => c.CoachListComponent)
    },
    {
        path: 'list/disable',
        loadComponent: () => import('./components/coach-list/coach-list.component').then(c => c.CoachListComponent)
    },
    {
        path: 'save',
        loadComponent: () => import('./components/coach-form/coach-form.component').then(c => c.CoachFormComponent)
    },
    {
        path: 'save/:id',
        loadComponent: () => import('./components/coach-form/coach-form.component').then(c => c.CoachFormComponent)
    },
    {
        path: 'schedules/:id',
        loadComponent: () => import('./components/coach-schedule-form/coach-schedule-form.component').then(c => c.CoachScheduleFormComponent)
    }
];