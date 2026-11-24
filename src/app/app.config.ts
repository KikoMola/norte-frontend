import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';

import { routes } from './app.routes';
import { Session } from './core/auth/session';
import { problemInterceptor } from './core/http/problem';
import { I18n, provideI18n } from './core/i18n/i18n';
import { TranslatedTitleStrategy } from './core/i18n/title-strategy';
import { Theme } from './core/theme/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    // La protección XSRF de HttpClient va activada por defecto: lee XSRF-TOKEN y envía X-XSRF-TOKEN.
    provideHttpClient(withFetch(), withInterceptors([problemInterceptor])),
    provideI18n(),
    provideAppInitializer(() => {
      inject(Theme);
      const i18n = inject(I18n);
      const session = inject(Session);
      return Promise.all([i18n.use(i18n.initialLanguage()), session.load()]).then(() => undefined);
    }),
  ],
};
