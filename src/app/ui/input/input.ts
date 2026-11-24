import { Directive, booleanAttribute, inject, input } from '@angular/core';

import { Field } from '../field/field';

/**
 * Control de texto del lienzo (paso 0.27): 40 px, borde fuerte, foco con contorno de acento y estado inválido en
 * rojo. Dentro de un app-field toma su id y sus atributos ARIA del campo.
 *
 *   <input appInput type="text" formControlName="name" />
 */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: {
    class:
      'h-10 w-full rounded-r border border-border-strong bg-surface px-3 text-body text-text ' +
      'placeholder:text-text-3 hover:border-text-2 ' +
      'focus:border-accent focus:outline-2 focus:-outline-offset-1 focus:outline-accent ' +
      'disabled:border-border disabled:bg-surface-2 disabled:text-text-3 ' +
      'aria-invalid:border-err aria-invalid:shadow-[inset_0_0_0_1px_var(--err)]',
    '[class.text-right]': 'numeric()',
    '[class.num]': 'numeric()',
    '[id]': 'field?.controlId ?? null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-invalid]': 'field?.invalid() ? "true" : null',
    '[attr.aria-required]': 'field?.required() ? "true" : null',
  },
})
export class Input {
  protected readonly field = inject(Field, { optional: true });
  /** Cifras: alineadas a la derecha y tabulares. */
  readonly numeric = input(false, { transform: booleanAttribute });
}
