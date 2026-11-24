import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Cada story de Storybook, en claro y en oscuro, sin violaciones de axe (WCAG 2.1 AA).
 * Requiere `npm run build-storybook` antes (lo sirve playwright.config.ts en el puerto 6007).
 */
const STORYBOOK = 'http://localhost:6007';

test('todas las stories pasan axe en claro y oscuro', async ({ page, request }) => {
  const index = (await (await request.get(`${STORYBOOK}/index.json`)).json()) as {
    entries: Record<string, { id: string; type: string }>;
  };
  const stories = Object.values(index.entries).filter((entry) => entry.type === 'story');
  expect(stories.length).toBeGreaterThan(5);

  const failures: string[] = [];
  for (const story of stories) {
    for (const theme of ['claro', 'oscuro']) {
      await page.goto(
        `${STORYBOOK}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`,
      );
      await page.locator('#storybook-root > *').first().waitFor();
      await page.waitForTimeout(300);
      const results = await new AxeBuilder({ page })
        .include('#storybook-root')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      for (const violation of results.violations) {
        failures.push(
          `${story.id} [${theme}] ${violation.id}: ${violation.nodes.map((n) => n.target.join(' ')).join(', ')}`,
        );
      }
    }
  }
  expect(failures).toEqual([]);
});
