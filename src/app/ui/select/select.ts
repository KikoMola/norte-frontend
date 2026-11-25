import { Directive, inject } from '@angular/core';

import { Field } from '../field/field';

/**
 * Desplegable del lienzo (paso 1.9) sobre un `<select>` nativo: mismo alto, borde y foco que app-input. Ser nativo le da
 * gratis el teclado, el lector de pantalla y la lista del sistema en el móvil. Dentro de un app-field toma su id y
 * sus atributos ARIA.
 *
 *   <select appSelect formControlName="language"><option value="es">Español</option>…</select>
 *
 * La búsqueda entre muchas opciones (cliente, producto) es app-combobox, del paso 1.18.
 */
@Directive({
  selector: 'select[appSelect]',
  host: {
    class:
      'h-10 w-full cursor-pointer rounded-r border border-border-strong bg-surface pl-3 pr-8 text-body text-text ' +
      'hover:border-text-2 ' +
      'focus:border-accent focus:outline-2 focus:-outline-offset-1 focus:outline-accent ' +
      'disabled:cursor-default disabled:border-border disabled:bg-surface-2 disabled:text-text-3 ' +
      'aria-invalid:border-err aria-invalid:shadow-[inset_0_0_0_1px_var(--err)]',
    '[id]': 'field?.controlId ?? null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-invalid]': 'field?.invalid() ? "true" : null',
    '[attr.aria-required]': 'field?.required() ? "true" : null',
  },
})
export class Select {
  protected readonly field = inject(Field, { optional: true });
}
