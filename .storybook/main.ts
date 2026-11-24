import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  staticDirs: [{ from: '../public', to: '/' }],
  core: { disableTelemetry: true },
};

export default config;
