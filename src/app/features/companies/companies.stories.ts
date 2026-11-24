import type { Meta, StoryObj } from '@storybook/angular';
import { HttpResponse, http } from 'msw';

import { CompanyListPage } from './company-list-page';
import { CompanyNewPage } from './company-new-page';

/** Pantallas de empresas con la API simulada por MSW (src/testing/msw). */
const meta: Meta = {
  title: 'Pantallas/Empresas',
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj;

export const Listado: Story = {
  render: () => ({
    moduleMetadata: { imports: [CompanyListPage] },
    template: `<app-company-list-page />`,
  }),
};

export const ListadoVacio: Story = {
  name: 'Listado vacío',
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/companies', () =>
          HttpResponse.json({ items: [], pageInfo: { hasNext: false } }),
        ),
      ],
    },
  },
  render: () => ({
    moduleMetadata: { imports: [CompanyListPage] },
    template: `<app-company-list-page />`,
  }),
};

export const Alta: Story = {
  render: () => ({
    moduleMetadata: { imports: [CompanyNewPage] },
    template: `<app-company-new-page />`,
  }),
};
