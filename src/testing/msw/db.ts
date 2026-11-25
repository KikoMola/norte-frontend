import type { AuditEvent, Company, CompanySettings, Me } from '../../app/api';
import { getGetMeResponseMock } from '../../app/api/mocks';

/**
 * Base de datos en memoria para MSW: modo mock en desarrollo, Vitest, Storybook y E2E.
 * Imita las reglas del backend que importan a la interfaz (NIF normalizado y único por tenant).
 */
export interface MockDb {
  me: Me | null;
  companies: Company[];
  /** Ajustes de la empresa (paso 1.9) con su versión para If-Match y su historial, del más reciente al más antiguo. */
  settings: CompanySettings;
  settingsVersion: number;
  settingsHistory: AuditEvent[];
}

const seedCompanies = (): Company[] => [
  company('Acme Ibérica S.L.', 'B12345674', '2026-11-24T09:30:00Z'),
  company('Globex Levante S.A.', 'A58818501', '2026-11-23T16:05:00Z'),
  company('Talleres Ebro S.L.', 'B50000009', '2026-11-20T11:12:00Z'),
  company('Construcciones Duero S.A.', 'A47000005', '2026-11-18T08:45:00Z'),
  company('Distribuciones Turia S.L.', 'B46000006', '2026-11-12T17:20:00Z'),
];

const seedSettings = (): CompanySettings => ({
  legalName: 'Acme Ibérica S.L.',
  tradeName: 'Acme',
  taxId: 'B12345674',
  address: {
    line1: 'Calle Mayor 1',
    postalCode: '46001',
    city: 'Valencia',
    province: 'Valencia',
    country: 'ES',
  },
  email: 'facturas@acme.test',
  phone: '+34 961 000 000',
  fiscalYearStartMonth: 1,
  timeZone: 'Europe/Madrid',
  language: 'es',
});

const seedSettingsHistory = (): AuditEvent[] => [
  {
    id: '2',
    occurredAt: '2026-11-24T17:05:00Z',
    action: 'updated',
    actor: { id: 'user-ana', name: 'Ana García' },
    changes: [{ field: 'legalName', from: 'Acme', to: 'Acme Ibérica S.L.' }],
  },
  { id: '1', occurredAt: '2026-11-20T09:00:00Z', action: 'created', changes: [] },
];

export const db: MockDb = {
  me: getGetMeResponseMock(),
  companies: seedCompanies(),
  settings: seedSettings(),
  settingsVersion: 1,
  settingsHistory: seedSettingsHistory(),
};

/** Vuelve al estado inicial (entre tests). */
export function resetDb(overrides: Partial<MockDb> = {}): void {
  db.me = getGetMeResponseMock();
  db.companies = seedCompanies();
  db.settings = seedSettings();
  db.settingsVersion = 1;
  db.settingsHistory = seedSettingsHistory();
  Object.assign(db, overrides);
}

export function company(name: string, taxId: string, createdAt: string): Company {
  return { id: crypto.randomUUID(), name, taxId, createdAt, updatedAt: createdAt };
}
