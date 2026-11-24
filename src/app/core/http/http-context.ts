import { HttpContext, HttpContextToken, HttpErrorResponse } from '@angular/common/http';

import type { Problem } from '../../api';

/**
 * Estados HTTP que gestiona quien hace la llamada (p. ej. un formulario pinta sus 422 junto a cada campo).
 * Para esos estados el interceptor no muestra aviso.
 */
export const HANDLED_STATUSES = new HttpContextToken<readonly number[]>(() => []);

/** Contexto para una petición cuyo llamador gestiona ciertos estados: `{ context: handles(401) }`. */
export function handles(...statuses: number[]): HttpContext {
  return new HttpContext().set(HANDLED_STATUSES, statuses);
}

/** Cuerpo Problem Details de un error HTTP, si lo es (RFC 9457, esquema Problem del contrato). */
export function toProblem(error: unknown): Problem | null {
  if (
    !(error instanceof HttpErrorResponse) ||
    typeof error.error !== 'object' ||
    error.error === null
  ) {
    return null;
  }
  const body = error.error as Partial<Problem>;
  return typeof body.code === 'string' && typeof body.status === 'number'
    ? (body as Problem)
    : null;
}
