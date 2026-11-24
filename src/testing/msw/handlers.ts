import { HttpResponse, http } from 'msw';

import type { Company, CompanyCreate, CompanyPage, Problem } from '../../app/api';
import { isValidTaxId, normalizeTaxId } from '../../app/core/validation/tax-id';
import { db } from './db';

const API = '/api/v1';
const TRACE_ID = '00000000000000000000000000000000';

function problem(status: number, code: string, title: string, extra: Partial<Problem> = {}) {
  const body: Problem = {
    type: `https://norte.dev/problems/${code}`,
    title,
    status,
    code,
    traceId: TRACE_ID,
    ...extra,
  };
  return HttpResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

/** Cursor opaco: el desplazamiento en base64. Suficiente para el mock; el backend usa keyset. */
const encodeCursor = (offset: number) => btoa(String(offset));
const decodeCursor = (cursor: string | null) => (cursor ? Number(atob(cursor)) || 0 : 0);

export const handlers = [
  http.get(`${API}/me`, () =>
    db.me ? HttpResponse.json(db.me) : problem(401, 'unauthorized', 'Necesitas iniciar sesión'),
  ),

  http.get(`${API}/companies`, ({ request }) => {
    if (!db.me) {
      return problem(401, 'unauthorized', 'Necesitas iniciar sesión');
    }
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim().toLowerCase();
    const sort = url.searchParams.get('sort') ?? 'name';
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 25), 1), 100);
    const offset = decodeCursor(url.searchParams.get('cursor'));

    const field = sort.replace('-', '') as 'name' | 'createdAt';
    const direction = sort.startsWith('-') ? -1 : 1;
    const filtered = db.companies
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.taxId.toLowerCase().includes(q))
      .sort((a, b) => a[field].localeCompare(b[field], 'es') * direction);

    const items = filtered.slice(offset, offset + limit);
    const hasNext = offset + limit < filtered.length;
    const page: CompanyPage = {
      items,
      pageInfo: { hasNext, nextCursor: hasNext ? encodeCursor(offset + limit) : null },
    };
    return HttpResponse.json(page);
  }),

  http.post<never, CompanyCreate>(`${API}/companies`, async ({ request }) => {
    if (!db.me) {
      return problem(401, 'unauthorized', 'Necesitas iniciar sesión');
    }
    const body = await request.json();
    const name = body.name?.trim() ?? '';
    const taxId = normalizeTaxId(body.taxId ?? '');
    const errors = [
      ...(name ? [] : [{ field: 'name', code: 'required', message: 'El nombre es obligatorio.' }]),
      ...(isValidTaxId(taxId)
        ? []
        : [{ field: 'taxId', code: 'tax_id.invalid', message: 'El NIF no es válido.' }]),
    ];
    if (errors.length) {
      return problem(422, 'validation', 'Datos no válidos', { errors });
    }
    if (db.companies.some((c) => c.taxId === taxId)) {
      return problem(409, 'company.tax_id.duplicate', 'Ya existe una empresa con ese NIF');
    }
    const now = new Date().toISOString();
    const created: Company = {
      id: crypto.randomUUID(),
      name,
      taxId,
      createdAt: now,
      updatedAt: now,
    };
    db.companies.push(created);
    return HttpResponse.json(created, {
      status: 201,
      headers: { Location: `${API}/companies/${created.id}`, ETag: '"0"' },
    });
  }),

  http.get(`${API}/companies/:companyId`, ({ params }) => {
    const found = db.companies.find((c) => c.id === params['companyId']);
    return found
      ? HttpResponse.json(found, { headers: { ETag: '"0"' } })
      : problem(404, 'not_found', 'No existe');
  }),

  // Cierre de sesión del BFF: 202 con la URL a la que navegar.
  http.post('/logout', () => {
    db.me = null;
    return new HttpResponse(null, { status: 202, headers: { Location: '/' } });
  }),
];
