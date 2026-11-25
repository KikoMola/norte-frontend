import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PageHeader } from '../../ui/page-header/page-header';

interface SettingsSection {
  label: string;
  route: string;
}

/** Solo las secciones que existen; series, impuestos y el resto se añaden con sus pasos. */
const SECTIONS: SettingsSection[] = [{ label: 'settings.sections.company', route: 'empresa' }];

/**
 * Ajustes como en el lienzo: submenú de secciones a la izquierda y la sección elegida a la derecha. En pantallas
 * estrechas el submenú pasa arriba y se desplaza en horizontal.
 */
@Component({
  selector: 'app-settings-layout',
  imports: [PageHeader, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <app-page-header [heading]="'settings.title' | translate" />

    <div class="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-8 max-[900px]:grid-cols-1">
      <nav
        class="flex flex-col gap-px max-[900px]:flex-row max-[900px]:overflow-x-auto"
        [attr.aria-label]="'settings.sections.label' | translate"
      >
        @for (section of sections; track section.route) {
          <a
            class="rounded-r px-3 py-2 text-body whitespace-nowrap text-text-2 hover:bg-surface-2 hover:text-text"
            [routerLink]="section.route"
            routerLinkActive="bg-accent-soft font-medium !text-accent-text"
            ariaCurrentWhenActive="page"
          >
            {{ section.label | translate }}
          </a>
        }
      </nav>
      <div class="min-w-0">
        <router-outlet />
      </div>
    </div>
  `,
})
export class SettingsLayout {
  protected readonly sections = SECTIONS;
}
