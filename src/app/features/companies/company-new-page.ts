import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { CompaniesService } from '../../api';
import {
  applyServerErrors,
  controlErrorMessage,
  setServerError,
} from '../../core/forms/server-errors';
import { handles, toProblem } from '../../core/http/http-context';
import { normalizeTaxId } from '../../core/validation/tax-id';
import { Button } from '../../ui/button/button';
import { Field } from '../../ui/field/field';
import { Icon } from '../../ui/icon/icon';
import { Input } from '../../ui/input/input';
import { PageHeader } from '../../ui/page-header/page-header';
import { Panel } from '../../ui/panel/panel';
import { Toasts } from '../../ui/toast/toast';

/**
 * Alta mínima de empresa (paso 0.29): razón social y NIF. La validación que manda es la del servidor: sus 422 se
 * pintan junto a cada campo y el 409 de NIF duplicado, en el campo NIF.
 */
@Component({
  selector: 'app-company-new-page',
  imports: [
    Button,
    Field,
    Icon,
    Input,
    PageHeader,
    Panel,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <app-page-header
      [heading]="'companies.new.title' | translate"
      [breadcrumb]="'companies.new.breadcrumb' | translate"
    />

    <form class="max-w-[720px]" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <app-panel [heading]="'companies.new.panelTitle' | translate">
        <div class="grid grid-cols-2 gap-x-5 gap-y-4 max-[900px]:grid-cols-1">
          <app-field
            class="col-span-2 max-[900px]:col-span-1"
            [label]="'companies.new.name' | translate"
            [hint]="'companies.new.nameHelp' | translate"
            [error]="errorFor('name')"
            required
          >
            <input appInput formControlName="name" autocomplete="organization" maxlength="200" />
          </app-field>

          <app-field
            [label]="'companies.new.taxId' | translate"
            [hint]="'companies.new.taxIdHelp' | translate"
            [error]="errorFor('taxId')"
            required
          >
            <input
              appInput
              formControlName="taxId"
              autocomplete="off"
              spellcheck="false"
              class="uppercase"
              maxlength="15"
              [placeholder]="'companies.new.taxIdPlaceholder' | translate"
            />
          </app-field>
        </div>

        <div panelFooter class="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
          <a appButton variant="ghost" routerLink="..">{{ 'companies.new.cancel' | translate }}</a>
          <button appButton variant="primary" type="submit" [loading]="saving()">
            @if (!saving()) {
              <app-icon name="lucidePlus" />
            }
            {{ (saving() ? 'companies.new.saving' : 'companies.new.save') | translate }}
          </button>
        </div>
      </app-panel>
    </form>
  `,
})
export class CompanyNewPage {
  private readonly api = inject(CompaniesService);
  private readonly router = inject(Router);
  private readonly toasts = inject(Toasts);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    taxId: ['', [Validators.required, Validators.maxLength(15)]],
  });

  protected readonly saving = signal(false);
  /** Una clave por intento de alta: si el usuario reintenta tras un fallo de red, el servidor no duplica. */
  private idempotencyKey = crypto.randomUUID();

  /** Cambia con cualquier evento del formulario (valor, estado, touched) y con el idioma. */
  private readonly formEvents = toSignal(this.form.events);
  private readonly language = toSignal(this.translate.onLangChange);

  protected errorFor(name: 'name' | 'taxId'): string | null {
    this.formEvents();
    this.language();
    return controlErrorMessage(this.form.controls[name], this.translate);
  }

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .createCompany(
        { name: value.name.trim(), taxId: normalizeTaxId(value.taxId) },
        { 'Idempotency-Key': this.idempotencyKey },
        { context: handles(409, 422) },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (company) => {
          this.toasts.success(
            this.translate.instant('companies.new.created', { name: company.name }),
          );
          void this.router.navigate(['/empresas']);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.handleError(error);
        },
      });
  }

  private handleError(error: unknown): void {
    // Si el servidor llegó a responder, el siguiente intento es otra petición: clave nueva.
    // Si fue un fallo de red, se reintenta con la misma clave y el servidor no duplica el alta.
    if (error instanceof HttpErrorResponse && error.status !== 0) {
      this.idempotencyKey = crypto.randomUUID();
    }
    const problem = toProblem(error);
    if (problem?.status === 422) {
      applyServerErrors(this.form, problem);
      this.focusFirstInvalid();
    } else if (problem?.code === 'company.tax_id.duplicate') {
      setServerError(this.form.controls.taxId, problem.code, problem.title);
      this.focusFirstInvalid();
    } else if (problem?.status === 409) {
      this.toasts.error(this.translate.instant('errors.conflict'), problem.traceId);
    }
    // El resto de errores ya los avisa el interceptor.
  }

  /** Lleva el foco al primer campo con error, para teclado y lectores de pantalla. */
  private focusFirstInvalid(): void {
    afterNextRender(
      () => this.document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus(),
      {
        injector: this.injector,
      },
    );
  }
}
