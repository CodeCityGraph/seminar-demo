import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('blocks submission when required fields are invalid', async ({ page }) => {
  const firstName = page.locator('#first-name');
  const lastName = page.locator('#last-name');
  const email = page.locator('#email');
  const message = page.locator('#message');
  const submit = page.getByRole('button', { name: 'Send message' });
  const status = page.locator('#status');

  await firstName.fill('QA');
  await lastName.fill('User');
  await email.fill('invalid-email');
  await message.fill('Need help with setup');
  await submit.click();

  const emailValidity = await email.evaluate((field) => (field as HTMLInputElement).checkValidity());
  expect(emailValidity).toBe(false);
  await expect(status).not.toHaveText('Message sent!');
});

test('submits successfully with valid input and updates status', async ({ page }) => {
  await page.route('**/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  const firstName = page.locator('#first-name');
  const lastName = page.locator('#last-name');
  const email = page.locator('#email');
  const message = page.locator('#message');
  const submit = page.getByRole('button', { name: 'Send message' });
  const status = page.locator('#status');

  await firstName.fill('QA');
  await lastName.fill('User');
  await email.fill('qa@example.com');
  await message.fill('This is a valid demo message.');
  await submit.click();

  await expect(status).toHaveText('Message sent!');
});
