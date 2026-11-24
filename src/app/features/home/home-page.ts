import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { Session } from '../../core/auth/session';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { PageHeader } from '../../ui/page-header/page-header';
import { Panel } from '../../ui/panel/panel';

/** Inicio del hito 0. Las cifras del mes y la gráfica de facturación llegan en el paso 1.21. */
@Component({
  selector: 'app-home-page',
  imports: [Button, Icon, PageHeader, Panel, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <app-page-header [heading]="'home.welcome' | translate: { name: firstName() }" />
    <app-panel>
      <div class="flex flex-col items-start gap-4">
        <p class="text-text-2">{{ 'home.intro' | translate }}</p>
        <a appButton variant="primary" routerLink="/empresas">
          <app-icon name="lucideBuilding2" />{{ 'home.goToCompanies' | translate }}
        </a>
      </div>
    </app-panel>
  `,
})
export class HomePage {
  private readonly session = inject(Session);
  protected readonly firstName = computed(() => {
    const user = this.session.user();
    return user?.name?.split(' ')[0] || user?.username || '';
  });
}
