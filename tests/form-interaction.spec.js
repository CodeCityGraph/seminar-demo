import { test, expect } from '@playwright/test';

test.describe('Form interaction: focus, typing, clearing', () => {
  test('focuses inputs and types values', async ({ page }) => {
    await page.goto('/#contact');

    const first = page.getByLabel('First name');
    const last = page.getByLabel('Last name');
    const email = page.getByLabel('Email');
    const message = page.getByLabel('Message');

    await first.focus();
    await expect(first).toBeFocused();
    await first.fill('Alice');
    await expect(first).toHaveValue('Alice');

    await last.focus();
    await expect(last).toBeFocused();
    await last.fill('Smith');
    await expect(last).toHaveValue('Smith');

    await email.focus();
    await expect(email).toBeFocused();
    await email.fill('alice@example.com');
    await expect(email).toHaveValue('alice@example.com');

    await message.focus();
    await expect(message).toBeFocused();
    await message.fill('Hello');
    await expect(message).toHaveValue('Hello');
  });

  test('clears fields after typing', async ({ page }) => {
    await page.goto('/#contact');

    const first = page.getByLabel('First name');
    const last = page.getByLabel('Last name');
    const email = page.getByLabel('Email');
    const message = page.getByLabel('Message');

    await first.fill('A');
    await last.fill('B');
    await email.fill('a@b.com');
    await message.fill('Msg');

    await first.fill('');
    await last.fill('');
    await email.fill('');
    await message.fill('');

    await expect(first).toHaveValue('');
    await expect(last).toHaveValue('');
    await expect(email).toHaveValue('');
    await expect(message).toHaveValue('');
  });

  test('tab navigation order through inputs', async ({ page }) => {
    await page.goto('/#contact');

    const first = page.getByLabel('First name');
    const last = page.getByLabel('Last name');
    const email = page.getByLabel('Email');
    const message = page.getByLabel('Message');
    const submit = page.getByRole('button', { name: 'Send message' });

    await first.focus();
    await expect(first).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(last).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(email).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(message).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(submit).toBeFocused();
  });
});
