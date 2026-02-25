import { test, expect } from '@playwright/test';

test('Smoke: no console errors during basic page load and interactions', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    errors.push(String(err));
  });

  await page.goto('/');
  // perform a few interactions
  await page.click('#cta-button');
  await page.click('a[href="#contact"]');
  await page.click('a[href="#auth"]');

  expect(errors).toEqual([]);
});
