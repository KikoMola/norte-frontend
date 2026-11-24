import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { Icon } from '../icon/icon';

let nextId = 0;

/**
 * Campo de formulario (paso 0.27): etiqueta 13/18 peso 500, control, ayuda y error.
 * El control que se proyecta (input[appInput]) toma de aquí su id, aria-describedby y aria-invalid.
 *
 *   <app-field label="NIF" hint="Se guarda en mayúsculas" [error]="taxIdError()" required>
 *     <input appInput formControlName="taxId" />
 *   </app-field>
 */
@Component({
  selector: 'app-field',
  imports: [Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-col gap-1.5' },
  template: `
    <label class="text-small font-medium text-text" [for]="controlId">
      {{ label() }}
      @if (required()) {
        <span class="ml-0.5 text-err" aria-hidden="true">*</span>
        <span class="sr-only">({{ 'ui.field.required' | translate }})</span>
      }
    </label>
    <ng-content />
    @if (error(); as error) {
      <span class="flex items-start gap-1.5 text-micro text-err" [id]="errorId">
        <app-icon name="lucideCircleAlert" [size]="14" class="mt-px" />
        {{ error }}
      </span>
    } @else if (hint()) {
      <span class="text-micro text-text-2" [id]="hintId">{{ hint() }}</span>
    }
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  /** Mensaje de error ya traducido. Con error, el control se marca como inválido. */
  readonly error = input<string | null>();
  readonly required = input(false, { transform: booleanAttribute });

  private readonly id = `field-${nextId++}`;
  readonly controlId = `${this.id}-control`;
  readonly hintId = `${this.id}-hint`;
  readonly errorId = `${this.id}-error`;

  readonly invalid = computed(() => !!this.error());
  readonly describedBy = computed(() =>
    this.error() ? this.errorId : this.hint() ? this.hintId : null,
  );
}
