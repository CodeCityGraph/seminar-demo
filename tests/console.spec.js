import { test, expect } from '@playwright/test';

test.describe('Console and page errors', () => {
  test('no console.error or page errors during basic interactions', async ({ page }) => {
    const errors = [];

    page.on('pageerror', (err) => {
      errors.push(String(err));
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    // exercise a few UI interactions that load scripts
    await page.getByRole('button', { name: 'Run demo action' }).click();
    await page.getByRole('button', { name: 'Run demo action' }).click();
    await page.getByRole('button', { name: 'Toggle theme' }).click();

    await expect(errors).toHaveLength(0);
  });
});
