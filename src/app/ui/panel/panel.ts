import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Panel del lienzo (paso 0.27): superficie con borde completo y radio 6 px, sin sombra.
 * Cabecera opcional con título y acciones, cuerpo y pie.
 *
 *   <app-panel heading="Datos fiscales">
 *     <button appButton panelActions>…</button>
 *     …cuerpo…
 *     <div panelFooter>…</div>
 *   </app-panel>
 *
 * Con `flush`, el cuerpo no lleva relleno (tablas y barras de herramientas a sangre).
 */
@Component({
  selector: 'app-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0 rounded-lg border border-border bg-surface' },
  template: `
    @if (heading()) {
      <header
        class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5"
      >
        <h2 class="text-h3">{{ heading() }}</h2>
        <div class="flex flex-wrap items-center gap-2"><ng-content select="[panelActions]" /></div>
      </header>
    }
    <div [class.p-5]="!flush()">
      <ng-content />
    </div>
    <ng-content select="[panelFooter]" />
  `,
})
export class Panel {
  readonly heading = input<string>();
  readonly flush = input(false, { transform: booleanAttribute });
}
