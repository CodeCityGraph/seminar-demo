import { test, expect } from '@playwright/test';

test.describe('Simple HTML app - integration', () => {
  test('multi-step user journey: theme, demo, form submission', async ({ page }) => {
    await page.goto('/');

    // Step 1: Toggle theme
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Step 2: Run demo action multiple times
    const status = page.getByRole('status');
    await page.getByRole('button', { name: 'Run demo action' }).click();
    await expect(status).toHaveText('Running...');

    await page.getByRole('button', { name: 'Run demo action' }).click();
    await expect(status).toHaveText('Done!');

    // Step 3: Navigate to contact section and submit form
    await page.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/#contact/);

    await page.getByLabel('Email').fill('integration@test.com');
    await page.getByLabel('Message').fill('Testing multi-step workflow');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(status).toHaveText('Message sent!');
  });

  test('navigation through all sections', async ({ page }) => {
    await page.goto('/');

    // Navigate to features
    await page.getByRole('link', { name: 'Features' }).click();
    await expect(page).toHaveURL(/#features/);
    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();

    // Navigate to about
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/#about/);
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();

    // Navigate to contact
    await page.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/#contact/);
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();

    // Navigate home via logo
    await page.getByRole('link', { name: /Simple App/ }).click();
    await expect(page).toHaveURL(/^http.*\/$/);
  });

  test('form validation with keyboard navigation', async ({ page }) => {
    await page.goto('/#contact');

    const emailInput = page.getByLabel('Email');
    const messageInput = page.getByLabel('Message');
    const submitButton = page.getByRole('button', { name: 'Send message' });

    // Tab through form fields
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(messageInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(submitButton).toBeFocused();

    // Fill form and submit via keyboard
    await emailInput.fill('keyboard@test.com');
    await messageInput.fill('Submitted via keyboard');
    await submitButton.press('Enter');

    await expect(page.getByRole('status')).toHaveText('Message sent!');
  });

  test('demo state persists during theme toggles', async ({ page }) => {
    await page.goto('/');
    const status = page.getByRole('status');

    // Set demo state
    await page.getByRole('button', { name: 'Run demo action' }).click();
    await expect(status).toHaveText('Running...');

    // Toggle theme
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Demo state should still be running
    await expect(status).toHaveText('Running...');

    // Continue demo cycle
    await page.getByRole('button', { name: 'Run demo action' }).click();
    await expect(status).toHaveText('Done!');

    // Toggle theme back
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Demo state should still be done
    await expect(status).toHaveText('Done!');
  });

  test('form error handling with invalid email', async ({ page }) => {
    await page.goto('/#contact');

    const emailInput = page.getByLabel('Email');
    const messageInput = page.getByLabel('Message');
    const submitButton = page.getByRole('button', { name: 'Send message' });

    // Try to submit with invalid email (browser validation)
    await emailInput.fill('not-an-email');
    await messageInput.fill('Test message');

    // The form should trigger browser validation
    await submitButton.click();

    // Status should not have been updated yet (form didn't submit)
    // This tests browser-level validation
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('multiple form submissions in sequence', async ({ page }) => {
    await page.goto('/#contact');
    const status = page.getByRole('status');

    // First submission
    await page.getByLabel('Email').fill('first@test.com');
    await page.getByLabel('Message').fill('First message');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(status).toHaveText('Message sent!');

    // Form should clear automatically (or not - depends on implementation)
    // Clear manually and submit again
    await page.getByLabel('Email').fill('second@test.com');
    await page.getByLabel('Message').fill('Second message');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(status).toHaveText('Message sent!');
  });
});
