import { Routes } from '@angular/router';

export const ClientRoutes: Routes = [
    {
        path: '',
        redirectTo: 'list/enable',
        pathMatch: 'full'
    },
    {
        path: 'list/enable',
        loadComponent: () => import('./components/client-list/client-list.component').then(m => m.ClientListComponent)
    },
    {
        path: 'list/disable',
        loadComponent: () => import('./components/client-list/client-list.component').then(m => m.ClientListComponent)
    },
    {
        path: 'save',
        loadComponent: () => import('./components/client-form/client-form.component').then(m => m.ClientFormComponent)
    },
    {
        path: 'save/:id',
        loadComponent: () => import('./components/client-form/client-form.component').then(m => m.ClientFormComponent)
    }
];