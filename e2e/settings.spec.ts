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
  test(`ajustes de la empresa en tema ${theme}`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('norte.theme', t), theme);
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: 'Ajustes' })
      .click();

    await expect(page.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: 'Secciones de ajustes' })
        .getByRole('link', { name: 'Empresa' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('textbox', { name: /^Razón social/ })).toHaveValue(
      'Acme Ibérica S.L.',
    );
    await expect(page.getByText('Ana García')).toBeVisible();
    await expectNoA11yViolations(page);

    await page.getByRole('textbox', { name: /^Razón social/ }).fill('Acme Ibérica Holding S.L.');
    await page.getByRole('combobox', { name: /^Inicio del ejercicio fiscal/ }).selectOption({
      label: 'Julio',
    });
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByText('Ajustes guardados.')).toBeVisible();
    await expect(
      page.getByText(/cambió la razón social de\s+Acme Ibérica S\.L\.\s+a\s+Acme Ibérica Holding/),
    ).toBeVisible();
    await expectNoA11yViolations(page);
  });
}

test('ajustes en un móvil de 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ajustes');

  await expect(page.getByRole('textbox', { name: /^Razón social/ })).toBeVisible();
  // Nada se sale por la derecha.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectNoA11yViolations(page);
});
