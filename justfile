# Tareas habituales del frontend. Cada receta es un comando npm normal: just es opcional.
# En Windows, just necesita un sh (Git Bash): https://just.systems/man/en/settings.html#windows-shell
set windows-shell := ["sh", "-cu"]

# Lista las recetas
default:
    @just --list

# Instala las dependencias exactas del lockfile
install:
    npm ci

# Servidor de desarrollo contra el BFF real (localhost:8080)
start:
    npm start

# Servidor de desarrollo con la API simulada por MSW
start-mock:
    npm run start:mock

# Tests unitarios (Vitest)
test:
    npm test

# ESLint (con las reglas de capas) y Prettier
lint:
    npm run lint
    npm run format:check

# E2E de Playwright en modo mock y axe sobre todas las stories
e2e:
    npm run build-storybook -- --quiet
    E2E_STORYBOOK=1 npx playwright test

# Storybook en http://localhost:6006
storybook:
    npm run storybook

# Trae el contrato de norte-backend (tag, rama o commit) y regenera el cliente
api-sync ref="master":
    npm run api:sync -- {{ ref }}
    npm run api:generate

# Build de producción en dist/
build:
    npm run build

# Imagen de producción (nginx sin root en el puerto 8080)
image:
    docker build -t norte-frontend:local .
