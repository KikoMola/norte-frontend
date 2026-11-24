import { Component, OnInit, inject } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button } from './button/button';
import { Icon } from './icon/icon';
import { NavGroup, Sidebar } from './sidebar/sidebar';
import { Toaster, Toasts } from './toast/toast';
import { Topbar } from './topbar/topbar';

const groups: NavGroup[] = [
  { items: [{ label: 'shell.nav.home', icon: 'lucideHouse', route: '/', exact: true }] },
  {
    title: 'shell.nav.groups.crm',
    items: [{ label: 'shell.nav.companies', icon: 'lucideBuilding2', route: '/empresas' }],
  },
];

@Component({
  selector: 'app-toast-demo',
  imports: [Toaster],
  template: `<app-toaster />`,
})
class ToastDemo implements OnInit {
  private readonly toasts = inject(Toasts);
  ngOnInit(): void {
    this.toasts.success('Empresa «Bodegas Valdejalón S.C.» dada de alta.');
    this.toasts.error('Ya existe una empresa con ese NIF.', '4bf92f3577b34da6');
  }
}

const meta: Meta = {
  title: 'Componentes/Shell',
  decorators: [moduleMetadata({ imports: [Button, Icon, Sidebar, Topbar, ToastDemo] })],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

const sidebar = (collapsed: boolean) => ({
  props: { groups, collapsed },
  template: `
    <div class="h-[720px] w-fit border-r border-border bg-surface">
      <app-sidebar [groups]="groups" [(collapsed)]="collapsed" label="Navegación principal" homeLabel="Norte, ir al inicio"
        collapseLabel="Contraer menú" expandLabel="Expandir menú" />
    </div>`,
});

export const BarraLateral: Story = { render: () => sidebar(false) };
export const BarraLateralContraida: Story = {
  name: 'Barra lateral contraída',
  render: () => sidebar(true),
};

export const BarraSuperior: Story = {
  render: () => ({
    template: `
      <app-topbar>
        <ng-container topbarEnd>
          <button appButton variant="ghost" iconOnly aria-label="Cambiar a modo oscuro"><app-icon name="lucideMoon" /></button>
          <button appButton variant="ghost" iconOnly aria-label="Cerrar sesión"><app-icon name="lucideLogOut" /></button>
        </ng-container>
      </app-topbar>`,
  }),
};

export const Avisos: Story = {
  render: () => ({ template: `<div class="h-[240px]"><app-toast-demo /></div>` }),
};
