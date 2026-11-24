import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { Session } from './core/auth/session';
import { Shell } from './core/shell/shell';
import { Button } from './ui/button/button';
import { Icon } from './ui/icon/icon';
import { Toaster } from './ui/toast/toast';

/**
 * Raíz: decide qué se ve según la sesión. Con sesión, el shell; sin ella, la invitación a entrar
 * (el formulario de acceso es el de Keycloak, no hay login en Angular).
 */
@Component({
  selector: 'app-root',
  imports: [Button, Icon, Shell, Toaster, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (session.status()) {
      @case ('authenticated') {
        <app-shell />
      }
      @case ('loading') {
        <main class="grid min-h-dvh place-items-center p-6">
          <p role="status" class="flex items-center gap-2 text-text-2">
            <app-icon name="lucideLoaderCircle" class="animate-spin" />
            {{ 'session.loading' | translate }}
          </p>
        </main>
      }
      @case ('anonymous') {
        <main class="grid min-h-dvh place-items-center p-6">
          <section
            class="flex w-full max-w-[420px] flex-col items-start gap-4 rounded-lg border border-border bg-surface p-8"
          >
            <span class="grid size-10 place-items-center rounded-r bg-accent text-on-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 6 20l6-4 6 4z" fill="currentColor" />
              </svg>
            </span>
            <h1 class="text-h2">{{ 'session.signedOutTitle' | translate }}</h1>
            <p class="text-text-2">{{ 'session.signedOutBody' | translate }}</p>
            <button appButton variant="primary" (click)="session.login()">
              {{ 'session.login' | translate }}
            </button>
          </section>
        </main>
      }
      @case ('error') {
        <main class="grid min-h-dvh place-items-center p-6">
          <section
            class="flex w-full max-w-[420px] flex-col items-start gap-3 rounded-lg border border-border bg-surface p-8"
            role="alert"
          >
            <span class="grid size-10 place-items-center rounded-lg bg-err-bg text-err">
              <app-icon name="lucideCircleAlert" [size]="20" />
            </span>
            <h1 class="text-h2">{{ 'session.errorTitle' | translate }}</h1>
            <p class="text-text-2">{{ 'session.errorBody' | translate }}</p>
            <button appButton (click)="session.load()">
              <app-icon name="lucideRefreshCw" />{{ 'session.retry' | translate }}
            </button>
          </section>
        </main>
      }
    }
    <app-toaster />
  `,
})
export class App {
  protected readonly session = inject(Session);
}
