import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { type RowData, injectTable, tableFeatures } from '@tanstack/angular-table';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';

export interface DataTableColumn<T extends RowData> {
  id: string;
  /** Clave de traducción de la cabecera. */
  header: string;
  /** Valor de la celda cuando no hay plantilla propia (appCell). */
  value: (row: T) => string | number | null | undefined;
  /** Cifras: alineadas a la derecha y tabulares. */
  numeric?: boolean;
  sortable?: boolean;
}

export interface DataTableSort {
  id: string;
  desc: boolean;
}

export type DataTableStatus = 'loading' | 'ready' | 'error';

/** Plantilla propia para las celdas de una columna: `<ng-template appCell="name" let-row>…</ng-template>`. */
@Directive({ selector: 'ng-template[appCell]' })
export class DataTableCell<T extends RowData> {
  readonly column = input.required<string>({ alias: 'appCell' });
  readonly template = inject<TemplateRef<{ $implicit: T }>>(TemplateRef);

  static ngTemplateContextGuard<T extends RowData>(
    _dir: DataTableCell<T>,
    _ctx: unknown,
  ): _ctx is { $implicit: T } {
    return true;
  }
}

const features = tableFeatures({});

/**
 * Tabla de datos v1 (paso 0.27), «tipo libro mayor» del lienzo: cabeceras en Plex Condensed 13/16 sobre surface-2,
 * filas de 44 px, cifras a la derecha. Incluye estados de carga, vacío y error, y paginación por cursor
 * (anterior/siguiente). La ordenación es del servidor: la tabla solo emite el cambio.
 * Sin filtros avanzados ni selección todavía (v2, hito 1).
 */
