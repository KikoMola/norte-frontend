# Norte · frontend

CRM + ERP open source para pymes españolas. Este repositorio contiene el frontend; el backend (Spring Boot + BFF)
vive en [norte-backend](https://github.com/KikoMola/norte-backend).

Angular 22 (standalone, zoneless, signals), Tailwind 4, Angular Primitives, ng-icons (Lucide), TanStack Table y
Charts, y ngx-translate.

## Arrancar en local

1. Levanta el backend siguiendo su README (`docker compose up -d`, `app` y `bff`).
2. Instala y arranca el frontend:

   ```bash
   npm install
   npm start
   ```

3. Abre http://localhost:4200 y entra con `ana` / `ana` o `bruno` / `bruno`.

El servidor de desarrollo reenvía `/api`, `/oauth2`, `/login/oauth2` y `/logout` al BFF en `localhost:8080`
(ver `proxy.conf.json`), así que el navegador lo ve todo en el mismo origen y la cookie de sesión funciona sin CORS.

## Autenticación

El frontend no maneja tokens. La sesión es una cookie `HttpOnly` del BFF y `HttpClient` envía el token CSRF
(`XSRF-TOKEN` → `X-XSRF-TOKEN`) automáticamente. Ver `src/app/core/auth/session.ts`.

## Scripts

| Comando         | Qué hace                                |
| --------------- | --------------------------------------- |
| `npm start`     | Servidor de desarrollo con proxy al BFF |
| `npm run build` | Build de producción en `dist/`          |
| `npm test`      | Tests unitarios con Vitest              |
