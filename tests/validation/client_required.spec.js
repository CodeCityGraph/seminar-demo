import { test, expect } from '@playwright/test';

test('contact form required fields are enforced on client', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="#contact"]');
  // ensure form validity fails with empty required fields
  const isValid = await page.$eval('section#contact .contact-form', (f) => f.checkValidity());
  expect(isValid).toBe(false);

  // fill just first name and try submit - should still be invalid and not send network request
  await page.fill('#first-name', 'Alice');
  const pending = page.waitForResponse((r) => r.url().endsWith('/submit') && r.request().method() === 'POST', { timeout: 500 }).then(() => true).catch(() => false);
  await page.click('section#contact .contact-form button[type="submit"]');
  const sent = await pending;
  expect(sent).toBe(false);
});
