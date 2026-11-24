import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;

/**
 * E2E contra el servidor de desarrollo en modo mock (MSW en el navegador, sesión simulada como «ana»).
 * El E2E contra el stack real (BFF + Keycloak) va aparte.
 */
export default defineConfig({
  testDir: './e2e',
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
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'movil-390',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: `npm run start:mock -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
