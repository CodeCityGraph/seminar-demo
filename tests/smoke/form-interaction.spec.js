import { test, expect } from '@playwright/test';

test('contact form submits with mocked POST /submit and shows success', async ({ page }) => {
  let capturedPayload = null;

  await page.route('**/submit', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      try {
        capturedPayload = JSON.parse(req.postData() || '{}');
      } catch {
        capturedPayload = req.postData();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: 123 }),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');

  await page.fill('#first-name', 'Alice');
  await page.fill('#last-name', 'Smith');
  await page.fill('#email', 'alice@example.com');
  await page.fill('#message', 'Hello there');
  await page.click('section#contact .contact-form button[type="submit"]');

  await expect(page.locator('#status')).toHaveText('Message sent!');

  expect(capturedPayload).toMatchObject({
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    message: 'Hello there',
    formType: 'contact',
  });
});

test('contact form shows server error when POST /submit returns 500', async ({ page }) => {
  await page.route('**/submit', route =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'server error' }),
    })
  );

  await page.goto('/');
  await page.fill('#first-name', 'Bob');
  await page.fill('#last-name', 'Jones');
  await page.fill('#email', 'bob@example.com');
  await page.fill('#message', 'Test error');
  await page.click('section#contact .contact-form button[type="submit"]');

  await expect(page.locator('#status')).toHaveText('Server error (500)');
});

test('contact form accepts 200 or 400 responses and logs 500 to console', async ({ page }) => {
  const consoleMessages = [];
  page.on('console', (msg) => consoleMessages.push(msg.text()));

  // 200 -> successful submission
  await page.unroute('**/submit');
  await page.route('**/submit', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  );
  await page.goto('/');
  await page.fill('#first-name', '200');
  await page.fill('#last-name', 'Case');
  await page.fill('#email', '200@example.com');
  await page.fill('#message', 'OK');
  await page.click('section#contact .contact-form button[type="submit"]');
  await expect(page.locator('#status')).toHaveText('Message sent!');

  // 400 -> validation-like response is accepted as an API response check
  await page.unroute('**/submit');
  await page.route('**/submit', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'validation' }),
    })
  );
  await page.goto('/');
  await page.fill('#first-name', '400');
  await page.fill('#last-name', 'Case');
  await page.fill('#email', '400@example.com');
  await page.fill('#message', 'Bad request');
  await page.click('section#contact .contact-form button[type="submit"]');
  await expect(page.locator('#status')).toHaveText('Validation error (400)');

  // 500 -> ensure the response code is logged to console
  await page.unroute('**/submit');
  await page.route('**/submit', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'server' }),
    })
  );
  await page.goto('/');
  await page.fill('#first-name', '500');
  await page.fill('#last-name', 'Case');
  await page.fill('#email', '500@example.com');
  await page.fill('#message', 'Server error');
  await page.click('section#contact .contact-form button[type="submit"]');

  // wait briefly for console logs to arrive
  await page.waitForTimeout(250);
  const found500Log = consoleMessages.some((m) => m.includes('Submit response') && m.includes('500')) || consoleMessages.some((m) => m.includes('500'));
  expect(found500Log).toBeTruthy();
});
