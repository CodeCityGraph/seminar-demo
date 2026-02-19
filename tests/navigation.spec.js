import { test, expect } from '@playwright/test';

test.describe('In-page navigation', () => {
  test('nav links go to sections', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Features' }).click();
    await expect(page).toHaveURL(/#features/);
    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();

    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/#about/);
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();

    await page.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/#contact/);
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
  });

  test('logo navigates home', async ({ page }) => {
    await page.goto('/#contact');
    await page.getByRole('link', { name: /Simple App/ }).click();
    await expect(page).toHaveURL(/^http.*\/$/);
    await expect(page.getByRole('heading', { name: 'A simple HTML web app' })).toBeVisible();
  });
});
