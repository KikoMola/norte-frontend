import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';

import { provideTestTranslations } from '../../testing/i18n';
import { Button } from './button/button';
import {
  DataTable,
  DataTableColumn,
  DataTableSort,
  DataTableStatus,
} from './data-table/data-table';
import { Field } from './field/field';
import { Input } from './input/input';
import { Sidebar } from './sidebar/sidebar';
import { Toaster, Toasts } from './toast/toast';

async function render<T>(component: new () => T) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [provideTestTranslations(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(component);
  await fixture.whenStable();
  return fixture;
}

describe('Button', () => {
  @Component({
    imports: [Button],
    template: `<button appButton variant="primary" [loading]="loading()">Guardar</button>`,
  })
  class Host {
    loading = signal(false);
  }

  it('applies the primary variant and marks itself busy while loading', async () => {
    const fixture = await render(Host);
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.className).toContain('bg-accent');
    expect(button.getAttribute('aria-busy')).toBeNull();
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});

describe('Field and Input', () => {
  @Component({
    imports: [Field, Input, ReactiveFormsModule],
    template: `
      <app-field label="NIF" hint="Ayuda" [error]="error()" required>
        <input appInput [formControl]="control" />
      </app-field>
    `,
  })
  class Host {
    control = new FormControl('');
    error = signal<string | null>(null);
  }

  it('links the label, hint and error to the control', async () => {
    const fixture = await render(Host);
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input')!;
    const label = element.querySelector('label')!;
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(
      element.querySelector(`#${input.getAttribute('aria-describedby')}`)?.textContent,
    ).toContain('Ayuda');

    fixture.componentInstance.error.set('El NIF no es válido.');
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(
      element.querySelector(`#${input.getAttribute('aria-describedby')}`)?.textContent,
    ).toContain('El NIF no es válido.');
  });
});

interface Row {
  id: string;
  name: string;
  amount: number;
}

describe('DataTable', () => {
  @Component({
    imports: [DataTable],
    template: `
      <app-data-table
        [columns]="columns"
        [rows]="rows()"
        [rowId]="rowId"
        [status]="status()"
        [(sort)]="sort"
        [hasNext]="true"
        summary="2 filas"
        emptyTitle="Nada por aquí"
        (next)="nextClicks = nextClicks + 1"
      />
    `,
  })
  class Host {
    columns: DataTableColumn<Row>[] = [
      { id: 'name', header: 'companies.list.columns.name', value: (r) => r.name, sortable: true },
      { id: 'amount', header: 'Importe', value: (r) => r.amount, numeric: true },
    ];
    rows = signal<Row[]>([
      { id: '1', name: 'Acme', amount: 10 },
      { id: '2', name: 'Globex', amount: 20 },
    ]);
    status = signal<DataTableStatus>('ready');
    sort = signal<DataTableSort | null>(null);
    rowId = (row: Row) => row.id;
    nextClicks = 0;
  }

  it('renders rows with numeric cells aligned right', async () => {
    const fixture = await render(Host);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('tbody tr').length).toBe(2);
    expect(element.querySelector('tbody td:last-child')?.classList).toContain('text-right');
    expect(element.textContent).toContain('2 filas');
  });

  it('toggles the server sort from the column header', async () => {
    const fixture = await render(Host);
    const header = (fixture.nativeElement as HTMLElement).querySelector(
      'th button',
    ) as HTMLButtonElement;
    header.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.sort()).toEqual({ id: 'name', desc: false });
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('th')?.getAttribute('aria-sort'),
    ).toBe('ascending');
    header.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.sort()).toEqual({ id: 'name', desc: true });
  });

  it('shows loading, empty and error states', async () => {
    const fixture = await render(Host);
    const element = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.status.set('loading');
    await fixture.whenStable();
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();

    fixture.componentInstance.status.set('error');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No se han podido cargar los datos',
    );

    fixture.componentInstance.status.set('ready');
    fixture.componentInstance.rows.set([]);
    await fixture.whenStable();
    expect(element.textContent).toContain('Nada por aquí');
  });

  it('emits next from the pager', async () => {
    const fixture = await render(Host);
    const next = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Página siguiente"]',
    ) as HTMLButtonElement;
    next.click();
    expect(fixture.componentInstance.nextClicks).toBe(1);
  });
});

describe('Toasts', () => {
  it('announces errors assertively with their trace', async () => {
    const fixture = await render(Toaster);
    TestBed.inject(Toasts).error('Algo ha fallado', 'abc123');
    await fixture.whenStable();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain('Algo ha fallado');
    expect(alert.textContent).toContain('abc123');
  });

  it('can be dismissed', async () => {
    const fixture = await render(Toaster);
    const toasts = TestBed.inject(Toasts);
    toasts.success('Guardado');
    await fixture.whenStable();
    ((fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement).click();
    expect(toasts.items()).toEqual([]);
  });
});

describe('Sidebar', () => {
  @Component({
    imports: [Sidebar],
    template: `<app-sidebar
      [groups]="groups"
      [(collapsed)]="collapsed"
      label="Navegación principal"
      homeLabel="Inicio"
      collapseLabel="Contraer menú"
      expandLabel="Expandir menú"
    />`,
  })
  class Host {
    collapsed = signal(false);
    groups = [
      {
        items: [{ label: 'shell.nav.home', icon: 'lucideHouse' as const, route: '/', exact: true }],
      },
    ];
  }

  it('collapses with Ctrl+B and keeps labels for screen readers', async () => {
    const fixture = await render(Host);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.collapsed()).toBe(true);
    const label = (fixture.nativeElement as HTMLElement).querySelector('a.nav-item span')!;
    expect(label.classList).toContain('sr-only');
    expect(label.textContent).toContain('Inicio');
  });
});
