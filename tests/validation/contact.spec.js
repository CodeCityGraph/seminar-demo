import { test, expect } from '@playwright/test';

test.describe('Contact form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('required fields should not be empty', async ({ page }) => {
    // Clear fields explicitly
    await page.fill('#first-name', '');
    await page.fill('#last-name', '');
    await page.fill('#email', '');
    await page.fill('#message', '');

    const validity = await page.evaluate(() => {
      const first = document.getElementById('first-name');
      const last = document.getElementById('last-name');
      const email = document.getElementById('email');
      const message = document.getElementById('message');
      return {
        firstRequired: first.validity.valueMissing,
        lastRequired: last.validity.valueMissing,
        emailRequired: email.validity.valueMissing,
        messageRequired: message.validity.valueMissing,
      };
    });

    expect(validity.firstRequired).toBeTruthy();
    expect(validity.lastRequired).toBeTruthy();
    expect(validity.emailRequired).toBeTruthy();
    expect(validity.messageRequired).toBeTruthy();
  });

  test('email negative and positive format checks', async ({ page }) => {
    await page.fill('#email', 'not-an-email');
    const bad = await page.evaluate(() => document.getElementById('email').validity.typeMismatch);
    expect(bad).toBeTruthy();

    await page.fill('#email', 'user@example.com');
    const ok = await page.evaluate(() => document.getElementById('email').checkValidity());
    expect(ok).toBeTruthy();
  });
});
