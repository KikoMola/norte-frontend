import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Session } from './core/auth/session';

/**
 * Pantalla provisional para comprobar el flujo de sesión de punta a punta (Angular → BFF → Keycloak → app).
 * La sustituye el shell del paso 0.28, con componentes de ui/ y textos en ngx-translate.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly session = inject(Session);
}
