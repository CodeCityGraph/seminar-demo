import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('cycles demo status text and state data attribute', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Run demo action' });
  const status = page.locator('#status');

  await expect(status).toHaveText('Ready.');

  await button.click();
  await expect(status).toHaveText('Running...');
  await expect(status).toHaveAttribute('data-state', 'running-');

  await button.click();
  await expect(status).toHaveText('Done!');
  await expect(status).toHaveAttribute('data-state', 'done-');

  await button.click();
  await expect(status).toHaveText('Ready.');
  await expect(status).toHaveAttribute('data-state', 'ready-');
});
