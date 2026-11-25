import { DOCUMENT } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import {
  type AuditEvent,
  type CompanySettings,
  type CompanySettingsUpdate,
  SettingsService,
} from '../../api';
import { Session } from '../../core/auth/session';
import { applyServerErrors, controlErrorMessage } from '../../core/forms/server-errors';
import { handles, toProblem } from '../../core/http/http-context';
import { I18n } from '../../core/i18n/i18n';
import { normalizeTaxId } from '../../core/validation/tax-id';
import { Button } from '../../ui/button/button';
import { Field } from '../../ui/field/field';
import { History, type HistoryEvent, type HistoryStatus } from '../../ui/history/history';
import { Icon } from '../../ui/icon/icon';
import { Input } from '../../ui/input/input';
import { Panel } from '../../ui/panel/panel';
import { Select } from '../../ui/select/select';
import { Toasts } from '../../ui/toast/toast';

const LOGO_MAX_BYTES = 512 * 1024;
const LOGO_TYPES = 'image/png,image/jpeg,image/webp';
const LANGUAGES = ['es', 'en'] as const;
/** La UE, sus vecinos y los países con más relación comercial con España. */
const COUNTRIES = [
  'ES',
  'PT',
  'FR',
  'AD',
  'DE',
  'IT',
  'NL',
  'BE',
  'LU',
  'IE',
  'AT',
  'DK',
  'SE',
  'FI',
  'PL',
  'CZ',
  'SK',
  'HU',
  'SI',
  'HR',
  'RO',
  'BG',
  'GR',
  'CY',
  'MT',
  'EE',
  'LV',
  'LT',
  'GB',
  'CH',
  'NO',
  'MA',
  'US',
  'MX',
  'AR',
  'CO',
  'CL',
  'PE',
];

type PageStatus = 'loading' | 'ready' | 'error';
type Language = (typeof LANGUAGES)[number];

/**
 * Datos de la empresa como emisor (paso 1.9). Sin `settings:edit` todo es de solo lectura. Guardar manda If-Match con
 * la versión cargada: si otra persona la cambió antes, el servidor responde 412 y se ofrece recargar en lugar de
 * pisar sus cambios. El logo se sube y se quita aparte, al momento.
 */
