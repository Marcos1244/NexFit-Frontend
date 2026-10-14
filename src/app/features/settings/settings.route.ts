import { Routes } from "@angular/router";

export const SettingsRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/settings-form/settings-form.component').then(c => c.SettingsFormComponent)
    }
];