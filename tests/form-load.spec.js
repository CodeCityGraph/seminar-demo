import { test, expect } from '@playwright/test';

test.describe('Main page and contact form', () => {
  test('homepage loads and shows hero elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'A simple HTML web app' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run demo action' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Ready.');
  });

  test('contact/registration form loads with name, email, message and submit', async ({ page }) => {
    await page.goto('/#contact');

    await expect(page.getByLabel('First name')).toBeVisible();
    await expect(page.getByLabel('Last name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Message')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
  });
});
