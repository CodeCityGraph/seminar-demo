import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3001');

  await page.fill('#first-name', 'Live');
  await page.fill('#last-name', 'User');
  await page.fill('#email', 'live@example.com');
  await page.fill('#message', 'Hello live');

  await page.click('section#contact .contact-form button[type="submit"]');

  // wait for status update
  await page.waitForSelector('#status');
  const status = await page.textContent('#status');
  console.log('Status text after submit:', status);

  await browser.close();
})();
