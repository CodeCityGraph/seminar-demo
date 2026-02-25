import { test, expect } from '@playwright/test';

test('real submit to running mock API returns Message sent!', async ({ page }) => {
  await page.goto('http://127.0.0.1:3001');

  await page.fill('#first-name', 'Live');
  await page.fill('#last-name', 'User');
  await page.fill('#email', 'live@example.com');
  await page.fill('#message', 'Hello live');

  await page.click('section#contact .contact-form button[type="submit"]');

  await expect(page.locator('#status')).toHaveText('Message sent!');
});
