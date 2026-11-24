import { startMockWorker } from './testing/msw/browser';

/** Modo mock (`npm run start:mock`): MSW contesta la API en el navegador. */
export async function startMockApi(): Promise<void> {
  await startMockWorker();
}
