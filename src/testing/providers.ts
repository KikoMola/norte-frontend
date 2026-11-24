import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, Provider } from '@angular/core';
import { Routes, provideRouter } from '@angular/router';

import { problemInterceptor } from '../app/core/http/problem';
import { provideTestTranslations } from './i18n';

/**
 * Proveedores de la aplicación para tests: HttpClient real contra MSW (src/testing/msw), el interceptor de errores,
 * las traducciones reales en español y un router.
 */
export function provideTestApp(routes: Routes = []): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withFetch(), withInterceptors([problemInterceptor])),
    provideTestTranslations(),
    provideRouter(routes),
  ];
}

/** Espera a que terminen las peticiones a MSW y se estabilice la vista. */
export async function settle(
  fixture: { whenStable(): Promise<unknown>; detectChanges(): void },
  rounds = 3,
) {
  for (let i = 0; i < rounds; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();
  }
}
