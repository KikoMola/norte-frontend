import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { type BusinessModule, type Me, SessionService } from '../../api';
import { handles } from '../http/http-context';
import { type Permission } from './permissions';

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
  /** Permisos efectivos (paso 1.3) y módulos contratados (paso 1.2), tal como los da `GET /me`. */
  readonly permissions = computed(() => new Set(this.state().user?.permissions ?? []));
  readonly modules = computed(() => new Set<BusinessModule>(this.state().user?.modules ?? []));
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

  /** Solo sirve para ocultar lo que no se puede hacer: el backend vuelve a comprobarlo siempre. */
  can(permission: Permission): boolean {
    return this.permissions().has(permission);
  }

  hasModule(module: BusinessModule): boolean {
    return this.modules().has(module);
  }

  async load(): Promise<void> {
    try {
      const user = await firstValueFrom(this.api.getMe({ context: handles(401) }));
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
