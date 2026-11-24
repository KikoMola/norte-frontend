// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import angular from 'angular-eslint';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

/**
 * Capas de la aplicación (paso 0.24). Cada capa solo puede importar de las que tiene debajo:
 *
 *   app (raíz) → features → core → ui
 *                    ↘        ↘
 *                      api ←───┘
 *
 * - ui:       componentes de presentación genéricos. No conoce la API ni la sesión.
 * - api:      cliente y mocks generados por orval desde el contrato. No se edita a mano.
 * - core:     servicios de toda la aplicación (sesión, i18n, tema, HTTP) y el shell.
 * - features: una carpeta por funcionalidad; una feature no importa de otra.
 * - testing:  utilidades de test (MSW, proveedores); solo desde tests y stories.
 */
// El orden importa: gana el primer descriptor que encaja, así que las carpetas concretas van antes que src/app y src.
const layers = [
  { type: 'api', pattern: 'src/app/api' },
  { type: 'ui', pattern: 'src/app/ui' },
  { type: 'core', pattern: 'src/app/core' },
  { type: 'feature', pattern: 'src/app/features/*', capture: ['feature'] },
  { type: 'testing', pattern: 'src/testing' },
  { type: 'app', pattern: 'src/app' },
  { type: 'bootstrap', pattern: 'src' },
];

export default defineConfig([
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.angular/**',
      'storybook-static/**',
      'src/app/api/generated/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': layers,
      'boundaries/include': ['src/**/*.ts'],
      'import/resolver': { node: { extensions: ['.ts', '.js', '.mjs'] } },
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { from: { element: { type: 'ui' } }, allow: { to: { element: { type: 'ui' } } } },
            { from: { element: { type: 'api' } }, allow: { to: { element: { type: 'api' } } } },
            {
              from: { element: { type: 'core' } },
              allow: { to: { element: { types: ['core', 'ui', 'api'] } } },
            },
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { types: ['core', 'ui', 'api'] } } },
            },
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { types: ['app', 'core', 'ui', 'api', 'feature'] } } },
            },
            {
              from: { element: { type: 'bootstrap' } },
              allow: { to: { element: { types: ['app', 'core', 'testing'] } } },
            },
            {
              from: { element: { type: 'testing' } },
              allow: { to: { element: { types: ['testing', 'api', 'core', 'ui'] } } },
            },
          ],
        },
      ],
    },
  },
  {
    // Tests y stories pueden usar las utilidades de testing.
    files: ['src/**/*.spec.ts', 'src/**/*.stories.ts'],
    rules: { 'boundaries/dependencies': 'off' },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },
]);
