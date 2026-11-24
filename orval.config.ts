import { defineConfig } from 'orval';

/**
 * Cliente de Angular y mocks MSW generados desde el contrato (paso 0.23).
 * El contrato vive en norte-backend (api/openapi.yaml); aquí se vendoriza en api/openapi.yaml con
 * `npm run api:sync -- <ref>`. Lo generado va en src/app/api/generated y no se edita ni se versiona.
 */
export default defineConfig({
  norte: {
    input: { target: './api/openapi.yaml' },
    output: {
      mode: 'tags-split',
      target: 'src/app/api/generated/endpoints',
      schemas: 'src/app/api/generated/model',
      client: 'angular',
      baseUrl: '/api/v1',
      headers: true,
      clean: true,
      prettier: true,
      mock: { generators: [{ type: 'msw', delay: false, useExamples: true, locale: 'es' }] },
      override: {
        angular: { provideIn: 'root', retrievalClient: 'httpClient' },
      },
    },
  },
});
