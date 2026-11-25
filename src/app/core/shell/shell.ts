import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { NavGroup, Sidebar } from '../../ui/sidebar/sidebar';
import { Topbar } from '../../ui/topbar/topbar';
import { type BusinessModule } from '../../api';
import { type Permission } from '../auth/permissions';
import { Session } from '../auth/session';
import { I18n } from '../i18n/i18n';
import { Theme } from '../theme/theme';

const COLLAPSED_KEY = 'norte.sidebar.collapsed';

/** Entrada del menú con lo que exige para verse: un permiso y, si es de un módulo contratable, el módulo. */
type ShellNavItem = NavGroup['items'][number] & {
  permission?: Permission;
  module?: BusinessModule;
};
interface ShellNavGroup {
  title?: string;
  items: ShellNavItem[];
}

const NAV: ShellNavGroup[] = [
  { items: [{ label: 'shell.nav.home', icon: 'lucideHouse', route: '/', exact: true }] },
  {
    title: 'shell.nav.groups.crm',
    items: [
      {
        label: 'shell.nav.companies',
        icon: 'lucideBuilding2',
        route: '/empresas',
        permission: 'company:read',
      },
    ],
  },
];

/**
 * Shell de la aplicación (paso 0.28): barra lateral fija y contraíble, barra superior fija y contenido desplazable.
 * La navegación solo muestra lo que existe: Inicio y Empresas. Los grupos (CRM, Ventas, Operaciones, Finanzas) se
 * irán llenando con cada hito; el cambio de organización, el periodo, las notificaciones y la paleta de comandos
 * no se pintan hasta que funcionen.
 */
@Component({
  selector: 'app-shell',
  imports: [Button, Icon, RouterOutlet, Sidebar, Topbar, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-dvh flex-wrap content-start items-start' },
  template: `
    <a
      href="#main"
      class="sr-only z-[60] rounded-r bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >{{ 'shell.skipToContent' | translate }}</a
    >

    <div
      class="sticky top-0 z-20 h-dvh shrink-0 border-r border-border bg-surface max-[900px]:static max-[900px]:h-auto max-[900px]:basis-full max-[900px]:border-b max-[900px]:border-r-0 [@media(max-height:720px)]:overflow-y-auto"
    >
      <app-sidebar
        [groups]="nav()"
        [(collapsed)]="collapsed"
        [label]="'shell.nav.label' | translate"
        [homeLabel]="'shell.homeLink' | translate"
        [collapseLabel]="'shell.collapse' | translate"
        [expandLabel]="'shell.expand' | translate"
      />
    </div>

    <div class="flex min-h-dvh min-w-0 flex-[999_1_560px] flex-col max-[900px]:min-h-0">
      <app-topbar>
        <ng-container topbarEnd>
          <button
            appButton
            variant="ghost"
            iconOnly
            [attr.aria-label]="
              (theme.resolved() === 'dark' ? 'topbar.themeToLight' : 'topbar.themeToDark')
                | translate
            "
            (click)="theme.toggle()"
          >
            <app-icon [name]="theme.resolved() === 'dark' ? 'lucideSun' : 'lucideMoon'" />
          </button>

          @let switchLanguageLabel =
            'topbar.switchLanguage'
              | translate: { language: ('languages.' + i18n.next() | translate) };
          <!-- Solo icono: un texto visible distinto del nombre accesible incumple WCAG 2.5.3. -->
          <button
            appButton
            variant="ghost"
            iconOnly
            [attr.aria-label]="switchLanguageLabel"
            [title]="switchLanguageLabel"
            (click)="switchLanguage()"
          >
            <app-icon name="lucideLanguages" />
          </button>

          @if (session.user(); as user) {
            <div
              class="flex items-center gap-2 pl-1 pr-2"
              [attr.aria-label]="'topbar.account' | translate: { name: displayName() }"
              role="group"
            >
              <span
                class="inline-grid size-8 shrink-0 place-items-center rounded-full bg-surface-3 text-micro font-semibold text-text"
                aria-hidden="true"
                >{{ session.initials() }}</span
              >
              <span class="text-small leading-4 max-[600px]:sr-only">
                <span class="block font-medium">{{ displayName() }}</span>
                <span class="num text-text-2" [title]="user.tenantId">
                  {{ 'topbar.tenant' | translate }} {{ user.tenantId.slice(0, 8) }}
                </span>
              </span>
            </div>
          }

          <button
            appButton
            variant="ghost"
            iconOnly
            [attr.aria-label]="'topbar.logout' | translate"
            (click)="session.logout()"
          >
            <app-icon name="lucideLogOut" />
          </button>
        </ng-container>
      </app-topbar>

      <main
        id="main"
        tabindex="-1"
        class="flex w-full max-w-[1400px] flex-col gap-6 px-8 pb-12 pt-6 outline-none max-[900px]:p-4"
      >
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {
  protected readonly session = inject(Session);
  protected readonly theme = inject(Theme);
  protected readonly i18n = inject(I18n);
  private readonly document = inject(DOCUMENT);

  protected readonly collapsed = signal(this.readCollapsed());

  protected readonly displayName = computed(() => {
    const user = this.session.user();
    return user?.name || user?.username || '';
  });

  /**
   * Etiquetas como claves de traducción: la barra lateral las traduce y cambian con el idioma. Solo se ve lo que el
   * usuario puede usar (pasos 1.2 y 1.3); los grupos que se quedan vacíos desaparecen.
   */
  protected readonly nav = computed<NavGroup[]>(() =>
    NAV.map((group) => ({
      title: group.title,
      items: group.items
        .filter((item) => !item.permission || this.session.can(item.permission))
        .filter((item) => !item.module || this.session.hasModule(item.module))
        .map(({ label, icon, route, exact }) => ({ label, icon, route, exact })),
    })).filter((group) => group.items.length > 0),
  );

  constructor() {
    effect(() => {
      this.document.defaultView?.localStorage?.setItem(COLLAPSED_KEY, String(this.collapsed()));
    });
  }

  protected switchLanguage(): void {
    void this.i18n.use(this.i18n.next());
  }

  private readCollapsed(): boolean {
    try {
      return this.document.defaultView?.localStorage?.getItem(COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