@Component({
  selector: 'app-data-table',
  imports: [Button, Icon, NgTemplateOutlet, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <ng-content select="[tableToolbar]" />

    @switch (status()) {
      @case ('loading') {
        <div class="flex flex-col gap-3.5 p-5" aria-busy="true" role="status">
          <span class="sr-only">{{ 'ui.table.loading' | translate }}</span>
          @for (row of skeletonRows; track row) {
            <div class="flex gap-4" aria-hidden="true">
              <div class="h-3 w-1/3 rounded-sm bg-surface-3"></div>
              <div class="h-3 flex-1 rounded-sm bg-surface-3"></div>
              <div class="h-3 w-20 rounded-sm bg-surface-3"></div>
            </div>
          }
        </div>
      }
      @case ('error') {
        <div class="flex max-w-[480px] flex-col items-start gap-3 px-10 py-6" role="alert">
          <span class="grid size-10 place-items-center rounded-lg bg-err-bg text-err">
            <app-icon name="lucideCircleAlert" [size]="20" />
          </span>
          <h3 class="text-h3">{{ 'ui.table.errorTitle' | translate }}</h3>
          <p class="text-text-2">{{ 'ui.table.errorBody' | translate }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <button appButton size="sm" (click)="retry.emit()">
              <app-icon name="lucideRefreshCw" />{{ 'ui.table.retry' | translate }}
            </button>
            @if (traceId()) {
              <span class="num text-micro text-text-2">{{
                'ui.trace' | translate: { traceId: traceId() }
              }}</span>
            }
          </div>
        </div>
      }
      @default {
        @if (rows().length === 0) {
          <div class="flex max-w-[480px] flex-col items-start gap-3 p-10">
            <span class="grid size-10 place-items-center rounded-lg bg-surface-2 text-text-2">
              <app-icon [name]="emptyIcon()" [size]="20" />
            </span>
            <h3 class="text-h3">{{ emptyTitle() || ('ui.table.empty' | translate) }}</h3>
            @if (emptyBody()) {
              <p class="text-text-2">{{ emptyBody() }}</p>
            }
            <ng-content select="[tableEmpty]" />
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-body">
              @if (caption()) {
                <caption class="sr-only">
                  {{
                    caption()
                  }}
                </caption>
              }
              <thead>
                @for (group of table.getHeaderGroups(); track group.id) {
                  <tr>
                    @for (header of group.headers; track header.id) {
                      @let column = columnById().get(header.column.id)!;
                      <th
                        scope="col"
                        class="whitespace-nowrap border-b border-border bg-surface-2 px-3 py-2.5 text-left font-cond text-cond font-medium text-text-2 first:pl-5 last:pr-5"
                        [class.text-right]="column.numeric"
                        [class.text-text]="sort()?.id === column.id"
                        [attr.aria-sort]="ariaSort(column.id)"
                      >
                        @if (column.sortable) {
                          <button
                            type="button"
                            class="inline-flex cursor-pointer items-center gap-1 rounded-sm font-[inherit] text-[length:inherit] [color:inherit]"
                            [class.flex-row-reverse]="column.numeric"
                            (click)="toggleSort(column.id)"
                          >
                            {{ column.header | translate }}
                            <app-icon [name]="sortIcon(column.id)" [size]="14" />
                            @if (sort()?.id === column.id) {
                              <span class="sr-only">{{
                                (sort()?.desc
                                  ? 'ui.table.sortedDescending'
                                  : 'ui.table.sortedAscending'
                                ) | translate
                              }}</span>
                            }
                          </button>
                        } @else {
                          {{ column.header | translate }}
                        }
                      </th>
                    }
                  </tr>
                }
              </thead>
              <tbody>
                @for (row of table.getRowModel().rows; track row.id) {
                  <tr class="hover:[&>td]:bg-surface-2">
                    @for (cell of row.getAllCells(); track cell.id) {
                      @let column = columnById().get(cell.column.id)!;
                      <td
                        class="h-11 border-b border-border px-3 align-middle first:pl-5 last:pr-5"
                        [class.text-right]="column.numeric"
                        [class.num]="column.numeric"
                        [class.whitespace-nowrap]="column.numeric"
                      >
                        @if (templateFor(cell.column.id); as template) {
                          <ng-container
                            [ngTemplateOutlet]="template"
                            [ngTemplateOutletContext]="{ $implicit: row.original }"
                          />
                        } @else {
                          {{ cell.getValue() }}
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    }

    @if (status() === 'ready' && (rows().length > 0 || hasPrevious())) {
      <footer class="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <span class="text-small text-text-2" aria-live="polite">{{ summary() }}</span>
        <div class="flex items-center gap-2">
          <button
            appButton
            size="sm"
            iconOnly
            [disabled]="!hasPrevious()"
            [attr.aria-label]="'ui.table.previous' | translate"
            (click)="previous.emit()"
          >
            <app-icon name="lucideChevronLeft" />
          </button>
          <button
            appButton
            size="sm"
            iconOnly
            [disabled]="!hasNext()"
            [attr.aria-label]="'ui.table.next' | translate"
            (click)="next.emit()"
          >
            <app-icon name="lucideChevronRight" />
          </button>
        </div>
      </footer>
    }
  `,
})
export class DataTable<T extends RowData> {
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly rowId = input.required<(row: T) => string>();
  readonly status = input<DataTableStatus>('ready');
  /** Descripción de la tabla para lectores de pantalla. */
  readonly caption = input<string>();
  readonly sort = model<DataTableSort | null>(null);
  readonly hasPrevious = input(false, { transform: booleanAttribute });
  readonly hasNext = input(false, { transform: booleanAttribute });
  /** Texto del pie («5 empresas en esta página»), ya traducido. */
  readonly summary = input('');
  readonly emptyTitle = input('');
  readonly emptyBody = input('');
  readonly emptyIcon = input<'lucideBuilding2' | 'lucideSearch'>('lucideBuilding2');
  readonly traceId = input<string>();

  readonly previous = output();
  readonly next = output();
  readonly retry = output();

  private readonly cells = contentChildren(DataTableCell);
  protected readonly skeletonRows = [0, 1, 2, 3, 4];

  protected readonly columnById = computed(
    () => new Map(this.columns().map((column) => [column.id, column])),
  );
  private readonly tableColumns = computed(() =>
    this.columns().map((column) => ({
      id: column.id,
      header: column.header,
      accessorFn: column.value,
    })),
  );

  protected readonly table = injectTable(() => ({
    features,
    columns: this.tableColumns(),
    data: this.rows(),
    getRowId: (row: T) => this.rowId()(row),
  }));

  protected templateFor(columnId: string): TemplateRef<{ $implicit: T }> | null {
    return (
      (this.cells().find((cell) => cell.column() === columnId)?.template as TemplateRef<{
        $implicit: T;
      }>) ?? null
    );
  }

  protected toggleSort(id: string): void {
    const current = this.sort();
    this.sort.set({ id, desc: current?.id === id ? !current.desc : false });
  }

  protected ariaSort(id: string): 'ascending' | 'descending' | 'none' | null {
    if (!this.columnById().get(id)?.sortable) {
      return null;
    }
    const sort = this.sort();
    return sort?.id === id ? (sort.desc ? 'descending' : 'ascending') : 'none';
  }

  protected sortIcon(id: string): 'lucideArrowUp' | 'lucideArrowDown' | 'lucideArrowUpDown' {
    const sort = this.sort();
    return sort?.id === id
      ? sort.desc
        ? 'lucideArrowDown'
        : 'lucideArrowUp'
      : 'lucideArrowUpDown';
  }
}
