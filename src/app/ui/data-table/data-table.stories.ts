import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Panel } from '../panel/panel';
import { Search } from '../search/search';
import { DataTable, DataTableColumn } from './data-table';

interface Invoice {
  id: string;
  customer: string;
  number: string;
  total: string;
}

const columns: DataTableColumn<Invoice>[] = [
  { id: 'number', header: 'Número', value: (r) => r.number, sortable: true },
  { id: 'customer', header: 'Cliente', value: (r) => r.customer, sortable: true },
  { id: 'total', header: 'Total', value: (r) => r.total, numeric: true },
];

const rows: Invoice[] = [
  { id: '1', number: 'F-2026-0352', customer: 'Bodegas Valdejalón S.C.', total: '1.210,00 €' },
  { id: '2', number: 'F-2026-0351', customer: 'Cerámicas del Turia S.L.', total: '18.540,25 €' },
  { id: '3', number: 'F-2026-0350', customer: 'Grupo Alvea Logística S.A.', total: '126.480,50 €' },
];

const meta: Meta = {
  title: 'Componentes/Tabla de datos',
  decorators: [moduleMetadata({ imports: [DataTable, Panel, Search] })],
  args: {
    columns,
    rows,
    rowId: (row: Invoice) => row.id,
    status: 'ready',
    sort: { id: 'number', desc: true },
    hasNext: true,
    hasPrevious: false,
    summary: '3 facturas en esta página',
    caption: 'Facturas emitidas',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-panel flush>
        <app-data-table
          [columns]="columns" [rows]="rows" [rowId]="rowId" [status]="status" [sort]="sort"
          [hasNext]="hasNext" [hasPrevious]="hasPrevious" [summary]="summary" [caption]="caption"
          [emptyTitle]="emptyTitle ?? ''" [emptyBody]="emptyBody ?? ''" [traceId]="traceId"
        >
          <div tableToolbar class="flex border-b border-border px-5 py-3">
            <app-search class="max-w-[360px] flex-1" label="Buscar facturas" placeholder="Buscar en facturas" />
          </div>
        </app-data-table>
      </app-panel>`,
  }),
};
export default meta;

type Story = StoryObj;

export const ConDatos: Story = {};
export const Cargando: Story = { args: { status: 'loading' } };
export const Vacia: Story = {
  args: {
    rows: [],
    emptyTitle: 'Aún no hay facturas',
    emptyBody: 'Emite la primera desde un presupuesto o desde cero.',
  },
};
export const ConError: Story = { args: { status: 'error', traceId: '9a1c02e4b7f3' } };
