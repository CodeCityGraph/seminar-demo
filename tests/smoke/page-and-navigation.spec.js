import { test, expect } from '@playwright/test';

test.describe('Smoke: Page load and navigation', () => {
  test('home page loads and key UI is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'A simple HTML web app' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run demo action' })).toBeVisible();
    await expect(page.locator('#status')).toHaveText('Ready.');
  });

  test('in-page links navigate to anchors', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="#features"]');
    await expect(page).toHaveURL(/#features$/);
    await page.click('a[href="#about"]');
    await expect(page).toHaveURL(/#about$/);
    await page.click('a[href="#contact"]');
    await expect(page).toHaveURL(/#contact$/);
  });
});
