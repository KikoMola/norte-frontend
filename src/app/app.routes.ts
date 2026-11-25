import { Routes } from '@angular/router';

import { requirePermission } from './core/auth/guards';

/** Rutas en español (son parte de la interfaz); cada feature se carga de forma diferida con sus traducciones. */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'titles.home',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'empresas',
    canMatch: [requirePermission('company:read')],
    loadChildren: () =>
      import('./features/companies/companies.routes').then((m) => m.COMPANIES_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
