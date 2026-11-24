import { ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button } from './button/button';
import { Field } from './field/field';
import { ICON_NAMES, Icon } from './icon/icon';
import { Input } from './input/input';
import { PageHeader } from './page-header/page-header';
import { Panel } from './panel/panel';
import { Search } from './search/search';

/** Componentes básicos del hito 0 (paso 0.27). Cada story se revisa en claro y oscuro y con el panel de accesibilidad. */
const meta: Meta = {
  title: 'Componentes',
  decorators: [
    moduleMetadata({
      imports: [Button, Field, Icon, Input, PageHeader, Panel, ReactiveFormsModule, Search],
    }),
  ],
};
export default meta;

type Story = StoryObj;

export const Iconos: Story = {
  render: () => ({
    props: { names: ICON_NAMES },
    template: `
      <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
        @for (name of names; track name) {
          <div class="flex flex-col items-center gap-2 rounded-r border border-border px-2 pb-2.5 pt-3.5 text-text">
            <app-icon [name]="name" [size]="20" />
            <code class="text-micro text-text-2">{{ name }}</code>
          </div>
        }
      </div>`,
  }),
};

export const Botones: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <button appButton variant="primary"><app-icon name="lucidePlus" />Nueva empresa</button>
          <button appButton variant="secondary">Exportar CSV</button>
          <button appButton variant="ghost">Cancelar</button>
          <button appButton variant="danger">Anular factura</button>
          <button appButton variant="primary" disabled>Deshabilitado</button>
          <button appButton variant="primary" loading>Guardando…</button>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button appButton variant="primary" size="sm">Pequeño</button>
          <button appButton size="sm">Secundario pequeño</button>
          <button appButton variant="ghost" iconOnly aria-label="Cerrar"><app-icon name="lucideX" /></button>
          <button appButton size="sm" iconOnly aria-label="Página siguiente"><app-icon name="lucideChevronRight" /></button>
          <a appButton variant="primary" href="#">Enlace con aspecto de botón</a>
        </div>
      </div>`,
  }),
};

export const Campos: Story = {
  render: () => ({
    template: `
      <div class="grid max-w-[720px] grid-cols-2 gap-x-5 gap-y-4">
        <app-field label="Razón social" hint="Tal como figura en el registro mercantil." required>
          <input appInput value="Cerámicas del Turia S.L." />
        </app-field>
        <app-field label="NIF">
          <input appInput placeholder="B12345678" />
        </app-field>
        <app-field label="NIF" error="El NIF no es válido. Revisa la letra de control.">
          <input appInput value="B12345670" />
        </app-field>
        <app-field label="Código de cliente" hint="Se asigna automáticamente.">
          <input appInput value="CLI-00418" disabled />
        </app-field>
        <app-field label="Límite de crédito">
          <input appInput numeric value="3.000,00" />
        </app-field>
        <div class="flex flex-col gap-1.5">
          <span class="text-small font-medium">Buscador</span>
          <app-search label="Buscar empresas" placeholder="Buscar por nombre o NIF" />
        </div>
      </div>`,
  }),
};

export const PanelYCabecera: Story = {
  name: 'Panel y cabecera de página',
  render: () => ({
    template: `
      <div class="flex flex-col gap-6">
        <app-page-header heading="Empresas" breadcrumb="CRM">
          <button appButton variant="primary"><app-icon name="lucidePlus" />Nueva empresa</button>
        </app-page-header>
        <app-panel heading="Datos fiscales">
          <button appButton size="sm" panelActions>Editar</button>
          <p class="text-text-2">Contenido del panel: borde completo, radio de 6 px y sin sombra.</p>
          <div panelFooter class="flex justify-end gap-2 border-t border-border px-5 py-3">
            <button appButton variant="ghost">Cancelar</button>
            <button appButton variant="primary">Guardar</button>
          </div>
        </app-panel>
      </div>`,
  }),
};