@Component({
  selector: 'app-company-settings-page',
  imports: [Button, Field, History, Icon, Input, Panel, ReactiveFormsModule, Select, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-6' },
  template: `
    @switch (status()) {
      @case ('loading') {
        <div class="flex flex-col gap-4" aria-busy="true" role="status">
          <span class="sr-only">{{ 'ui.table.loading' | translate }}</span>
          @for (row of [0, 1]; track row) {
            <div class="h-40 rounded-lg border border-border bg-surface-2" aria-hidden="true"></div>
          }
        </div>
      }
      @case ('error') {
        <div
          class="flex flex-col items-start gap-3 rounded-lg border border-border p-5"
          role="alert"
        >
          <p>{{ 'settings.company.loadError' | translate }}</p>
          <button appButton size="sm" (click)="load()">
            <app-icon name="lucideRefreshCw" />{{ 'ui.table.retry' | translate }}
          </button>
        </div>
      }
      @default {
        @if (!canEdit()) {
          <p class="rounded-r border border-border bg-surface-2 px-4 py-3 text-text-2" role="note">
            {{ 'settings.company.readOnly' | translate }}
          </p>
        }
        @if (stale()) {
          <div
            class="flex flex-wrap items-center justify-between gap-3 rounded-r border border-warn bg-warn-bg px-4 py-3"
            role="alert"
          >
            <span>{{ 'settings.company.stale' | translate }}</span>
            <button appButton size="sm" (click)="load()">
              <app-icon name="lucideRefreshCw" />{{ 'settings.company.reload' | translate }}
            </button>
          </div>
        }

        <form class="flex flex-col gap-6" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <app-panel [heading]="'settings.company.fiscal.title' | translate">
            <p class="mb-4 text-small text-text-2">
              {{ 'settings.company.fiscal.help' | translate }}
            </p>
            <div class="grid grid-cols-2 gap-x-5 gap-y-4 max-[900px]:grid-cols-1">
              <app-field
                class="col-span-2 max-[900px]:col-span-1"
                [label]="'settings.company.fiscal.legalName' | translate"
                [error]="errorFor('legalName')"
                required
              >
                <input
                  appInput
                  formControlName="legalName"
                  autocomplete="organization"
                  maxlength="200"
                />
              </app-field>
              <app-field
                [label]="'settings.company.fiscal.tradeName' | translate"
                [hint]="'settings.company.fiscal.tradeNameHelp' | translate"
                [error]="errorFor('tradeName')"
              >
                <input appInput formControlName="tradeName" maxlength="200" />
              </app-field>
              <app-field
                [label]="'settings.company.fiscal.taxId' | translate"
                [hint]="'settings.company.fiscal.taxIdHelp' | translate"
                [error]="errorFor('taxId')"
              >
                <input
                  appInput
                  formControlName="taxId"
                  autocomplete="off"
                  spellcheck="false"
                  class="uppercase"
                  maxlength="15"
                />
              </app-field>
            </div>
          </app-panel>

          <app-panel [heading]="'settings.company.address.title' | translate">
            <div
              class="grid grid-cols-2 gap-x-5 gap-y-4 max-[900px]:grid-cols-1"
              formGroupName="address"
            >
              <app-field
                class="col-span-2 max-[900px]:col-span-1"
                [label]="'settings.company.address.line1' | translate"
                [error]="errorFor('address.line1')"
              >
                <input
                  appInput
                  formControlName="line1"
                  autocomplete="address-line1"
                  maxlength="200"
                />
              </app-field>
              <app-field
                class="col-span-2 max-[900px]:col-span-1"
                [label]="'settings.company.address.line2' | translate"
                [error]="errorFor('address.line2')"
              >
                <input
                  appInput
                  formControlName="line2"
                  autocomplete="address-line2"
                  maxlength="200"
                />
              </app-field>
              <app-field
                [label]="'settings.company.address.postalCode' | translate"
                [error]="errorFor('address.postalCode')"
              >
                <input
                  appInput
                  formControlName="postalCode"
                  autocomplete="postal-code"
                  inputmode="numeric"
                  maxlength="20"
                />
              </app-field>
              <app-field
                [label]="'settings.company.address.city' | translate"
                [error]="errorFor('address.city')"
              >
                <input
                  appInput
                  formControlName="city"
                  autocomplete="address-level2"
                  maxlength="100"
                />
              </app-field>
              <app-field
                [label]="'settings.company.address.province' | translate"
                [error]="errorFor('address.province')"
              >
                <input
                  appInput
                  formControlName="province"
                  autocomplete="address-level1"
                  maxlength="100"
                />
              </app-field>
              <app-field
                [label]="'settings.company.address.country' | translate"
                [error]="errorFor('address.country')"
                required
              >
                <select appSelect formControlName="country" autocomplete="country">
                  @for (country of countries(); track country.code) {
                    <option [value]="country.code">{{ country.name }}</option>
                  }
                </select>
              </app-field>
            </div>
          </app-panel>

          <app-panel [heading]="'settings.company.contact.title' | translate">
            <div class="grid grid-cols-2 gap-x-5 gap-y-4 max-[900px]:grid-cols-1">
              <app-field
                class="col-span-2 max-[900px]:col-span-1"
                [label]="'settings.company.contact.email' | translate"
                [hint]="'settings.company.contact.emailHelp' | translate"
                [error]="errorFor('email')"
              >
                <input
                  appInput
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  maxlength="254"
                />
              </app-field>
              <app-field
                [label]="'settings.company.contact.phone' | translate"
                [error]="errorFor('phone')"
              >
                <input
                  appInput
                  type="tel"
                  formControlName="phone"
                  autocomplete="tel"
                  maxlength="30"
                />
              </app-field>
              <app-field
                [label]="'settings.company.contact.website' | translate"
                [error]="errorFor('website')"
              >
                <input
                  appInput
                  type="url"
                  formControlName="website"
                  autocomplete="url"
                  maxlength="200"
                />
              </app-field>
            </div>
          </app-panel>

          <app-panel [heading]="'settings.company.region.title' | translate">
            <div class="grid grid-cols-2 gap-x-5 gap-y-4 max-[900px]:grid-cols-1">
              <app-field
                [label]="'settings.company.region.fiscalYearStartMonth' | translate"
                [hint]="'settings.company.region.fiscalYearHelp' | translate"
                [error]="errorFor('fiscalYearStartMonth')"
                required
              >
                <select appSelect formControlName="fiscalYearStartMonth">
                  @for (month of months(); track month.value) {
                    <option [ngValue]="month.value">{{ month.name }}</option>
                  }
                </select>
              </app-field>
              <app-field
                [label]="'settings.company.region.timeZone' | translate"
                [error]="errorFor('timeZone')"
                required
              >
                <select appSelect formControlName="timeZone">
                  @for (zone of timeZones(); track zone) {
                    <option [value]="zone">{{ zone }}</option>
                  }
                </select>
              </app-field>
              <app-field
                [label]="'settings.company.region.language' | translate"
                [hint]="'settings.company.region.languageHelp' | translate"
                [error]="errorFor('language')"
                required
              >
                <select appSelect formControlName="language">
                  @for (language of languages; track language) {
                    <option [value]="language">
                      {{ 'settings.languages.' + language | translate }}
                    </option>
                  }
                </select>
              </app-field>
            </div>
          </app-panel>

          @if (canEdit()) {
            <div
              class="sticky bottom-0 flex flex-wrap justify-end gap-2 rounded-lg border border-border bg-surface px-5 py-3"
            >
              <button
                appButton
                variant="ghost"
                type="button"
                [disabled]="saving() || !dirty()"
                (click)="discard()"
              >
                {{ 'settings.company.discard' | translate }}
              </button>
              <button appButton variant="primary" type="submit" [loading]="saving()">
                {{ (saving() ? 'settings.company.saving' : 'settings.company.save') | translate }}
              </button>
            </div>
          }
        </form>

        <app-panel [heading]="'settings.company.logo.title' | translate">
          <div class="flex flex-wrap items-center gap-5">
            <div
              class="grid h-20 w-40 place-items-center overflow-hidden rounded-r border border-border bg-surface-2"
            >
              @if (settings()?.logoUrl; as logoUrl) {
                <img
                  class="max-h-full max-w-full object-contain"
                  [src]="logoUrl"
                  [alt]="'settings.company.logo.alt' | translate: { name: settings()?.legalName }"
                />
              } @else {
                <app-icon name="lucideImage" [size]="24" class="text-text-3" />
              }
            </div>
            <div class="flex min-w-0 flex-col gap-2">
              <p class="text-small text-text-2">
                {{
                  (settings()?.logoUrl
                    ? 'settings.company.logo.help'
                    : 'settings.company.logo.none'
                  ) | translate
                }}
              </p>
              @if (logoError(); as logoError) {
                <p class="text-small text-err" role="alert">{{ logoError }}</p>
              }
              @if (canEdit()) {
                <div class="flex flex-wrap gap-2">
                  <input
                    #logoInput
                    type="file"
                    class="sr-only"
                    tabindex="-1"
                    aria-hidden="true"
                    [accept]="logoTypes"
                    (change)="uploadLogo($event)"
                  />
                  <button
                    appButton
                    size="sm"
                    type="button"
                    [loading]="logoBusy()"
                    (click)="logoInput.click()"
                  >
                    <app-icon name="lucideUpload" />
                    {{
                      (settings()?.logoUrl
                        ? 'settings.company.logo.change'
                        : 'settings.company.logo.upload'
                      ) | translate
                    }}
                  </button>
                  @if (settings()?.logoUrl) {
                    <button
                      appButton
                      variant="ghost"
                      size="sm"
                      type="button"
                      [disabled]="logoBusy()"
                      (click)="removeLogo()"
                    >
                      <app-icon name="lucideTrash2" />{{
                        'settings.company.logo.remove' | translate
                      }}
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        </app-panel>

        <app-panel [heading]="'settings.company.history.title' | translate">
          <app-history
            [events]="history()"
            [status]="historyStatus()"
            [hasMore]="historyCursor() !== null"
            [subject]="'settings.company.history.subject' | translate"
            (more)="loadHistory(true)"
            (retry)="loadHistory()"
          />
        </app-panel>
      }
    }
  `,
})
export class CompanySettingsPage {
  private readonly api = inject(SettingsService);
  private readonly session = inject(Session);
  private readonly toasts = inject(Toasts);
  private readonly translate = inject(TranslateService);
  private readonly i18n = inject(I18n);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly form = inject(NonNullableFormBuilder).group({
    legalName: ['', [Validators.required, Validators.maxLength(200)]],
    tradeName: ['', Validators.maxLength(200)],
    taxId: ['', Validators.maxLength(15)],
    address: inject(NonNullableFormBuilder).group({
      line1: ['', Validators.maxLength(200)],
      line2: ['', Validators.maxLength(200)],
      postalCode: ['', Validators.maxLength(20)],
      city: ['', Validators.maxLength(100)],
      province: ['', Validators.maxLength(100)],
      country: ['ES', Validators.required],
    }),
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.maxLength(30)],
    website: ['', Validators.maxLength(200)],
    fiscalYearStartMonth: [1, Validators.required],
    timeZone: ['Europe/Madrid', Validators.required],
    language: ['es' as Language, Validators.required],
  });

  protected readonly status = signal<PageStatus>('loading');
  protected readonly settings = signal<CompanySettings | null>(null);
  protected readonly saving = signal(false);
  protected readonly stale = signal(false);
  protected readonly logoBusy = signal(false);
  protected readonly logoError = signal<string | null>(null);
  protected readonly history = signal<HistoryEvent[]>([]);
  protected readonly historyStatus = signal<HistoryStatus>('loading');
  protected readonly historyCursor = signal<string | null>(null);

  protected readonly canEdit = computed(() => this.session.can('settings:edit'));
  protected readonly languages = LANGUAGES;
  protected readonly logoTypes = LOGO_TYPES;

  /** ETag de la versión cargada: va en If-Match al guardar. */
  private etag = '';

  /** Cambia con cualquier evento del formulario (valor, estado, touched) y con el idioma. */
  private readonly formEvents = toSignal(this.form.events);
  private readonly language = toSignal(this.translate.onLangChange);

  protected readonly dirty = computed(() => {
    this.formEvents();
    return this.form.dirty;
  });

  protected readonly months = computed(() => {
    const format = new Intl.DateTimeFormat(this.i18n.current(), { month: 'long' });
    return Array.from({ length: 12 }, (_, index) => {
      const name = format.format(new Date(Date.UTC(2026, index, 15)));
      return { value: index + 1, name: name.charAt(0).toLocaleUpperCase() + name.slice(1) };
    });
  });

  protected readonly countries = computed(() => {
    const names = new Intl.DisplayNames([this.i18n.current()], { type: 'region' });
    return COUNTRIES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) =>
      a.name.localeCompare(b.name, this.i18n.current()),
    );
  });

  protected readonly timeZones = computed(() => {
    const zones = Intl.supportedValuesOf('timeZone');
    const current = this.settings()?.timeZone;
    return current && !zones.includes(current) ? [current, ...zones] : zones;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.status.set('loading');
    this.stale.set(false);
    this.api
      .getCompanySettings({ observe: 'response' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.apply(response);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
    this.loadHistory();
  }

  protected loadHistory(more = false): void {
    this.historyStatus.set('loading');
    const cursor = more ? (this.historyCursor() ?? undefined) : undefined;
    this.api
      .listCompanySettingsHistory({ limit: 10, cursor })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          const events = page.items.map((event) => this.toHistoryEvent(event));
          this.history.update((current) => (more ? [...current, ...events] : events));
          this.historyCursor.set(page.pageInfo.hasNext ? (page.pageInfo.nextCursor ?? null) : null);
          this.historyStatus.set('ready');
        },
        error: () => this.historyStatus.set('error'),
      });
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    this.write(
      this.api.updateCompanySettings(
        this.toUpdate(),
        { 'If-Match': this.etag },
        { observe: 'response', context: handles(412, 422) },
      ),
      () => this.toasts.success(this.translate.instant('settings.company.saved')),
      () => this.saving.set(false),
    );
  }

  protected discard(): void {
    const current = this.settings();
    if (current) {
      this.patchForm(current);
    }
  }

  protected uploadLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      this.logoError.set(this.translate.instant('settings.company.logo.tooLarge'));
      return;
    }
    this.logoError.set(null);
    this.logoBusy.set(true);
    this.write(
      this.api.changeCompanyLogo(
        { file },
        { 'If-Match': this.etag },
        { observe: 'response', context: handles(412, 422) },
      ),
      () => this.toasts.success(this.translate.instant('settings.company.logo.uploaded')),
      () => this.logoBusy.set(false),
      { keepForm: true },
    );
  }

  protected removeLogo(): void {
    this.logoError.set(null);
    this.logoBusy.set(true);
    this.write(
      this.api.removeCompanyLogo(
        { 'If-Match': this.etag },
        { observe: 'response', context: handles(412) },
      ),
      () => this.toasts.success(this.translate.instant('settings.company.logo.removed')),
      () => this.logoBusy.set(false),
      { keepForm: true },
    );
  }

  protected errorFor(path: string): string | null {
    this.formEvents();
    this.language();
    return controlErrorMessage(this.form.get(path), this.translate);
  }

  /**
   * Envía una escritura con If-Match y aplica la respuesta. El logo no toca el formulario: lo que el usuario esté
   * editando se conserva (`keepForm`).
   */
  private write(
    request: Observable<HttpResponse<CompanySettings>>,
    done: () => void,
    finish: () => void,
    { keepForm = false } = {},
  ): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        finish();
        this.apply(response, keepForm);
        done();
        this.loadHistory();
      },
      error: (error: unknown) => {
        finish();
        const problem = toProblem(error);
        if (problem?.status === 412) {
          this.stale.set(true);
        } else if (problem?.status === 422) {
          const unmatched = applyServerErrors(this.form, problem) ?? [];
          const logo = unmatched.find((violation) => violation.field === 'file');
          if (logo) {
            this.logoError.set(
              this.translate.instant(`validation.${logo.code}`) === `validation.${logo.code}`
                ? logo.message
                : this.translate.instant(`validation.${logo.code}`),
            );
          }
          this.focusFirstInvalid();
        }
        // El resto de errores ya los avisa el interceptor.
      },
    });
  }

  private apply(response: HttpResponse<CompanySettings>, keepForm = false): void {
    const settings = response.body;
    if (!settings) {
      return;
    }
    this.etag = response.headers.get('ETag') ?? '';
    this.settings.set(settings);
    if (!keepForm || !this.form.dirty) {
      this.patchForm(settings);
    }
  }

  private patchForm(settings: CompanySettings): void {
    this.form.reset({
      legalName: settings.legalName,
      tradeName: settings.tradeName ?? '',
      taxId: settings.taxId ?? '',
      address: {
        line1: settings.address.line1 ?? '',
        line2: settings.address.line2 ?? '',
        postalCode: settings.address.postalCode ?? '',
        city: settings.address.city ?? '',
        province: settings.address.province ?? '',
        country: settings.address.country,
      },
      email: settings.email ?? '',
      phone: settings.phone ?? '',
      website: settings.website ?? '',
      fiscalYearStartMonth: settings.fiscalYearStartMonth,
      timeZone: settings.timeZone,
      language: settings.language,
    });
    if (this.canEdit()) {
      this.form.enable();
    } else {
      this.form.disable();
    }
  }

  private toUpdate(): CompanySettingsUpdate {
    const value = this.form.getRawValue();
    const optional = (text: string) => text.trim() || null;
    return {
      legalName: value.legalName.trim(),
      tradeName: optional(value.tradeName),
      taxId: value.taxId.trim() ? normalizeTaxId(value.taxId) : null,
      address: {
        line1: optional(value.address.line1),
        line2: optional(value.address.line2),
        postalCode: optional(value.address.postalCode),
        city: optional(value.address.city),
        province: optional(value.address.province),
        country: value.address.country,
      },
      email: optional(value.email),
      phone: optional(value.phone),
      website: optional(value.website),
      fiscalYearStartMonth: value.fiscalYearStartMonth,
      timeZone: value.timeZone,
      language: value.language,
    };
  }

  /** Nombres de campo y valores como los lee una persona: «el idioma de los documentos», «Inglés», «julio». */
  private toHistoryEvent(event: AuditEvent): HistoryEvent {
    const label = (field: string) => {
      const key = `settings.fields.${field}`;
      const translated = this.translate.instant(key) as string;
      return translated === key ? field : translated;
    };
    const value = (field: string, raw: string | null) => {
      if (raw === null) {
        return null;
      }
      if (field === 'language') {
        return this.translate.instant(`settings.languages.${raw}`) as string;
      }
      if (field === 'fiscalYearStartMonth') {
        return this.months().find((month) => month.value === Number(raw))?.name ?? raw;
      }
      return raw;
    };
    return {
      id: event.id,
      occurredAt: event.occurredAt,
      action: event.action,
      actor: event.actor?.name,
      changes: event.changes.map((change) => ({
        label: label(change.field),
        from: value(change.field, change.from),
        to: value(change.field, change.to),
      })),
    };
  }

  /** Lleva el foco al primer campo con error, para teclado y lectores de pantalla. */
  private focusFirstInvalid(): void {
    afterNextRender(
      () => this.document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
  }
}
