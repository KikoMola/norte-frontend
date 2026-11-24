/**
 * En producción y con `npm start` no hay API simulada. La configuración `mock` de angular.json sustituye este fichero
 * por mock-api.mock.ts (fileReplacements), así que MSW nunca entra en el bundle de producción.
 */
export async function startMockApi(): Promise<void> {
  // Sin API simulada.
}
