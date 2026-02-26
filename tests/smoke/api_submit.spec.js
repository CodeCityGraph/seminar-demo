import { test, expect } from '@playwright/test';

// Smoke API submission: ensure POST to /submit returns 200 or 400
// and the page logs a Submit response message.

test('contact form submit yields 200 or 400 and logs response', async ({ page }) => {
  await page.goto('/');

  // prepare listener for console message
  const consolePromise = page.waitForEvent('console', (m) => m.text().includes('Submit response'));

  // fill valid-ish payload (server validates alpha names)
  await page.fill('#first-name', 'Alice');
  await page.fill('#last-name', 'Smith');
  await page.fill('#email', 'alice.smith@example.com');
  await page.fill('#message', 'Hello from smoke test');

  // wait for network response and console message triggered by app.js
  const [response, consoleMsg] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/submit') && r.request().method() === 'POST'),
    consolePromise,
    page.click('section#contact .contact-form button[type="submit"]'),
  ]);

  expect([200, 400]).toContain(response.status());
  const text = consoleMsg ? consoleMsg.text() : '';
  expect(text).toContain('Submit response');
});
