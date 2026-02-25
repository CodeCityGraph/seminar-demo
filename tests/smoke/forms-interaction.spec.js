import { test, expect } from '@playwright/test';

test.describe('Smoke: Forms load and interaction', () => {
  test('contact form inputs focus, type and clear', async ({ page }) => {
    await page.goto('/#contact');

    const contact = page.locator('section#contact');
    const first = contact.getByLabel('First name');
    const last = contact.getByLabel('Last name');
    const email = contact.getByLabel('Email');
    const message = contact.getByLabel('Message');

    await first.focus();
    await first.type('Alice');
    await expect(first).toHaveValue('Alice');

    await last.focus();
    await last.type('Smith');
    await expect(last).toHaveValue('Smith');

    await email.focus();
    await email.type('alice@example.com');
    await expect(email).toHaveValue('alice@example.com');

    await message.focus();
    await message.type('Hello there');
    await expect(message).toHaveValue('Hello there');

    // Clear fields
    await first.fill('');
    await last.fill('');
    await email.fill('');
    await message.fill('');

    await expect(first).toHaveValue('');
    await expect(last).toHaveValue('');
    await expect(email).toHaveValue('');
    await expect(message).toHaveValue('');
  });

  test('contact form submits and shows modal message', async ({ page }) => {
    await page.route('**/submit', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      })
    );

    await page.goto('/#contact');
    const contact = page.locator('section#contact');
    await contact.getByLabel('First name').fill('Alice');
    await contact.getByLabel('Last name').fill('Smith');
    await contact.getByLabel('Email').fill('alice@example.com');
    await contact.getByLabel('Message').fill('Hello');

    await contact.getByRole('button', { name: 'Send message' }).click();

    // modal overlay should appear with final confirmation message
    await page.waitForSelector('#site-modal-overlay', { state: 'visible', timeout: 5000 });
    const overlay = page.locator('#site-modal-overlay');
    await expect(overlay.locator('#site-modal-message')).toHaveText('Message sent!');
  });

  test('login and signup submit flows show messages', async ({ page }) => {
    await page.route('**/submit', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) })
    );

    await page.goto('/#auth');

    // Login
    const login = page.locator('#login-form');
    await login.getByLabel('Email').fill('bob@example.com');
    await login.getByLabel('Password').fill('P@ssw0rd1');
    await login.locator('button[type="submit"]').click();
    await page.waitForSelector('#site-modal-overlay', { state: 'visible', timeout: 5000 });
    await expect(page.locator('#site-modal-message')).toHaveText('Logged in');

    // Wait for the modal to dismiss before continuing
    await page.waitForSelector('#site-modal-overlay', { state: 'detached', timeout: 4000 });

    // Signup
    const signup = page.locator('#signup-form');
    await signup.getByLabel('First name').fill('Jane');
    await signup.getByLabel('Last name').fill('Doe');
    await signup.getByLabel('Email').fill('jane@example.com');
    await signup.getByLabel('Password').fill('P@ssw0rd1');
    await signup.locator('button[type="submit"]').click();
    await page.waitForSelector('#site-modal-overlay', { state: 'visible', timeout: 5000 });
    await expect(page.locator('#site-modal-message')).toHaveText('Account created');
  });
});
