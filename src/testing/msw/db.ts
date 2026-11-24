import type { Company, Me } from '../../app/api';
import { getGetMeResponseMock } from '../../app/api/mocks';

/**
 * Base de datos en memoria para MSW: modo mock en desarrollo, Vitest, Storybook y E2E.
 * Imita las reglas del backend que importan a la interfaz (NIF normalizado y único por tenant).
 */
export interface MockDb {
  me: Me | null;
  companies: Company[];
}

const seedCompanies = (): Company[] => [
  company('Acme Ibérica S.L.', 'B12345674', '2026-11-24T09:30:00Z'),
  company('Globex Levante S.A.', 'A58818501', '2026-11-23T16:05:00Z'),
  company('Talleres Ebro S.L.', 'B50000009', '2026-11-20T11:12:00Z'),
  company('Construcciones Duero S.A.', 'A47000005', '2026-11-18T08:45:00Z'),
  company('Distribuciones Turia S.L.', 'B46000006', '2026-11-12T17:20:00Z'),
];

export const db: MockDb = { me: getGetMeResponseMock(), companies: seedCompanies() };

/** Vuelve al estado inicial (entre tests). */
export function resetDb(overrides: Partial<MockDb> = {}): void {
  db.me = getGetMeResponseMock();
  db.companies = seedCompanies();
  Object.assign(db, overrides);
}

export function company(name: string, taxId: string, createdAt: string): Company {
  return { id: crypto.randomUUID(), name, taxId, createdAt, updatedAt: createdAt };
}
