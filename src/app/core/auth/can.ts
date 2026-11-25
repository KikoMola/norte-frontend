import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

import { type Permission } from './permissions';
import { Session } from './session';

/**
 * Muestra su contenido solo si el usuario tiene el permiso (paso 1.3). Con una lista, basta con uno de ellos.
 *
 * ```html
 * <button *appCan="'invoice:issue'" appButton>Emitir</button>
 * <a *appCan="'company:edit'; else readOnly" routerLink="nueva">Nueva empresa</a>
 * ```
 *
 * Ocultar no protege nada: el backend vuelve a comprobar el permiso en cada petición.
 */
@Directive({ selector: '[appCan]' })
export class Can {
  private readonly session = inject(Session);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);

  readonly appCan = input.required<Permission | readonly Permission[]>();
  readonly appCanElse = input<TemplateRef<unknown> | null>(null);

  /** Qué se está mostrando, para no recrear la vista si no cambia. */
  private shown: 'content' | 'else' | 'nothing' | null = null;

  constructor() {
    effect(() => {
      const required = this.appCan();
      const allowed = (Array.isArray(required) ? required : [required]).some((permission) =>
        this.session.can(permission),
      );
      const elseTemplate = this.appCanElse();
      const next = allowed ? 'content' : elseTemplate ? 'else' : 'nothing';
      if (next === this.shown) {
        return;
      }
      this.container.clear();
      if (next === 'content') {
        this.container.createEmbeddedView(this.template);
      } else if (next === 'else' && elseTemplate) {
        this.container.createEmbeddedView(elseTemplate);
      }
      this.shown = next;
    });
  }

  static ngTemplateContextGuard(_directive: Can, context: unknown): context is object {
    return context !== null;
  }
}
