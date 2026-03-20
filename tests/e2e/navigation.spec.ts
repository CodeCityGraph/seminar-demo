import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('navigates across section links from the header', async ({ page }) => {
  const cases = [
    { linkName: 'Features', hash: '#features', target: '#features-title' },
    { linkName: 'About', hash: '#about', target: '#about-title' },
    { linkName: 'Contact', hash: '#contact', target: '#contact-title' },
  ];

  for (const { linkName, hash, target } of cases) {
    await page.getByRole('link', { name: linkName }).click();
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
    await expect(page.locator(target)).toBeInViewport();
  }
});

test('validates all links resolve to existing targets or healthy responses', async ({ page, request }) => {
  const links = page.locator('a[href]');
  const total = await links.count();

  for (let index = 0; index < total; index += 1) {
    const href = await links.nth(index).getAttribute('href');
    expect(href, `Link ${index + 1} should have an href`).toBeTruthy();

    if (!href) continue;

    if (href.startsWith('#')) {
      if (href === '#') continue;
      await expect(page.locator(href), `Missing in-page target for ${href}`).toHaveCount(1);
      continue;
    }

    const response = await request.get(href);
    expect(response.status(), `Broken external link ${href}`).toBeLessThan(400);
  }
});
