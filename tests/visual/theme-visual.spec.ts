import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('matches home page screenshot in light theme', async ({ page }) => {
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });
  await expect(page).toHaveScreenshot('home-light.png', {
    fullPage: true,
    animations: 'disabled',
  });
});

test('matches home page screenshot in dark theme', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });

  await expect(page).toHaveScreenshot('home-dark.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
