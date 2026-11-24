import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;
const STORYBOOK_PORT = 6007;
const withStorybook = !!process.env['E2E_STORYBOOK'];

/**
 * E2E contra el servidor de desarrollo en modo mock (MSW en el navegador, sesión simulada como «ana»).
 * Con E2E_STORYBOOK=1 también se pasa axe por todas las stories (necesita `npm run build-storybook` antes).
 * El E2E contra el stack real (BFF + Keycloak) va aparte.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.(spec|a11y)\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'es-ES',
  },
  projects: [
    { name: 'escritorio', testMatch: /.*\.spec\.ts$/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'movil-390',
      testMatch: /.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
    ...(withStorybook
      ? [{ name: 'storybook', testMatch: /.*\.a11y\.ts$/, use: { ...devices['Desktop Chrome'] } }]
      : []),
  ],
  webServer: [
    {
      command: `npm run start:mock -- --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
    ...(withStorybook
      ? [
          {
            command: `node scripts/serve-static.mjs storybook-static ${STORYBOOK_PORT}`,
            url: `http://localhost:${STORYBOOK_PORT}/index.json`,
            reuseExistingServer: !process.env['CI'],
          },
        ]
      : []),
  ],
});
