import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

/** Modo mock en desarrollo (`npm run start:mock`): la API la contesta MSW en el navegador. */
export async function startMockWorker(): Promise<void> {
  await setupWorker(...handlers).start({ onUnhandledFrame: 'bypass', quiet: true });
}
