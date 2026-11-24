# Imagen de la SPA: build con Node y servida por nginx sin root en el puerto 8080, con fallback a index.html.
# En producción Caddy envía /api, /oauth2, /login/oauth2 y /logout al BFF y el resto a este contenedor.
# Imágenes oficiales fijadas por digest (Renovate las actualiza).
ARG NODE_IMAGE=node:22.22.3-alpine@sha256:e58326d0d441090181ac150dc2078d3e2cf6a0d42e809aebba3ef5880935ffdd
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.31-alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build

FROM ${NGINX_IMAGE}
# La imagen base va por detrás de los parches de Alpine: se aplican al construir (repositorios oficiales).
USER root
RUN apk upgrade --no-cache
USER 101
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/norte-front/browser /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO /dev/null http://127.0.0.1:8080/healthz || exit 1
