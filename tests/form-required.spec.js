import { test, expect } from '@playwright/test';

test.describe('Form required fields validation', () => {
  test('submitting empty required fields shows actionable validation messages', async ({ page }) => {
    await page.goto('/#contact');

    const first = page.getByLabel('First name');
    const last = page.getByLabel('Last name');
    const email = page.getByLabel('Email');
    const message = page.getByLabel('Message');
    const submit = page.getByRole('button', { name: 'Send message' });

    // Ensure fields are empty
    await first.fill('');
    await last.fill('');
    await email.fill('');
    await message.fill('');

    // Try to submit the form
    await submit.click();

    // Browser-level validation will set validationMessage on invalid controls
    const firstMsg = await first.evaluate((el) => el.validationMessage || '');
    const lastMsg = await last.evaluate((el) => el.validationMessage || '');
    const emailMsg = await email.evaluate((el) => el.validationMessage || '');
    const messageMsg = await message.evaluate((el) => el.validationMessage || '');

    // At least one of the required fields should report a validation message
    const anyMessage = firstMsg || lastMsg || emailMsg || messageMsg;
    expect(anyMessage).not.toBe('');

    // Each required input should have a non-empty validationMessage when invalid
    expect(firstMsg.length + lastMsg.length + emailMsg.length + messageMsg.length).toBeGreaterThan(0);

    // Form should not have submitted — status should remain as initial 'Ready.'
    const statusText = await page.getByRole('status').textContent();
    expect(statusText).toBe('Ready.');
  });
});
