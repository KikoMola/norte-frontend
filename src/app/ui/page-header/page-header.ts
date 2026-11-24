import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Cabecera de página del lienzo (paso 0.27): migas encima del título (h1 24/32) y acciones a la derecha.
 *
 *   <app-page-header heading="Empresas" breadcrumb="CRM">
 *     <a appButton variant="primary" routerLink="nueva">Nueva empresa</a>
 *   </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap items-end justify-between gap-4' },
  template: `
    <div class="min-w-0">
      @if (breadcrumb()) {
        <p class="mb-1 text-small text-text-2">{{ breadcrumb() }}</p>
      }
      <h1 class="text-h1">{{ heading() }}</h1>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <ng-content />
    </div>
  `,
})
export class PageHeader {
  readonly heading = input.required<string>();
  /** Sección a la que pertenece la página (texto plano en el hito 0; app-breadcrumbs llega en el hito 1). */
  readonly breadcrumb = input<string>();
}
