import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Barra superior del lienzo (paso 0.27): 60 px, fija arriba, superficie con borde inferior.
 * Contenido a la izquierda (proyección por defecto) y acciones a la derecha ([topbarEnd]).
 * El buscador y paleta de comandos (Ctrl K), el periodo y las notificaciones llegan en hitos posteriores.
 */
@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'sticky top-0 z-[15] flex min-h-15 flex-wrap items-center gap-3 border-b border-border bg-surface px-8 py-2.5 max-[900px]:px-4',
    role: 'banner',
  },
  template: `
    <ng-content />
    <div class="ml-auto flex items-center gap-2"><ng-content select="[topbarEnd]" /></div>
  `,
})
export class Topbar {}
