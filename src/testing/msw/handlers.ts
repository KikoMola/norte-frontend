import { HttpResponse, http } from 'msw';

import type { Company, CompanyCreate, CompanyPage, Problem } from '../../app/api';
import { isValidTaxId, normalizeTaxId } from '../../app/core/validation/tax-id';
import { db } from './db';

const API = '/api/v1';
const TRACE_ID = '00000000000000000000000000000000';

function problem(status: number, code: string, title: string, extra: Partial<Problem> = {}) {
  const body: Problem = {
    type: `https://norte.dev/problems/${code.replace(/[._]/g, '-')}`,
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

/**
 * Cursor opaco: desplazamiento y ordenación en base64. Como en el backend, un cursor usado con otra ordenación es un
 * 400 `request.invalid_parameter`.
 */
const encodeCursor = (offset: number, sort: string) => btoa(JSON.stringify({ offset, sort }));
function decodeCursor(cursor: string, sort: string): number | null {
  try {
    const decoded = JSON.parse(atob(cursor)) as { offset: number; sort: string };
    return decoded.sort === sort && Number.isInteger(decoded.offset) ? decoded.offset : null;
  } catch {
    return null;
  }
}

export const handlers = [
  http.get(`${API}/me`, () =>
    db.me
      ? HttpResponse.json(db.me)
      : problem(401, 'auth.unauthenticated', 'Necesitas iniciar sesión'),
  ),

  http.get(`${API}/companies`, ({ request }) => {
    if (!db.me) {
      return problem(401, 'auth.unauthenticated', 'Necesitas iniciar sesión');
    }
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim().toLowerCase();
    const sort = url.searchParams.get('sort') ?? 'name';
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 25), 1), 100);
    const cursor = url.searchParams.get('cursor');
    const offset = cursor ? decodeCursor(cursor, sort) : 0;
    if (offset === null) {
      return problem(400, 'request.invalid_parameter', 'El cursor no es válido');
    }

    const field = sort.replace('-', '') as 'name' | 'createdAt';
    const direction = sort.startsWith('-') ? -1 : 1;
    const filtered = db.companies
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.taxId.toLowerCase().includes(q))
      .sort((a, b) => a[field].localeCompare(b[field], 'es') * direction);

    const items = filtered.slice(offset, offset + limit);
    const hasNext = offset + limit < filtered.length;
    const page: CompanyPage = {
      items,
      // Como el backend real: en la última página nextCursor no llega (ni siquiera como null).
      pageInfo: hasNext ? { hasNext, nextCursor: encodeCursor(offset + limit, sort) } : { hasNext },
    };
    return HttpResponse.json(page);
  }),

  http.post<never, CompanyCreate>(`${API}/companies`, async ({ request }) => {
    if (!db.me) {
      return problem(401, 'auth.unauthenticated', 'Necesitas iniciar sesión');
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
      : problem(404, 'company.not_found', 'La empresa no existe');
  }),

  // Cierre de sesión del BFF: 202 con la URL a la que navegar.
  http.post('/logout', () => {
    db.me = null;
    return new HttpResponse(null, { status: 202, headers: { Location: '/' } });
  }),
];
