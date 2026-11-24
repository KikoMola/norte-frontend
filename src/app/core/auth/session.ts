import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { type Me, SessionService } from '../../api';

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous' | 'error';

/** Ruta del BFF que inicia el login OIDC contra Keycloak. */
export const LOGIN_URL = '/oauth2/authorization/keycloak';

/**
 * Sesión contra el BFF (paso 0.28). El navegador nunca ve tokens: solo la cookie HttpOnly de sesión y la cookie
 * XSRF-TOKEN, que HttpClient reenvía como cabecera X-XSRF-TOKEN en las peticiones que modifican datos.
 */
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly api = inject(SessionService);
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  private readonly state = signal<{ status: SessionStatus; user: Me | null }>({
    status: 'loading',
    user: null,
  });

  readonly status = computed(() => this.state().status);
  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => this.state().status === 'authenticated');
  /** Iniciales para el avatar: «Ana Acme» → «AA». */
  readonly initials = computed(() => {
    const user = this.state().user;
    const source = user?.name?.trim() || user?.username || '';
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  async load(): Promise<void> {
    try {
      const user = await firstValueFrom(this.api.getMe());
      this.state.set({ status: 'authenticated', user });
    } catch (error) {
      const anonymous = error instanceof HttpErrorResponse && error.status === 401;
      this.state.set({ status: anonymous ? 'anonymous' : 'error', user: null });
    }
  }

  /** La sesión ha caducado en el BFF (401 en una llamada a la API). */
  expire(): void {
    this.state.set({ status: 'anonymous', user: null });
  }

  login(): void {
    this.document.location.assign(LOGIN_URL);
  }

  /** El BFF responde 202 con la URL de cierre de sesión de Keycloak en Location. */
  async logout(): Promise<void> {
    const response = await firstValueFrom(this.http.post('/logout', null, { observe: 'response' }));
    this.state.set({ status: 'anonymous', user: null });
    this.document.location.assign(response.headers.get('Location') ?? '/');
  }
}
