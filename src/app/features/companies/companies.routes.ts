import { Routes } from '@angular/router';

import { provideFeatureTranslations } from '../../core/i18n/i18n';

/** Empresas (módulo parties del backend). Sus textos se cargan con la ruta: public/i18n/companies/. */
export const COMPANIES_ROUTES: Routes = [
  {
    path: '',
    providers: [provideFeatureTranslations('companies')],
    children: [
      {
        path: '',
        title: 'titles.companies',
        loadComponent: () => import('./company-list-page').then((m) => m.CompanyListPage),
      },
      {
        path: 'nueva',
        title: 'titles.newCompany',
        loadComponent: () => import('./company-new-page').then((m) => m.CompanyNewPage),
      },
    ],
  },
];
