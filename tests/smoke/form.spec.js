import { test, expect } from '@playwright/test';

test('form fields accept focus, typing, and can be cleared', async ({ page }) => {
  await page.goto('/');

  // Contact form first name
  const first = page.locator('#first-name');
  await first.focus();
  await first.fill('Alice');
  await expect(first).toHaveValue('Alice');
  await first.fill('');
  await expect(first).toHaveValue('');

  // Contact email
  const email = page.locator('#email');
  await email.focus();
  await email.fill('a@test.example');
  await expect(email).toHaveValue('a@test.example');
  await email.fill('');
  await expect(email).toHaveValue('');

  // Login fields
  const loginEmail = page.locator('#login-email');
  const loginPassword = page.locator('#login-password');
  await loginEmail.focus();
  await loginEmail.fill('user@example.com');
  await expect(loginEmail).toHaveValue('user@example.com');

  await loginPassword.focus();
  await loginPassword.fill('P@ssw0rd!');
  await expect(loginPassword).toHaveValue('P@ssw0rd!');
  await loginPassword.fill('');
  await expect(loginPassword).toHaveValue('');
});
