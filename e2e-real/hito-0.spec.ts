import AxeBuilder from '@axe-core/playwright';
import { type Browser, type Page, expect, test } from '@playwright/test';

/**
 * Criterio de salida del hito 0 contra el stack real: un usuario inicia sesión, crea una empresa y la ve en el
 * listado; el usuario de otro tenant no la ve. Usuarios del realm local: ana/ana (tenant 1111…) y bruno/bruno (2222…).
 */

/** CIF con letra B y dígito de control válido, para no chocar con el NIF único por tenant. */
function randomCif(): string {
  const digits = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10));
  let sum = 0;
  digits.forEach((n, i) => {
    if (i % 2 === 1) {
      sum += n;
    } else {
      const doubled = n * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    }
  });
  return `B${digits.join('')}${(10 - (sum % 10)) % 10}`;
}

async function signIn(browser: Browser, user: string): Promise<Page> {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL(/localhost:8180/);
  // Con organizaciones (paso 1.1) Keycloak pide primero el usuario y en otra pantalla la contraseña.
  await page.fill('#username', user);
  await page.click('#kc-login');
  await page.fill('#password', user);
  await page.click('#kc-login');
  await page.waitForURL((url) => url.origin === 'http://localhost:4200');
  await expect(page.getByRole('button', { name: 'Cerrar sesión' }).first()).toBeVisible();
  return page;
}

async function expectNoAxeViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
}

test('hito 0: alta de empresa con sesión real y aislamiento entre tenants', async ({ browser }) => {
  const name = `Prueba Real ${Date.now()} S.L.`;
  const taxId = randomCif();

  const ana = await signIn(browser, 'ana');
  expect(await ana.evaluate(() => document.cookie)).not.toContain('NORTE_SESSION');

  await ana.goto('/empresas/nueva');
  await ana.getByLabel('Razón social').fill(name);
  await ana.getByLabel('NIF').fill(taxId);
  await expectNoAxeViolations(ana);
  await ana.getByRole('button', { name: 'Guardar empresa' }).click();
  await expect(ana).toHaveURL(/\/empresas$/);
  await expect(ana.getByText(name, { exact: true })).toBeVisible();
  await expectNoAxeViolations(ana);

  // El mismo NIF en el mismo tenant: 409 traducido en un aviso.
  await ana.goto('/empresas/nueva');
  await ana.getByLabel('Razón social').fill(`${name} bis`);
  await ana.getByLabel('NIF').fill(taxId);
  await ana.getByRole('button', { name: 'Guardar empresa' }).click();
  await expect(ana.getByText(/ya existe/i).first()).toBeVisible();

  // Otro tenant no la ve.
  const bruno = await signIn(browser, 'bruno');
  await bruno.goto('/empresas');
  await expect(bruno.getByRole('heading', { name: 'Empresas', exact: true })).toBeVisible();
  await expect(bruno.getByText(name, { exact: true })).toHaveCount(0);

  // Cerrar sesión vuelve a pedir inicio de sesión.
  await ana.goto('/empresas');
  await ana.getByRole('button', { name: 'Cerrar sesión' }).first().click();
  await ana.waitForURL((url) => url.origin === 'http://localhost:4200');
  await expect(ana.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
});
