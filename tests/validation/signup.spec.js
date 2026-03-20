import { test, expect } from '@playwright/test';

const signupSelector = '#signup-form';

const cases = [
  {
    name: 'positive - valid signup',
    payload: {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@example.com',
      password: 'P@ssword1'
    },
    expectedStatus: 200
  },
  {
    name: 'negative - invalid names (server should reject)',
    payload: {
      firstName: 'Al1ce',
      lastName: "Sm1th",
      email: 'alice.smith@example.com',
      password: 'P@ssword1'
    },
    expectedStatus: 400
  },
  {
    name: 'boundary - password length edge cases',
    // we will run several sub-cases inside this test
    expectedStatus: null
  }
];

test.describe('Signup validation (server + UI)', () => {
  for (const c of cases) {
    if (c.name !== 'boundary - password length edge cases') {
      test(c.name, async ({ page }) => {
        await page.goto('/');
        await page.click('a[href="#auth"]');
        await page.fill('#signup-first', c.payload.firstName);
        await page.fill('#signup-last', c.payload.lastName);
        await page.fill('#signup-email', c.payload.email);
        await page.fill('#signup-password', c.payload.password);

        const [resp] = await Promise.all([
          page.waitForResponse((r) => r.url().endsWith('/submit') && r.request().method() === 'POST'),
          page.click(`${signupSelector} button[type="submit"]`),
        ]);

        expect(resp.status()).toBe(c.expectedStatus);
      });
    } else {
      test('boundary - password length 7 (too short) -> 400', async ({ page }) => {
        await page.goto('/');
        await page.click('a[href="#auth"]');
        await page.fill('#signup-first', 'Alice');
        await page.fill('#signup-last', 'Smith');
        await page.fill('#signup-email', 'alice@example.com');
        // Use direct requests to exercise server-side validation for boundary conditions
        const make = async (pw) => await page.request.post('/submit', {
          data: JSON.stringify({ firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', password: pw, formType: 'signup' }),
          headers: { 'Content-Type': 'application/json' },
        });

        const r1 = await make('P@ss1a'); // length 6
        expect(r1.status()).toBe(400);

        const r2 = await make('P@ss1ab'); // 7 chars
        expect(r2.status()).toBe(400);

        const r3 = await make('Aa@12345'); // 8 chars
        expect(r3.status()).toBe(200);

        const r4 = await make('A@' + 'a'.repeat(18)); // 20 chars
        expect(r4.status()).toBe(200);

        const r5 = await make('A@' + 'a'.repeat(19)); // 21 chars
        expect(r5.status()).toBe(400);
      });
    }
  }
});
