import { Routes } from '@angular/router';

export const contributionRoutes: Routes = [
    {
        path: '',
        redirectTo: 'list/enable',
        pathMatch: 'full'
    },
    {
        path: 'list/:status',
        loadComponent: () => import('./components/contribution-list/contribution-list.component').then(c => c.ContributionListComponent)
    },
    {
        path: 'save',
        loadComponent: () => import('./components/contribution-form/contribution-form.component').then(c => c.ContributionFormComponent)
    },
    {
        path: 'save/:id',
        loadComponent: () => import('./components/contribution-form/contribution-form.component').then(c => c.ContributionFormComponent)
    }
];