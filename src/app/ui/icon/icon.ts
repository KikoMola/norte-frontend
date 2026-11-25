import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideArrowUpDown,
  lucideBuilding2,
  lucideChevronLeft,
  lucideChevronRight,
  lucideCircleAlert,
  lucideCircleCheck,
  lucideHouse,
  lucideInfo,
  lucideLanguages,
  lucideLoaderCircle,
  lucideLogOut,
  lucideMoon,
  lucidePanelLeftClose,
  lucidePanelLeftOpen,
  lucidePencil,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideSun,
  lucideTrash2,
  lucideTriangleAlert,
  lucideX,
} from '@ng-icons/lucide';

/** Iconos registrados (set Lucide). Solo los que se usan, para no inflar el bundle. */
const ICONS = {
  lucideArrowDown,
  lucideArrowUp,
  lucideArrowUpDown,
  lucideBuilding2,
  lucideChevronLeft,
  lucideChevronRight,
  lucideCircleAlert,
  lucideCircleCheck,
  lucideHouse,
  lucideInfo,
  lucideLanguages,
  lucideLoaderCircle,
  lucideLogOut,
  lucideMoon,
  lucidePanelLeftClose,
  lucidePanelLeftOpen,
  lucidePencil,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideSun,
  lucideTrash2,
  lucideTriangleAlert,
  lucideX,
};

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/**
 * Icono de trazo 1,75 (paso 0.27). Decorativo por defecto (aria-hidden); con `label` se anuncia como imagen.
 * Un icono nunca es el único portador de significado: los botones de solo icono llevan aria-label.
 */
@Component({
  selector: 'app-icon',
  imports: [NgIcon],
  viewProviders: [provideIcons(ICONS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex shrink-0 leading-none',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() ?? null',
  },
  template: `<ng-icon [name]="name()" [size]="size() + 'px'" strokeWidth="1.75" />`,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(16);
  readonly label = input<string>();
}
