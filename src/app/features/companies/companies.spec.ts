import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpResponse, http } from 'msw';

import { company, db } from '../../../testing/msw/db';
import { server } from '../../../testing/msw/server';
import { provideTestApp, settle } from '../../../testing/providers';
import { Session } from '../../core/auth/session';
import { Toasts } from '../../ui/toast/toast';
import { CompanyListPage } from './company-list-page';
import { CompanyNewPage } from './company-new-page';

async function render<T>(component: new () => T) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: provideTestApp([{ path: 'empresas', children: [] }]),
  });
  // Como al arrancar la aplicación: la sesión (con sus permisos) se carga antes de pintar nada.
  await TestBed.inject(Session).load();
  const fixture = TestBed.createComponent(component);
  await settle(fixture);
  return fixture;
}

function type(element: HTMLElement, selector: string, value: string) {
  const input = element.querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
}

describe('CompanyListPage', () => {
  it('hides «Nueva empresa» without company:edit', async () => {
    db.me = { ...db.me!, permissions: ['company:read'] };
    const fixture = await render(CompanyListPage);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('tbody tr').length).toBe(5);
    expect(element.querySelector('a[href$="nueva"]')).toBeNull();
  });

  it('lists the companies sorted by name', async () => {
    const fixture = await render(CompanyListPage);
    const rows = [...(fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')];
    expect(rows.map((row) => row.querySelector('td')?.textContent?.trim())).toEqual([
      'Acme Ibérica S.L.',
      'Construcciones Duero S.A.',
      'Distribuciones Turia S.L.',
      'Globex Levante S.A.',
      'Talleres Ebro S.L.',
    ]);
  });

  it('searches by name or tax id', async () => {
    const fixture = await render(CompanyListPage);
    type(fixture.nativeElement, 'input[type="search"]', 'B50000009');
    await new Promise((resolve) => setTimeout(resolve, 350));
    await settle(fixture);
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Talleres Ebro');
  });

  it('pages with the cursor and treats an omitted nextCursor as the last page', async () => {
    db.companies = Array.from({ length: 30 }, (_, i) =>
      company(`Empresa ${String(i).padStart(2, '0')}`, 'B12345674', '2026-11-01T00:00:00Z'),
    );
    const fixture = await render(CompanyListPage);
    const element = fixture.nativeElement as HTMLElement;
    const next = () =>
      element.querySelector<HTMLButtonElement>('button[aria-label="Página siguiente"]')!;
    expect(element.querySelectorAll('tbody tr').length).toBe(25);
    expect(next().disabled).toBe(false);

    next().click();
    await settle(fixture);
    expect(element.querySelectorAll('tbody tr').length).toBe(5);
    expect(next().disabled).toBe(true);
    expect(
      element.querySelector<HTMLButtonElement>('button[aria-label="Página anterior"]')!.disabled,
    ).toBe(false);
  });

  it('shows the empty state with a call to action', async () => {
    db.companies = [];
    const fixture = await render(CompanyListPage);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Aún no hay empresas');
    expect(element.querySelector('a[href="/nueva"], a[href$="nueva"]')).not.toBeNull();
  });

  it('shows the error state with the trace and retries', async () => {
    server.use(
      http.get('/api/v1/companies', () =>
        HttpResponse.json(
          { type: 'x', title: 'Error', status: 500, code: 'internal', traceId: 'trace-500' },
          { status: 500 },
        ),
      ),
    );
    const fixture = await render(CompanyListPage);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('trace-500');
    server.resetHandlers();
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    await settle(fixture);
    expect(element.querySelectorAll('tbody tr').length).toBe(5);
  });
});

describe('CompanyNewPage', () => {
  it('creates the company and goes back to the list', async () => {
    const fixture = await render(CompanyNewPage);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const element = fixture.nativeElement as HTMLElement;
    type(element, 'input[formControlName="name"]', 'Nueva Empresa S.L.');
    // NIF válido que no está en los datos de ejemplo, en minúsculas: se normaliza al guardar.
    type(element, 'input[formControlName="taxId"]', 'q2826000h');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(
      db.companies.some((c) => c.name === 'Nueva Empresa S.L.' && c.taxId === 'Q2826000H'),
    ).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/empresas']);
    expect(TestBed.inject(Toasts).items()[0].message).toContain('Nueva Empresa S.L.');
  });

  it('shows required errors without calling the server', async () => {
    const fixture = await render(CompanyNewPage);
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(element.querySelectorAll('[aria-invalid="true"]').length).toBe(2);
    expect(element.textContent).toContain('Este campo es obligatorio.');
  });

  it('paints the 422 errors of the server next to each field', async () => {
    const fixture = await render(CompanyNewPage);
    const element = fixture.nativeElement as HTMLElement;
    type(element, 'input[formControlName="name"]', 'Acme');
    type(element, 'input[formControlName="taxId"]', 'B12345670');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
    const taxId = element.querySelector('input[formControlName="taxId"]')!;
    expect(taxId.getAttribute('aria-invalid')).toBe('true');
    expect(element.textContent).toContain('El NIF no es válido. Revisa la letra de control.');
    expect(TestBed.inject(Toasts).items()).toEqual([]);
  });

  it('shows a duplicated tax id (409) on the tax id field', async () => {
    const fixture = await render(CompanyNewPage);
    const element = fixture.nativeElement as HTMLElement;
    type(element, 'input[formControlName="name"]', 'Otra Acme');
    type(element, 'input[formControlName="taxId"]', 'B12345674');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(element.textContent).toContain('Ya existe una empresa con ese NIF.');
  });
});
