import { test, expect } from '@playwright/test';

test('page loads and hero interaction works', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Simple HTML App/);
  await expect(page.locator('#hero-title')).toBeVisible();
  const status = page.locator('#status');
  await expect(status).toHaveText('Ready.');

  await page.click('#cta-button');
  await expect(status).toHaveText(/(Running\.\.\.|Done!|Ready\.)/);
});
