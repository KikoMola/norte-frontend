# Diseño

El diseño de Norte vive en un lienzo privado del autor; no se publica en este repositorio.

## Qué se ha trasladado al código

**Tokens** (`src/styles/tokens.css`, con los nombres del lienzo):

- Color en claro y oscuro (`data-theme`): `bg`, `surface`, `surface-2`, `surface-3`, `text`, `text-2`, `text-3`,
  `border`, `border-strong`, un único acento petróleo (`accent`, `accent-hover`, `on-accent`, `accent-soft`,
  `accent-text`) y estados `ok`, `warn`, `err`, `neu` con sus fondos. Todos cumplen contraste WCAG AA.
- Radios de 3, 4 y 6 px.
- IBM Plex Sans 400/500/600 y Plex Sans Condensed 500/600, autoalojadas con @fontsource.
- Escala tipográfica 32/40, 24/32, 20/28, 16/24, 14/20, 13/18, 12/16 y condensada 13/16 (solo cabeceras de tabla).
- Sombra solo en superficies flotantes; el resto usa bordes.

**Principios aplicados:** cifras tabulares alineadas a la derecha, estados siempre con texto (nunca solo color),
controles de 40 px, 32 px en tablas y barras de herramientas, filas de 44 px.

**Componentes del hito 0** (`src/app/ui`): botón, campo, input, panel, cabecera de página, buscador, tabla de datos,
aviso, barra lateral (240 px y contraída a 64 px) y barra superior (60 px).

**Pantallas:** shell (barra lateral y superior), listado de empresas limitado a los campos del contrato y alta de
empresa. El inicio, la ficha de empresa y el resto llegan con sus hitos. La pantalla de acceso no es de Angular:
la sirve Keycloak con su propio tema.
