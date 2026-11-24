import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';

import type { Problem } from '../../api';
import { Toasts } from '../../ui/toast/toast';
import { Session } from '../auth/session';
import { HANDLED_STATUSES, toProblem } from './http-context';

const FALLBACK_KEYS: Record<number, string> = {
  0: 'errors.network',
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.not_found',
  409: 'errors.conflict',
  412: 'errors.conflict',
  422: 'errors.validation',
};

/**
 * Traduce los errores de la API a avisos (paso 0.28):
 * - El mensaje sale de `errors.<code>` si existe; si no, del estado HTTP; y en último caso, del `title` del servidor.
 * - Muestra la traza (`traceId`) para poder buscarla en Tempo.
 * - Un 401 en /api marca la sesión como caducada y la aplicación vuelve a la pantalla de inicio de sesión.
 */
export const problemInterceptor: HttpInterceptorFn = (request, next) => {
  // Se resuelven al fallar, no al crear el interceptor: el loader de traducciones también usa HttpClient y
  // pedir TranslateService aquí crearía una dependencia circular.
  const injector = inject(Injector);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !request.url.startsWith('/api/')) {
        return throwError(() => error);
      }
      if (error.status === 401) {
        injector.get(Session).expire();
      }
      if (request.context.get(HANDLED_STATUSES).includes(error.status)) {
        return throwError(() => error);
      }
      const problem = toProblem(error);
      injector
        .get(Toasts)
        .error(messageFor(injector.get(TranslateService), error.status, problem), problem?.traceId);
      return throwError(() => error);
    }),
  );
};

function messageFor(translate: TranslateService, status: number, problem: Problem | null): string {
  const byCode = problem ? `errors.${problem.code}` : null;
  if (byCode && translate.instant(byCode) !== byCode) {
    return translate.instant(byCode);
  }
  const byStatus = FALLBACK_KEYS[status];
  if (byStatus) {
    return translate.instant(byStatus);
  }
  return problem?.title ?? translate.instant('errors.generic');
}
