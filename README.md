# Norte · frontend

[![CI](https://github.com/KikoMola/norte-frontend/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/KikoMola/norte-frontend/actions/workflows/ci.yml)

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

## Tareas habituales

Con [just](https://github.com/casey/just) (opcional; cada receta es un comando npm):

| Comando               | Qué hace                                                                               |
| --------------------- | -------------------------------------------------------------------------------------- |
| `just start`          | Servidor de desarrollo con proxy al BFF real                                           |
| `just start-mock`     | Servidor de desarrollo con la API simulada por MSW (sesión de «ana»)                   |
| `just test`           | Tests unitarios (Vitest + MSW)                                                         |
| `just lint`           | ESLint (capas con eslint-plugin-boundaries) y Prettier                                 |
| `just e2e`            | Playwright en modo mock (claro/oscuro, escritorio y 390 px) y axe en todas las stories |
| `just e2e-real`       | E2E contra el stack real (backend levantado): alta de empresa y aislamiento de tenants |
| `just storybook`      | Storybook con selector de tema y addon de accesibilidad                                |
| `just api-sync <ref>` | Trae el contrato de norte-backend y regenera el cliente con orval                      |
| `just build`          | Build de producción en `dist/`                                                         |

## Contrato y cliente

`api/openapi.yaml` es una copia del contrato de norte-backend (la referencia de origen está en `api/SOURCE_REF`).
orval genera el cliente de Angular y los mocks MSW en `src/app/api/generated` antes de `start`, `build`, `test` y
`lint`. Lo generado no se versiona: es función del contrato y de la versión fijada de orval.

## Diseño

Tokens y componentes siguen el lienzo de diseño del proyecto (ver `design/README.md`). Todos los valores están en
`src/styles/tokens.css`.

## Integración continua y despliegue

`.github/workflows/ci.yml`: npm audit, Prettier, ESLint, Vitest, build, Playwright con axe, Gitleaks y Trivy. En
`master` publica `ghcr.io/kikomola/norte-frontend` (`latest` y `sha-<commit>`), una imagen nginx sin root que sirve
la SPA en el puerto 8080 con fallback a `index.html`, analizada con Trivy antes de publicarse.

Ver [CONTRIBUTING.md](CONTRIBUTING.md).
