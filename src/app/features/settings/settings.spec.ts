import { TestBed } from '@angular/core/testing';

import { db } from '../../../testing/msw/db';
import { provideTestApp, settle } from '../../../testing/providers';
import { Session } from '../../core/auth/session';
import { Toasts } from '../../ui/toast/toast';
import { CompanySettingsPage } from './company-settings-page';

async function render() {
  TestBed.configureTestingModule({
    imports: [CompanySettingsPage],
    providers: provideTestApp(),
  });
  await TestBed.inject(Session).load();
  const fixture = TestBed.createComponent(CompanySettingsPage);
  await settle(fixture);
  return fixture;
}

function field(element: HTMLElement, name: string): HTMLInputElement | HTMLSelectElement {
  return element.querySelector(`[formcontrolname="${name}"]`)!;
}

function type(element: HTMLElement, name: string, value: string) {
  const input = field(element, name) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
}

function button(element: HTMLElement, text: string): HTMLButtonElement {
  return [...element.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
}

describe('CompanySettingsPage', () => {
  it('shows the current settings', async () => {
    const element = (await render()).nativeElement as HTMLElement;

    expect((field(element, 'legalName') as HTMLInputElement).value).toBe('Acme Ibérica S.L.');
    expect((field(element, 'taxId') as HTMLInputElement).value).toBe('B12345674');
    expect((field(element, 'city') as HTMLInputElement).value).toBe('Valencia');
    expect((field(element, 'country') as HTMLSelectElement).value).toBe('ES');
    expect((field(element, 'timeZone') as HTMLSelectElement).value).toBe('Europe/Madrid');
    expect(
      (field(element, 'fiscalYearStartMonth') as HTMLSelectElement).selectedOptions[0].textContent,
    ).toContain('Enero');
  });

  it('is read only without settings:edit', async () => {
    db.me = { ...db.me!, permissions: ['settings:read'] };
    const element = (await render()).nativeElement as HTMLElement;

    expect(element.querySelector('[role="note"]')?.textContent).toContain('Solo puedes consultar');
    expect(field(element, 'legalName').disabled).toBe(true);
    expect(button(element, 'Guardar cambios')).toBeUndefined();
    expect(button(element, 'Subir logo')).toBeUndefined();
  });

  it('saves with the loaded version and reloads the history', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    const success = vi.spyOn(TestBed.inject(Toasts), 'success');

    type(element, 'legalName', 'Acme Ibérica Holding S.L.');
    type(element, 'taxId', 'b-12345674');
    button(element, 'Guardar cambios').click();
    await settle(fixture, 6);

    expect(success).toHaveBeenCalledWith('Ajustes guardados.');
    expect(db.settings.legalName).toBe('Acme Ibérica Holding S.L.');
    expect(db.settings.taxId).toBe('B12345674');
    expect(db.settingsVersion).toBe(2);
    expect(element.querySelector('app-history li')?.textContent?.replace(/\s+/g, ' ')).toContain(
      'cambió la razón social de Acme Ibérica S.L. a Acme Ibérica Holding S.L.',
    );
  });

  it('warns instead of overwriting when someone else saved first', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    // Otra persona guarda mientras tanto: la versión cargada ya no es la actual.
    db.settingsVersion = 5;

    type(element, 'legalName', 'Mi cambio');
    button(element, 'Guardar cambios').click();
    await settle(fixture);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Otra persona ha cambiado estos ajustes',
    );
    expect(db.settings.legalName).toBe('Acme Ibérica S.L.');
    expect((field(element, 'legalName') as HTMLInputElement).value).toBe('Mi cambio');
  });

  it('shows the errors of the server next to each field', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    type(element, 'taxId', 'B12345675');
    button(element, 'Guardar cambios').click();
    await settle(fixture);

    const taxId = field(element, 'taxId');
    expect(taxId.getAttribute('aria-invalid')).toBe('true');
    expect(
      element.querySelector(`#${taxId.getAttribute('aria-describedby')?.split(' ').at(-1)}`)
        ?.textContent,
    ).toContain('El NIF no es válido');
  });

  it('rejects a logo over 512 KB without uploading it', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    const big = new File([new Uint8Array(512 * 1024 + 1)], 'logo.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [big] });

    input.dispatchEvent(new Event('change'));
    await settle(fixture);

    expect(element.textContent).toContain('El logo no puede pasar de 512 KB.');
    expect(db.settingsVersion).toBe(1);
  });

  it('uploads and removes the logo', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', {
      value: [new File([new Uint8Array(10)], 'logo.png', { type: 'image/png' })],
    });

    input.dispatchEvent(new Event('change'));
    await settle(fixture, 6);
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('Logo de Acme Ibérica S.L.');

    button(element, 'Quitar logo').click();
    await settle(fixture, 6);
    expect(element.querySelector('img')).toBeNull();
  });

  it('shows the history with readable field names', async () => {
    const element = (await render()).nativeElement as HTMLElement;
    const items = element.querySelectorAll('app-history li');

    expect(items).toHaveLength(2);
    expect(items[0].textContent?.replace(/\s+/g, ' ')).toContain(
      'Ana García cambió la razón social de Acme a Acme Ibérica S.L.',
    );
    expect(items[1].textContent?.replace(/\s+/g, ' ')).toContain('El sistema creó los ajustes');
  });
});
