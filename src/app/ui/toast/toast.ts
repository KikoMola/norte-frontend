import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { Button } from '../button/button';
import { Icon, IconName } from '../icon/icon';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  /** Texto ya traducido. */
  message: string;
  /** Traza del servidor, para errores (se muestra en pequeño). */
  traceId?: string;
}

const DURATION_MS: Record<ToastTone, number> = { success: 5000, info: 5000, error: 10000 };
const ICON: Record<ToastTone, IconName> = {
  success: 'lucideCircleCheck',
  error: 'lucideCircleAlert',
  info: 'lucideInfo',
};

/** Avisos efímeros (paso 0.27). El texto llega traducido; el estado se anuncia siempre con texto, no solo color. */
@Injectable({ providedIn: 'root' })
export class Toasts {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  readonly items = signal<Toast[]>([]);

  show(tone: ToastTone, message: string, traceId?: string): number {
    const id = this.nextId++;
    this.items.update((items) => [...items.slice(-3), { id, tone, message, traceId }]);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), DURATION_MS[tone]),
    );
    return id;
  }

  success(message: string): number {
    return this.show('success', message);
  }

  error(message: string, traceId?: string): number {
    return this.show('error', message, traceId);
  }

  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.items.update((items) => items.filter((toast) => toast.id !== id));
  }
}

/**
 * Región de avisos, una por aplicación (en el shell). Superficie oscura sobre claro y al revés, como en el lienzo.
 * Los errores van en una región assertive; el resto, polite.
 */
@Component({
  selector: 'app-toaster',
  imports: [Button, Icon, NgTemplateOutlet, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6',
  },
  template: `
    <section class="contents" [attr.aria-label]="'ui.toast.region' | translate">
      <div class="flex flex-col items-end gap-2" role="status" aria-live="polite">
        @for (toast of politeToasts(); track toast.id) {
          <ng-container
            [ngTemplateOutlet]="item"
            [ngTemplateOutletContext]="{ $implicit: toast }"
          />
        }
      </div>
      <div class="flex flex-col items-end gap-2" role="alert" aria-live="assertive">
        @for (toast of errorToasts(); track toast.id) {
          <ng-container
            [ngTemplateOutlet]="item"
            [ngTemplateOutletContext]="{ $implicit: toast }"
          />
        }
      </div>
    </section>

    <ng-template #item let-toast>
      <div
        class="pointer-events-auto flex w-full max-w-[400px] items-start gap-3 rounded-lg bg-text py-3 pl-4 pr-3 text-body text-bg shadow-pop"
      >
        <app-icon
          [name]="iconFor(toast)"
          class="mt-0.5"
          [class.text-ok-bg]="toast.tone === 'success'"
          [class.text-err-bg]="toast.tone === 'error'"
        />
        <span class="flex flex-1 flex-col gap-0.5">
          <span>{{ toast.message }}</span>
          @if (toast.traceId) {
            <span class="num text-micro opacity-80">{{
              'ui.trace' | translate: { traceId: toast.traceId }
            }}</span>
          }
        </span>
        <button
          appButton
          variant="ghost"
          size="sm"
          iconOnly
          class="!text-bg hover:!bg-transparent hover:opacity-80"
          [attr.aria-label]="'ui.toast.close' | translate"
          (click)="toasts.dismiss(toast.id)"
        >
          <app-icon name="lucideX" />
        </button>
      </div>
    </ng-template>
  `,
})
export class Toaster {
  protected readonly toasts = inject(Toasts);
  protected readonly politeToasts = computed(() =>
    this.toasts.items().filter((t) => t.tone !== 'error'),
  );
  protected readonly errorToasts = computed(() =>
    this.toasts.items().filter((t) => t.tone === 'error'),
  );

  protected iconFor(toast: Toast): IconName {
    return ICON[toast.tone];
  }
}
