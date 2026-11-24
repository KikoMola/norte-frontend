import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

import { Icon } from '../icon/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border-border-strong bg-surface text-text hover:bg-surface-2',
  ghost: 'bg-transparent text-text hover:bg-surface-2',
  danger: 'bg-err text-surface hover:opacity-90',
};

/**
 * Botón del lienzo (paso 0.27): 40 px (32 px en `sm`), radio 4 px, peso 500.
 * Se aplica a un <button> o <a> nativo para conservar su semántica y su comportamiento con teclado:
 *
 *   <button appButton variant="primary" type="submit">Guardar</button>
 *   <button appButton variant="ghost" iconOnly aria-label="Cerrar"><app-icon name="lucideX" /></button>
 */
@Component({
  // Componente de atributo a propósito: se aplica al <button>/<a> nativo para conservar su semántica.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appButton], a[appButton]',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.aria-disabled]': 'loading() ? "true" : null',
  },
  template: `
    @if (loading()) {
      <app-icon name="lucideLoaderCircle" class="animate-spin" />
    }
    <ng-content />
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() => {
    const size = this.size() === 'sm' ? 'h-8 text-small' : 'h-10 text-body';
    const padding = this.iconOnly()
      ? this.size() === 'sm'
        ? 'w-8 px-0'
        : 'w-10 px-0'
      : this.size() === 'sm'
        ? 'px-3'
        : 'px-4';
    return [
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-r border border-transparent',
      'font-medium leading-none no-underline cursor-pointer select-none',
      'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-2 disabled:text-text-3',
      size,
      padding,
      VARIANTS[this.variant()],
      this.loading() ? 'pointer-events-none' : '',
    ].join(' ');
  });
}
