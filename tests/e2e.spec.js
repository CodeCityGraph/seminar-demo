import { test, expect } from '@playwright/test';

test.describe('Simple HTML app - end to end', () => {
  test('updates status when demo action is triggered', async ({ page }) => {
    await page.goto('/');
    const status = page.getByRole('status');
    await expect(status).toHaveText('Ready.');

    await page.getByRole('button', { name: 'Run demo action' }).click();
    await expect(status).toHaveText('Running...');

    await page.getByRole('button', { name: 'Run demo action' }).click();
    await expect(status).toHaveText('Done!');
  });

  test('toggles theme for header button', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Toggle theme' });

    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test.skip('submits the contact form', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Message').fill('Hello from the tests.');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByRole('status')).toHaveText('Message sent!');
  });
});
