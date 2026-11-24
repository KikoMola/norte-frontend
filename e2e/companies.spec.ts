import AxeBuilder from '@axe-core/playwright';
import { type Page, expect, test } from '@playwright/test';

/** WCAG 2.1 A y AA, como exige la definición de hecho. */
async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`tema ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('norte.theme', t), theme);
    });

    test('crea una empresa y la ve en el listado', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1, name: /Hola, Ana/ })).toBeVisible();
      await expectNoA11yViolations(page);

      await page
        .getByRole('navigation', { name: 'Navegación principal' })
        .getByRole('link', { name: 'Empresas' })
        .click();
      await expect(page.getByRole('heading', { level: 1, name: 'Empresas' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Acme Ibérica S.L.' })).toBeVisible();
      await expect(page).toHaveTitle('Empresas · Norte');
      await expectNoA11yViolations(page);

      await page.getByRole('link', { name: 'Nueva empresa' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Nueva empresa' })).toBeVisible();
      await expectNoA11yViolations(page);

      // Primero un NIF que ya existe: el 409 aparece en el campo NIF.
      await page.getByRole('textbox', { name: /^Razón social/ }).fill('Bodegas Valdejalón S.C.');
      await page.getByRole('textbox', { name: /^NIF/ }).fill('B12345674');
      await page.getByRole('button', { name: 'Guardar empresa' }).click();
      await expect(page.getByText('Ya existe una empresa con ese NIF.')).toBeVisible();
      await expect(page.getByRole('textbox', { name: /^NIF/ })).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await expectNoA11yViolations(page);

      await page.getByRole('textbox', { name: /^NIF/ }).fill('f50218874');
      await page.getByRole('button', { name: 'Guardar empresa' }).click();

      await expect(
        page.getByRole('status').getByText('Empresa «Bodegas Valdejalón S.C.» dada de alta.'),
      ).toBeVisible();
      await expect(page.getByRole('heading', { level: 1, name: 'Empresas' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Bodegas Valdejalón S.C.' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'F50218874' })).toBeVisible();
      await expectNoA11yViolations(page);
    });
  });
}

test('se usa solo con teclado', async ({ page }) => {
  await page.goto('/empresas/nueva');
  await expect(page.getByRole('heading', { level: 1, name: 'Nueva empresa' })).toBeVisible();
  await page.getByRole('textbox', { name: /^Razón social/ }).focus();
  await page.keyboard.type('Ferretería Moncayo');
  await page.keyboard.press('Tab');
  await page.keyboard.type('25471109N');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('cell', { name: 'Ferretería Moncayo' })).toBeVisible();
});

test('busca empresas y muestra el estado vacío', async ({ page }) => {
  await page.goto('/empresas');
  await page.getByRole('searchbox', { name: 'Buscar empresas' }).fill('no existe');
  await expect(page.getByText('Ninguna empresa coincide con «no existe»')).toBeVisible();
  await expectNoA11yViolations(page);
});

test('cambia de idioma', async ({ page }) => {
  await page.goto('/empresas');
  await page.getByRole('button', { name: 'Cambiar el idioma a English' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Companies' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
