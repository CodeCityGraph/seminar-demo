import { expect, test } from '@playwright/test';

const THEME_STORAGE_KEY = 'simple-app-theme';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate((key) => localStorage.removeItem(key), THEME_STORAGE_KEY);
  await page.reload();
});

test('toggles between light and dark theme and updates aria-pressed', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Toggle theme' });

  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveClass(/dark/);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
});

test('persists dark theme selection across reload', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Toggle theme' });

  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  const storedTheme = await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY);
  expect(storedTheme).toBe('dark');

  await page.reload();

  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
});
