import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { type Preview, applicationConfig } from '@storybook/angular';
import { setupWorker } from 'msw/browser';
import { mswLoader } from 'msw-storybook-addon/csf3';

import { problemInterceptor } from '../src/app/core/http/problem';
import { provideTestTranslations } from '../src/testing/i18n';
import { handlers } from '../src/testing/msw/handlers';

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [
        provideTestTranslations(),
        // Sin navegación inicial: la URL del iframe de Storybook no es una ruta de la aplicación.
        provideRouter([], withDisabledInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([problemInterceptor])),
      ],
    }),
    withThemeByDataAttribute({
      themes: { claro: 'light', oscuro: 'dark' },
      defaultTheme: 'claro',
      attributeName: 'data-theme',
    }),
  ],
  // MSW contesta la API en las stories de pantallas (worker servido desde src/mock-public). Los handlers
  // comunes de src/testing/msw son los iniciales; cada story puede sobrescribirlos con parameters.msw.
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker(...handlers);
      await worker.start({ onUnhandledFrame: 'bypass', quiet: true });
      return worker;
    }),
  ],
  parameters: {
    layout: 'padded',
    // Las violaciones de axe fallan los tests de Storybook, no son solo avisos.
    a11y: { test: 'error' },
    controls: { expanded: true },
    backgrounds: { disable: true },
  },
};

export default preview;
