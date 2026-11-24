import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { type Company, CompaniesService, type ListCompaniesSort } from '../../api';
import { toProblem } from '../../core/http/http-context';
import { I18n } from '../../core/i18n/i18n';
import { Button } from '../../ui/button/button';
import {
  DataTable,
  DataTableCell,
  DataTableColumn,
  DataTableSort,
} from '../../ui/data-table/data-table';
import { Icon } from '../../ui/icon/icon';
import { PageHeader } from '../../ui/page-header/page-header';
import { Panel } from '../../ui/panel/panel';
import { Search } from '../../ui/search/search';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Listado de empresas (paso 0.29), según el lienzo y limitado a lo que da el contrato: nombre, NIF y alta.
 * Búsqueda (q), ordenación del servidor (sort) y paginación por cursor con «anterior» y «siguiente».
 */
@Component({
  selector: 'app-company-list-page',
  imports: [
    Button,
    DataTable,
    DataTableCell,
    Icon,
    PageHeader,
    Panel,
    RouterLink,
    Search,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <app-page-header
      [heading]="'companies.list.title' | translate"
      [breadcrumb]="'companies.list.breadcrumb' | translate"
    >
      <a appButton variant="primary" routerLink="nueva">
        <app-icon name="lucidePlus" />{{ 'companies.list.new' | translate }}
      </a>
    </app-page-header>

    <app-panel flush>
      <app-data-table
        [columns]="columns()"
        [rows]="rows()"
        [rowId]="rowId"
        [status]="status()"
        [traceId]="traceId()"
        [caption]="'companies.list.caption' | translate"
        [(sort)]="sort"
        [hasPrevious]="cursors().length > 1"
        [hasNext]="!!nextCursor()"
        [summary]="'companies.list.pageCount' | translate: { count: rows().length }"
        [emptyIcon]="query() ? 'lucideSearch' : 'lucideBuilding2'"
        [emptyTitle]="
          query()
            ? ('companies.list.noResultsTitle' | translate: { q: query() })
            : ('companies.list.emptyTitle' | translate)
        "
        [emptyBody]="
          (query() ? 'companies.list.noResultsBody' : 'companies.list.emptyBody') | translate
        "
        (next)="goNext()"
        (previous)="goPrevious()"
        (retry)="companies.reload()"
      >
        <div
          tableToolbar
          class="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3"
        >
          <app-search
            class="max-w-[360px] flex-[1_1_240px]"
            [(value)]="searchText"
            [placeholder]="'companies.list.search' | translate"
            [label]="'companies.list.searchLabel' | translate"
          />
        </div>

        <ng-template appCell="name" let-company>
          <span class="font-medium text-text">{{ company.name }}</span>
        </ng-template>

        @if (!query()) {
          <a tableEmpty appButton variant="primary" size="sm" routerLink="nueva">
            <app-icon name="lucidePlus" />{{ 'companies.list.new' | translate }}
          </a>
        }
      </app-data-table>
    </app-panel>
  `,
})
export class CompanyListPage {
  protected readonly api = inject(CompaniesService);
  private readonly i18n = inject(I18n);

  /** Texto del buscador; la consulta se lanza con retardo para no pedir a cada tecla. */
  protected readonly searchText = signal('');
  protected readonly query = signal('');
  protected readonly sort = signal<DataTableSort | null>({ id: 'name', desc: false });
  /** Pila de cursores: el último es el de la página actual (null = primera página). */
  protected readonly cursors = signal<(string | null)[]>([null]);

  protected readonly companies = rxResource({
    params: () => ({
      q: this.query(),
      sort: toApiSort(this.sort()),
      cursor: this.cursors().at(-1) ?? undefined,
    }),
    stream: ({ params }) =>
      this.api.listCompanies({
        q: params.q || undefined,
        sort: params.sort,
        cursor: params.cursor,
        limit: PAGE_SIZE,
      }),
  });

  protected readonly rows = computed(() =>
    this.companies.hasValue() ? this.companies.value().items : [],
  );
  /** El backend omite nextCursor en la última página: ausente y null significan lo mismo. */
  protected readonly nextCursor = computed(() =>
    this.companies.hasValue() ? (this.companies.value().pageInfo.nextCursor ?? null) : null,
  );
  protected readonly status = computed(() =>
    this.companies.isLoading() ? 'loading' : this.companies.error() ? 'error' : 'ready',
  );
  protected readonly traceId = computed(() => toProblem(this.companies.error())?.traceId);
  protected readonly rowId = (company: Company) => company.id;

  protected readonly columns = computed<DataTableColumn<Company>[]>(() => {
    const date = new Intl.DateTimeFormat(this.i18n.current(), { dateStyle: 'medium' });
    return [
      { id: 'name', header: 'companies.list.columns.name', value: (c) => c.name, sortable: true },
      {
        id: 'taxId',
        header: 'companies.list.columns.taxId',
        value: (c) => c.taxId,
        numeric: false,
      },
      {
        id: 'createdAt',
        header: 'companies.list.columns.createdAt',
        value: (c) => date.format(new Date(c.createdAt)),
        numeric: true,
        sortable: true,
      },
    ];
  });

  constructor() {
    effect((onCleanup) => {
      const text = this.searchText().trim();
      const timer = setTimeout(() => this.query.set(text), SEARCH_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });
    // Un cursor solo vale para la búsqueda y la ordenación con las que se obtuvo: al cambiarlas, primera página.
    effect(() => {
      this.query();
      this.sort();
      this.cursors.set([null]);
    });
  }

  protected goNext(): void {
    const next = this.nextCursor();
    if (next) {
      this.cursors.update((cursors) => [...cursors, next]);
    }
  }

  protected goPrevious(): void {
    this.cursors.update((cursors) => (cursors.length > 1 ? cursors.slice(0, -1) : cursors));
  }
}

function toApiSort(sort: DataTableSort | null): ListCompaniesSort {
  const field = sort?.id === 'createdAt' ? 'createdAt' : 'name';
  return (sort?.desc ? `-${field}` : field) as ListCompaniesSort;
}
