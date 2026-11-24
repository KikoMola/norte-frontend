import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/angular';

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: { claro: 'light', oscuro: 'dark' },
      defaultTheme: 'claro',
      attributeName: 'data-theme',
    }),
  ],
  parameters: {
    layout: 'padded',
    // Las violaciones de axe fallan los tests de Storybook, no son solo avisos.
    a11y: { test: 'error' },
    controls: { expanded: true },
  },
};

export default preview;
