# Cómo contribuir

¡Gracias por querer ayudar con Norte! Estas son las normas del repositorio del frontend.

## Idioma

- **Código en inglés.** Interfaz y documentación en español.
- Ningún texto de la interfaz va escrito en una plantilla: todo pasa por ngx-translate, con claves por módulo
  (`companies.list.title`) en `public/i18n/<feature>/{es,en}.json`.

## Ramas

- La rama principal es **`master`** y siempre debe estar en verde.
- Para contribuciones externas, trabaja en una rama con el formato `tipo/paso-descripcion`, por ejemplo
  `feat/1.19-editor-factura` o `fix/companies-paginacion`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/es/) **en español**, citando el número de paso del
planning cuando lo haya:

```
feat(ui): 1.18 app-combobox
fix(companies): 0.29 vuelve a la primera página al cambiar la búsqueda
ci: 0.12 análisis de la imagen con Trivy
```

- Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`, `perf`.
- Ámbito: la feature (`companies`, `invoices`…) o la capa (`ui`, `shell`, `api`, `i18n`).
- Commits **pequeños** y con un único propósito.

## Pull requests

- Toda contribución externa entra por pull request contra `master` y necesita revisión.
- El pipeline tiene que pasar: `npm audit`, Prettier, ESLint, Vitest, build, Playwright (modo mock y axe en todas
  las stories), Gitleaks y Trivy.
- Si necesitas un endpoint nuevo, el cambio empieza en el contrato de
  [norte-backend](https://github.com/KikoMola/norte-backend) (`api/openapi.yaml`); aquí se trae con `just api-sync`.

## Arquitectura

Capas en `src/app`, impuestas por `eslint-plugin-boundaries`:

| Capa            | Puede usar                                                  |
| --------------- | ----------------------------------------------------------- |
| `ui/`           | Solo `ui/` (componentes de presentación, sin API ni sesión) |
| `api/`          | Nada: cliente generado por orval (no se edita)              |
| `core/`         | `ui/`, `api/`                                               |
| `features/<x>/` | `core/`, `ui/`, `api/`; nunca otra feature                  |

## Definición de hecho de una pantalla

- Usa solo componentes de `ui/` y tokens de `src/styles/tokens.css` (nada de colores literales).
- Funciona en claro y oscuro, con teclado y a 390 px de ancho, y pasa axe.
- Tiene estados de carga, vacío y error.
- Todos sus textos pasan por ngx-translate.
- Tiene tests (Vitest con MSW) y, si es un flujo, E2E de Playwright.
- Cada componente nuevo de `ui/` tiene su story.

## Seguridad

No abras issues públicos para vulnerabilidades: usa
[Report a vulnerability](https://github.com/KikoMola/norte-frontend/security/advisories/new) en la pestaña Security.
