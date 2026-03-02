import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('blocks submission when required fields are invalid', async ({ page }) => {
  const email = page.locator('#email');
  const message = page.locator('#message');
  const submit = page.getByRole('button', { name: 'Send message' });
  const status = page.locator('#status');

  await email.fill('invalid-email');
  await message.fill('Need help with setup');
  await submit.click();

  const emailValidity = await email.evaluate((field) => (field as HTMLInputElement).checkValidity());
  expect(emailValidity).toBe(false);
  await expect(status).not.toHaveText('Message sent!');
});

test('submits successfully with valid input and updates status', async ({ page }) => {
  const email = page.locator('#email');
  const message = page.locator('#message');
  const submit = page.getByRole('button', { name: 'Send message' });
  const status = page.locator('#status');

  await email.fill('qa@example.com');
  await message.fill('This is a valid demo message.');
  await submit.click();

  await expect(status).toHaveText('Message sent!');
});
