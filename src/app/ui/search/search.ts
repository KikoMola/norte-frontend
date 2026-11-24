import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * Buscador de barra de herramientas (input-group del lienzo): icono de lupa, 40 px y foco en todo el grupo.
 *
 *   <app-search [(value)]="q" placeholder="Buscar por nombre o NIF" label="Buscar empresas" />
 */
@Component({
  selector: 'app-search',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex h-10 items-center gap-2 rounded-r border border-border-strong bg-surface px-3 text-text-3 ' +
      'focus-within:border-accent focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-accent',
  },
  template: `
    <app-icon name="lucideSearch" />
    <input
      type="search"
      class="h-full min-w-0 flex-1 border-0 bg-transparent text-body text-text outline-none placeholder:text-text-3"
      [placeholder]="placeholder()"
      [attr.aria-label]="label()"
      [value]="value()"
      (input)="value.set($any($event.target).value)"
    />
  `,
})
export class Search {
  readonly value = model('');
  readonly placeholder = input('');
  readonly label = input.required<string>();
}
