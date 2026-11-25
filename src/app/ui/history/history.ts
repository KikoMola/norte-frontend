import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { Button } from '../button/button';
import { Icon, IconName } from '../icon/icon';

/** Un campo que cambió, con su nombre ya traducido. `null`: no tenía valor. */
export interface HistoryChange {
  label: string;
  from: string | null;
  to: string | null;
}

export interface HistoryEvent {
  id: string;
  /** Instante ISO 8601. */
  occurredAt: string;
  action: 'created' | 'updated' | 'deleted';
  /** Nombre de quien hizo el cambio; sin él, fue el sistema. */
  actor?: string;
  changes: readonly HistoryChange[];
}

export type HistoryStatus = 'loading' | 'ready' | 'error';

const ICONS: Record<HistoryEvent['action'], IconName> = {
  created: 'lucidePlus',
  updated: 'lucidePencil',
  deleted: 'lucideTrash2',
};

/**
 * Historial de cambios de un registro (paso 1.4), como en la ficha de empresa del lienzo: una línea por cambio con
 * quién, qué y cuándo, del más reciente al más antiguo. El valor anterior va tachado.
 *
 * No sabe de la API: la feature traduce los nombres de campo y pasa `subject` («la empresa») para las altas y bajas.
 * Con `hasMore`, «Ver más» emite `more`; mientras carga la página siguiente, `status` es `loading` y los eventos ya
 * cargados se siguen viendo.
 */
@Component({
  selector: 'app-history',
  imports: [Button, Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (status() === 'loading' && events().length === 0) {
      <div class="flex flex-col gap-4" aria-busy="true" role="status">
        <span class="sr-only">{{ 'ui.history.loading' | translate }}</span>
        @for (row of skeletonRows; track row) {
          <div class="flex gap-3" aria-hidden="true">
            <div class="size-7 shrink-0 rounded-full bg-surface-3"></div>
            <div class="flex flex-1 flex-col gap-2 pt-1">
              <div class="h-3 w-3/4 rounded-sm bg-surface-3"></div>
              <div class="h-2.5 w-1/4 rounded-sm bg-surface-3"></div>
            </div>
          </div>
        }
      </div>
    } @else if (status() === 'error' && events().length === 0) {
      <div class="flex flex-col items-start gap-3" role="alert">
        <p class="text-text-2">{{ 'ui.history.error' | translate }}</p>
        <button appButton size="sm" (click)="retry.emit()">
          <app-icon name="lucideRefreshCw" />{{ 'ui.table.retry' | translate }}
        </button>
      </div>
    } @else if (events().length === 0) {
      <p class="text-text-2">{{ 'ui.history.empty' | translate }}</p>
    } @else {
      <ol class="flex flex-col">
        @for (event of events(); track event.id; let last = $last) {
          <li class="relative flex gap-3 pb-5 last:pb-0">
            @if (!last) {
              <span
                class="absolute bottom-0 left-3.5 top-8 w-px -translate-x-1/2 bg-border"
                aria-hidden="true"
              ></span>
            }
            <span
              class="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-text-2"
            >
              <app-icon [name]="icons[event.action]" [size]="14" />
            </span>
            <div class="min-w-0 pt-0.5">
              <p class="text-body">
                <span class="font-semibold">{{
                  event.actor ?? ('ui.history.system' | translate)
                }}</span>
                @switch (event.action) {
                  @case ('created') {
                    {{ 'ui.history.created' | translate: { subject: subject() } }}
                  }
                  @case ('deleted') {
                    {{ 'ui.history.deleted' | translate: { subject: subject() } }}
                  }
                  @default {
                    @for (change of event.changes; track change.label; let first = $first) {
                      @if (!first) {
                        <!-- Los espacios van dentro: Angular quita los que hay entre elementos. -->
                        {{ ' ' + ('ui.history.and' | translate) + ' ' }}
                      }
                      {{ 'ui.history.changed' | translate: { field: change.label } }}
                      {{ 'ui.history.from' | translate }}
                      <del class="text-text-2">{{
                        change.from ?? ('ui.history.blank' | translate)
                      }}</del>
                      {{ 'ui.history.to' | translate }}
                      <span>{{ change.to ?? ('ui.history.blank' | translate) }}</span>
                    }
                  }
                }
              </p>
              <p class="mt-0.5 text-small text-text-2">
                <time [attr.datetime]="event.occurredAt">{{ format(event.occurredAt) }}</time>
              </p>
            </div>
          </li>
        }
      </ol>
      @if (status() === 'error') {
        <p class="mt-4 text-small text-err" role="alert">{{ 'ui.history.error' | translate }}</p>
      }
      @if (hasMore()) {
        <button
          appButton
          variant="ghost"
          size="sm"
          class="mt-4"
          [loading]="status() === 'loading'"
          (click)="more.emit()"
        >
          {{ 'ui.history.more' | translate }}
        </button>
      }
    }
  `,
})
export class History {
  private readonly translate = inject(TranslateService);

  readonly events = input<readonly HistoryEvent[]>([]);
  readonly status = input<HistoryStatus>('ready');
  readonly hasMore = input(false, { transform: booleanAttribute });
  /** Lo que se crea o se borra, ya traducido: «la empresa». */
  readonly subject = input('');

  readonly more = output<void>();
  readonly retry = output<void>();

  protected readonly icons = ICONS;
  protected readonly skeletonRows = [0, 1, 2];

  private readonly dateFormat = computed(
    () =>
      new Intl.DateTimeFormat(this.translate.currentLang() || 'es', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
  );

  protected format(instant: string): string {
    return this.dateFormat().format(new Date(instant));
  }
}
