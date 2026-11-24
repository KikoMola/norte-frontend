import type { Meta, StoryObj } from '@storybook/angular';

const colors = [
  ['bg', 'Fondo de la aplicación'],
  ['surface', 'Paneles y controles'],
  ['surface-2', 'Cabeceras de tabla, hover'],
  ['surface-3', 'Esqueletos, avatares'],
  ['border', 'Bordes de paneles'],
  ['border-strong', 'Bordes de controles'],
  ['accent', 'Acento: acción principal'],
  ['accent-soft', 'Acento suave: elemento activo'],
  ['ok-bg', 'Estado correcto'],
  ['warn-bg', 'Aviso'],
  ['err-bg', 'Error'],
  ['neu-bg', 'Neutro'],
] as const;

const type = [
  ['text-display', 'Display 32/40'],
  ['text-h1', 'Título 1 24/32'],
  ['text-h2', 'Título 2 20/28'],
  ['text-h3', 'Título 3 16/24'],
  ['text-body', 'Cuerpo 14/20'],
  ['text-small', 'Pequeño 13/18'],
  ['text-micro', 'Micro 12/16'],
] as const;

const meta: Meta = {
  title: 'Fundamentos/Tokens',
  render: () => ({
    props: { colors, type },
    template: `
      <div class="flex flex-col gap-8">
        <section class="flex flex-col gap-3">
          <h2 class="text-h2">Color</h2>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            @for (c of colors; track c[0]) {
              <div class="flex flex-col gap-2">
                <div class="h-14 rounded-r border border-border" [style.background]="'var(--' + c[0] + ')'"></div>
                <span class="text-small font-medium">{{ c[0] }}</span>
                <span class="text-micro text-text-2">{{ c[1] }}</span>
              </div>
            }
          </div>
        </section>
        <section class="flex flex-col gap-3">
          <h2 class="text-h2">Tipografía</h2>
          @for (t of type; track t[0]) {
            <p [class]="t[0]">{{ t[1] }} · Facturación de noviembre</p>
          }
          <p class="font-cond text-cond font-medium text-text-2">Condensada 13/16 · CABECERA DE TABLA</p>
          <p class="num">Cifras tabulares: 1.234,56 € · 98.765,40 €</p>
        </section>
        <section class="flex flex-col gap-3">
          <h2 class="text-h2">Radios</h2>
          <div class="flex gap-4">
            <div class="size-16 rounded-sm border border-border-strong bg-surface-2"></div>
            <div class="size-16 rounded-r border border-border-strong bg-surface-2"></div>
            <div class="size-16 rounded-lg border border-border-strong bg-surface-2"></div>
          </div>
        </section>
      </div>`,
  }),
};

export default meta;
export const Tokens: StoryObj = {};
