import { test, expect } from '@playwright/test';

test('no console errors during basic interactions', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.click('#cta-button');
  await page.click('a[href="#contact"]');

  // small interactions to exercise scripts
  await page.fill('#first-name', 'Test');
  await page.fill('#last-name', 'User');
  await page.fill('#email', 'testuser@example.com');

  await page.waitForTimeout(250);
  expect(errors, `Console errors: ${errors.join('; ')}`).toHaveLength(0);
});
