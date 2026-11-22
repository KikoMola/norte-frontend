import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { Session } from './core/auth/session';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // La protección XSRF de HttpClient va activada por defecto: lee XSRF-TOKEN y envía X-XSRF-TOKEN.
    provideHttpClient(withFetch()),
    provideAppInitializer(() => inject(Session).load()),
  ],
};
