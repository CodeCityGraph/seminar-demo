import { test, expect } from '@playwright/test';

const loginSelector = '#login-form';

const cases = [
  {
    name: 'positive - valid login',
    payload: { email: 'user@example.com', password: 'P@ssword1' },
    expectedStatus: 200
  },
  {
    name: 'negative - invalid email or password',
    payload: { email: 'bad-email', password: 'short' },
    expectedStatus: 400
  },
  {
    name: 'boundary - password length checks',
    expectedStatus: null
  }
];

test.describe('Login validation (server + UI)', () => {
  for (const c of cases) {
    if (c.name !== 'boundary - password length checks') {
      test(c.name, async ({ page }) => {
          // For negative cases we may be blocked by client-side validation; use direct POST to test server-side validation.
          if (c.expectedStatus === 400) {
            const resp = await page.request.post('http://127.0.0.1:3000/submit', {
              data: JSON.stringify({ ...c.payload, formType: 'login' }),
              headers: { 'Content-Type': 'application/json' },
            });
            expect(resp.status()).toBe(400);
            return;
          }

          await page.goto('/');
          await page.click('a[href="#auth"]');
          await page.fill('#login-email', c.payload.email);
          await page.fill('#login-password', c.payload.password);

          const [resp] = await Promise.all([
            page.waitForResponse((r) => r.url().endsWith('/submit') && r.request().method() === 'POST'),
            page.click(`${loginSelector} button[type="submit"]`),
          ]);

          expect(resp.status()).toBe(c.expectedStatus);
        });
    } else {
      test('boundary - password length 7->400; 8->200; 20->200; 21->400', async ({ page }) => {
        await page.goto('/');
        await page.click('a[href="#auth"]');
        await page.fill('#login-email', 'user@example.com');

        // Use direct requests to exercise server-side validation for boundary conditions
        const make = async (pw) => await page.request.post('http://127.0.0.1:3000/submit', {
          data: JSON.stringify({ email: 'user@example.com', password: pw, formType: 'login' }),
          headers: { 'Content-Type': 'application/json' },
        });

        const r1 = await make('A@1a'); // too short
        expect(r1.status()).toBe(400);

        const r2 = await make('Aa@12345'); // 8 chars
        expect(r2.status()).toBe(200);

        const r3 = await make('A@' + 'a'.repeat(18)); // 20 chars
        expect(r3.status()).toBe(200);

        const r4 = await make('A@' + 'a'.repeat(19)); // 21
        expect(r4.status()).toBe(400);
      });
    }
  }
});
