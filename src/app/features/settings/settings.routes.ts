import { Routes } from '@angular/router';

import { provideFeatureTranslations } from '../../core/i18n/i18n';

/** Ajustes del tenant (paso 1.9). Sus textos se cargan con la ruta: public/i18n/settings/. */
export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideFeatureTranslations('settings')],
    loadComponent: () => import('./settings-layout').then((m) => m.SettingsLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'empresa' },
      {
        path: 'empresa',
        title: 'titles.settings',
        loadComponent: () => import('./company-settings-page').then((m) => m.CompanySettingsPage),
      },
    ],
  },
];
