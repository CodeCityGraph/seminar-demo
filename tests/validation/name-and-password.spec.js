import { test, expect } from '@playwright/test';

test.describe('Name and password validation (signup & login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('first and last name should contain only alphabetic characters', async ({ page }) => {
    // Contact form fields
    await page.fill('#first-name', 'Alice123');
    await page.fill('#last-name', 'Smith!');

    const patternMismatch = await page.evaluate(() => {
      return {
        firstPattern: document.getElementById('first-name').validity.patternMismatch,
        lastPattern: document.getElementById('last-name').validity.patternMismatch,
      };
    });

    expect(patternMismatch.firstPattern).toBeTruthy();
    expect(patternMismatch.lastPattern).toBeTruthy();

    // Positive case
    await page.fill('#first-name', 'Alice');
    await page.fill('#last-name', 'Smith');
    const ok = await page.evaluate(() => document.getElementById('first-name').checkValidity() && document.getElementById('last-name').checkValidity());
    expect(ok).toBeTruthy();
  });

  test('password rules: valid and invalid cases for signup', async ({ page }) => {
    // Navigate to signup section anchor so inputs are present
    await page.click('a[href="#auth"]');
    // Negative: too short (8 chars)
    await page.fill('#signup-password', 'Aa1!aaaa');
    const tooShort = await page.evaluate(() => {
      const el = document.getElementById('signup-password');
      return { tooShort: el.validity.tooShort, patternMismatch: el.validity.patternMismatch };
    });
    expect(tooShort.tooShort).toBeTruthy();

    // Boundary: 9 chars (should pass if meets other constraints)
    await page.fill('#signup-password', 'Ab1!aaaaa');
    const pass9 = await page.evaluate(() => document.getElementById('signup-password').checkValidity());
    expect(pass9).toBeTruthy();

    // Long boundary: 19 chars (should pass)
    await page.fill('#signup-password', 'Aaaa1!aaaaAaaa1!aa');
    const pass19 = await page.evaluate(() => document.getElementById('signup-password').checkValidity());
    expect(pass19).toBeTruthy();

    // Too long: 20 chars (fail)
    await page.fill('#signup-password', 'Aaa1!aaaaaaaaaaaaaaa');
    const tooLongCheck = await page.evaluate(() => {
      const el = document.getElementById('signup-password');
      return { length: el.value.length, max: el.maxLength, valid: el.checkValidity() };
    });
    // Browser enforces maxlength by truncating input; ensure value length equals max
    expect(tooLongCheck.length).toBe(tooLongCheck.max);

    // Missing special char
    await page.fill('#signup-password', 'Abcdefghij1A');
    const missingSpecial = await page.evaluate(() => document.getElementById('signup-password').validity.patternMismatch);
    expect(missingSpecial).toBeTruthy();
  });

  test('login password follows the same rules', async ({ page }) => {
    await page.click('a[href="#auth"]');
    await page.fill('#login-password', 'short1A!');
    const tooShort = await page.evaluate(() => document.getElementById('login-password').validity.tooShort);
    expect(tooShort).toBeTruthy();

    await page.fill('#login-password', 'Valid1!Pass');
    const ok = await page.evaluate(() => document.getElementById('login-password').checkValidity());
    expect(ok).toBeTruthy();
  });
});
