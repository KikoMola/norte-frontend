import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra el stack real: Angular (4200, con proxy) → BFF (8080) → Keycloak (8180) → app (8081) → PostgreSQL.
 * Es el criterio de salida del hito 0. No corre en CI: necesita el backend levantado (`just up`, `just run-app`,
 * `just run-bff` en norte-backend). Arranca `npm start` si no está ya en marcha.
 */
export default defineConfig({
  testDir: './e2e-real',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  // El primer arranque de `npm start` compila en frío: margen para la primera pantalla.
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:4200',
    locale: 'es-ES',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
