import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { firstValueFrom } from 'rxjs';

import { server } from '../../../testing/msw/server';
import { provideTestApp } from '../../../testing/providers';
import { Toasts } from '../../ui/toast/toast';
import { Session } from '../auth/session';
import { handles } from './http-context';

function problem(status: number, code: string, extra: object = {}) {
  return HttpResponse.json(
    { type: 'x', title: `Título ${code}`, status, code, traceId: 'trace-1', ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

describe('problemInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: provideTestApp() }));

  async function call(context?: ReturnType<typeof handles>) {
    await firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/companies', { context })).catch(
      () => null,
    );
    return TestBed.inject(Toasts).items();
  }

  it('translates the error code and shows the trace', async () => {
    server.use(http.get('/api/v1/companies', () => problem(409, 'company.tax_id.duplicate')));
    const [toast] = await call();
    expect(toast.message).toBe('Ya existe una empresa con ese NIF.');
    expect(toast.traceId).toBe('trace-1');
  });

  it('falls back to the HTTP status and then to the server title', async () => {
    server.use(http.get('/api/v1/companies', () => problem(403, 'some.unknown_code')));
    expect((await call())[0].message).toBe('No tienes permiso para hacer esto.');
    TestBed.inject(Toasts).items.set([]);
    server.use(http.get('/api/v1/companies', () => problem(418, 'teapot')));
    expect((await call())[0].message).toBe('Título teapot');
  });

  it('stays silent for the statuses the caller handles', async () => {
    server.use(http.get('/api/v1/companies', () => problem(422, 'validation', { errors: [] })));
    expect(await call(handles(422))).toEqual([]);
  });

  it('expires the session on 401', async () => {
    const session = TestBed.inject(Session);
    await session.load();
    server.use(http.get('/api/v1/companies', () => problem(401, 'auth.unauthenticated')));
    const [toast] = await call();
    expect(session.status()).toBe('anonymous');
    expect(toast.message).toBe('Tu sesión ha caducado. Vuelve a iniciar sesión.');
  });
});
