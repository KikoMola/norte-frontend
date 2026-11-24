import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { Icon, IconName } from '../icon/icon';

export interface NavItem {
  /** Clave de traducción. */
  label: string;
  icon: IconName;
  route: string;
  /** Activo solo con la ruta exacta (Inicio). */
  exact?: boolean;
}

export interface NavGroup {
  /** Clave de traducción del título del grupo (CRM, Ventas…). Sin título, los elementos van sueltos. */
  title?: string;
  items: NavItem[];
}

/**
 * Barra lateral del lienzo (paso 0.27): 240 px, contraíble a 64 px solo con iconos (Ctrl B).
 * Contraída, las etiquetas siguen disponibles para lectores de pantalla y aparecen como tooltip.
 */
@Component({
  selector: 'app-sidebar',
  imports: [Icon, RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
  styles: `
    .is-collapsed .nav-item:hover::after,
    .is-collapsed .nav-item:focus-visible::after {
      content: attr(data-label);
      position: absolute;
      left: calc(100% + 10px);
      top: 50%;
      transform: translateY(-50%);
      z-index: 30;
      background: var(--text);
      color: var(--bg);
      font-size: 12px;
      line-height: 16px;
      font-weight: 500;
      padding: 6px 8px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
    }
  `,
  template: `
    <nav
      class="flex h-full min-h-dvh flex-col gap-1 bg-surface transition-[width] duration-150 max-[900px]:min-h-0 max-[900px]:w-full"
      [class]="
        collapsed() ? 'is-collapsed w-16 items-center px-2.5 pb-4 pt-3' : 'w-60 px-3 pb-4 pt-3'
      "
      [attr.aria-label]="label()"
    >
      <a
        routerLink="/"
        class="flex items-center gap-2.5 pb-3.5 pt-1.5 text-text no-underline hover:text-text"
        [class.px-2]="!collapsed()"
        [attr.aria-label]="homeLabel()"
      >
        <span class="grid size-7 shrink-0 place-items-center rounded-r bg-accent text-on-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 6 20l6-4 6 4z" fill="currentColor" />
          </svg>
        </span>
        <span class="text-brand font-semibold tracking-[-0.01em]" [class.sr-only]="collapsed()">{{
          brand()
        }}</span>
      </a>

      @for (group of groups(); track $index) {
        <div
          class="flex w-full flex-col gap-px py-2"
          [class.items-center]="collapsed()"
          [class.border-t]="collapsed() && group.title"
          [class.border-border]="collapsed()"
        >
          @if (group.title) {
            <span
              class="px-2.5 pb-1.5 pt-1 text-micro font-medium text-text-3"
              [class.sr-only]="collapsed()"
              >{{ group.title | translate }}</span
            >
          }
          @for (item of group.items; track item.route) {
            <a
              class="nav-item relative flex min-h-9 w-full items-center gap-2.5 rounded-r px-2.5 text-body text-text-2 no-underline hover:bg-surface-2 hover:text-text"
              [class]="collapsed() ? 'min-h-10 w-11 justify-center px-0' : ''"
              [routerLink]="item.route"
              routerLinkActive="bg-accent-soft font-medium !text-accent-text"
              [routerLinkActiveOptions]="{ exact: !!item.exact }"
              ariaCurrentWhenActive="page"
              [attr.data-label]="item.label | translate"
            >
              <app-icon [name]="item.icon" />
              <span class="truncate" [class.sr-only]="collapsed()">{{
                item.label | translate
              }}</span>
            </a>
          }
        </div>
      }

      <div
        class="mt-auto flex w-full flex-col gap-px border-t border-border pt-2"
        [class.items-center]="collapsed()"
      >
        <button
          type="button"
          class="nav-item relative flex min-h-9 w-full cursor-pointer items-center gap-2.5 rounded-r border-0 bg-transparent px-2.5 text-left text-body text-text-2 hover:bg-surface-2 hover:text-text"
          [class]="collapsed() ? 'min-h-10 w-11 justify-center px-0' : ''"
          [attr.aria-expanded]="!collapsed()"
          [attr.data-label]="collapsed() ? expandLabel() : collapseLabel()"
          (click)="toggle()"
        >
          <app-icon [name]="collapsed() ? 'lucidePanelLeftOpen' : 'lucidePanelLeftClose'" />
          <span class="truncate" [class.sr-only]="collapsed()">{{
            collapsed() ? expandLabel() : collapseLabel()
          }}</span>
          <kbd
            class="ml-auto rounded-sm border border-b-2 border-border bg-surface px-1.5 py-px font-sans text-micro text-text-2"
            [class.sr-only]="collapsed()"
            >Ctrl B</kbd
          >
        </button>
      </div>
    </nav>
  `,
})
export class Sidebar {
  readonly groups = input.required<NavGroup[]>();
  readonly collapsed = model(false);
  readonly label = input.required<string>();
  readonly brand = input('Norte');
  readonly homeLabel = input.required<string>();
  readonly collapseLabel = input.required<string>();
  readonly expandLabel = input.required<string>();

  toggle(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      event.key.toLowerCase() === 'b'
    ) {
      event.preventDefault();
      this.toggle();
    }
  }
}
