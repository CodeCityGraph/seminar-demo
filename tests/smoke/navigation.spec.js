import { test, expect } from '@playwright/test';

test('in-page links scroll to sections and back-to-home works', async ({ page }) => {
  await page.goto('/');

  await page.click('a[href="#features"]');
  await expect(page.locator('#features-title')).toBeVisible();

  await page.click('a[href="#about"]');
  await expect(page.locator('#about-title')).toBeVisible();

  await page.click('a[href="#contact"]');
  await expect(page.locator('#contact-title')).toBeVisible();

  // Open auth section then click back to home link
  await page.click('a[href="#auth"]');
  await expect(page.locator('#auth-title')).toBeVisible();
  await page.click('a.ghost-button');
  await expect(page.locator('#hero-title')).toBeVisible();
});
