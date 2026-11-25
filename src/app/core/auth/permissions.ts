/**
 * Permisos por acción (paso 1.3), con la forma `resource:action`. Son los del enum `Permission` del backend
 * (`com.norte.shared.domain.access.Permission`); `GET /me` devuelve los que tiene el usuario.
 *
 * El frontend solo los usa para ocultar lo que el usuario no puede hacer: quien decide es siempre el backend.
 */
export type Permission =
  | 'company:read'
  | 'company:edit'
  | 'product:read'
  | 'product:edit'
  | 'settings:read'
  | 'settings:edit'
  | 'invoice:read'
  | 'invoice:edit'
  | 'invoice:issue'
  | 'invoice:send'
  | 'invoice:collect';
