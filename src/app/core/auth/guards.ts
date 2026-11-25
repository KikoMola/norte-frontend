import { inject } from '@angular/core';
import { type CanMatchFn, Router } from '@angular/router';

import { type BusinessModule } from '../../api';
import { type Permission } from './permissions';
import { Session } from './session';

/**
 * Solo deja entrar en la ruta con el permiso (paso 1.3); si no, vuelve al inicio. Como `*appCan`, es comodidad: el
 * backend responde 403 de todos modos.
 */
export function requirePermission(permission: Permission): CanMatchFn {
  return () => inject(Session).can(permission) || inject(Router).createUrlTree(['/']);
}

/** Solo deja entrar si el tenant tiene contratado el módulo (paso 1.2). */
export function requireModule(module: BusinessModule): CanMatchFn {
  return () => inject(Session).hasModule(module) || inject(Router).createUrlTree(['/']);
}
