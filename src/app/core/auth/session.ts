import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** Provisional hasta que orval genere el tipo desde el contrato (paso 0.23). */
export interface Me {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  tenantId: string | null;
  roles: string[];
}

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous' | 'error';

/**
 * Sesión contra el BFF. El navegador nunca ve tokens: solo la cookie HttpOnly de sesión y la cookie XSRF-TOKEN,
 * que HttpClient reenvía como cabecera X-XSRF-TOKEN en las peticiones que modifican datos.
 */
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  private readonly state = signal<{ status: SessionStatus; user: Me | null }>({
    status: 'loading',
    user: null,
  });

  readonly status = computed(() => this.state().status);
  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => this.state().status === 'authenticated');

  async load(): Promise<void> {
    try {
      const user = await firstValueFrom(this.http.get<Me>('/api/v1/me'));
      this.state.set({ status: 'authenticated', user });
    } catch (error) {
      const anonymous = error instanceof HttpErrorResponse && error.status === 401;
      this.state.set({ status: anonymous ? 'anonymous' : 'error', user: null });
    }
  }

  login(): void {
    this.document.location.assign('/oauth2/authorization/keycloak');
  }

  /** El BFF responde 202 con la URL de cierre de sesión de Keycloak en Location. */
  async logout(): Promise<void> {
    const response = await firstValueFrom(this.http.post('/logout', null, { observe: 'response' }));
    this.document.location.assign(response.headers.get('Location') ?? '/');
  }
}
