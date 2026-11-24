import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import type { Problem } from '../../api';

/** Error de validación del servidor guardado en el control: `control.errors.server`. */
export interface ServerError {
  code: string;
  message?: string;
}

/**
 * Pinta los errores 422 del servidor en el formulario (paso 0.29): cada `errors[].field` del Problem se asigna al
 * control con ese nombre (admite rutas `lines.2.quantity` o `lines[2].quantity`) como `{ server: { code, message } }`.
 * El error se borra solo en cuanto el usuario cambia el valor.
 *
 * @returns los errores que no corresponden a ningún control, para mostrarlos aparte.
 */
export function applyServerErrors(form: FormGroup, problem: Problem): Problem['errors'] {
  const unmatched: NonNullable<Problem['errors']> = [];
  for (const error of problem.errors ?? []) {
    const control = form.get(error.field.replace(/\[(\d+)\]/g, '.$1'));
    if (!control) {
      unmatched.push(error);
      continue;
    }
    setServerError(control, error.code, error.message);
  }
  return unmatched;
}

/** Asigna un error de servidor a un control concreto (p. ej. un 409 de NIF duplicado al campo NIF). */
export function setServerError(control: AbstractControl, code: string, message?: string): void {
  const server: ServerError = { code, message };
  control.setErrors({ ...control.errors, server });
  control.markAsTouched();
  const subscription = control.valueChanges.subscribe(() => {
    clearServerError(control);
    subscription.unsubscribe();
  });
}

function clearServerError(control: AbstractControl): void {
  if (!control.errors?.['server']) {
    return;
  }
  const rest: ValidationErrors = { ...control.errors };
  delete rest['server'];
  control.setErrors(Object.keys(rest).length ? rest : null);
}

/**
 * Mensaje traducido del primer error de un control, o null si es válido o el usuario aún no lo ha tocado.
 * Claves: `validation.<error>` (required, maxlength…) y, para errores del servidor, `validation.<code>` o
 * `errors.<code>`; si no hay traducción, el mensaje por defecto del servidor.
 */
export function controlErrorMessage(
  control: AbstractControl | null,
  translate: TranslateService,
): string | null {
  if (!control || !control.errors || !control.touched) {
    return null;
  }
  const errors: ValidationErrors = control.errors;
  const server = errors['server'] as ServerError | undefined;
  if (server) {
    for (const key of [`validation.${server.code}`, `errors.${server.code}`]) {
      const text = translate.instant(key);
      if (text !== key) {
        return text;
      }
    }
    return server.message ?? translate.instant('validation.invalid');
  }
  const [name, params] = Object.entries(errors)[0];
  const key = `validation.${name}`;
  const text = translate.instant(key, typeof params === 'object' ? params : undefined);
  return text !== key ? text : translate.instant('validation.invalid');
}
