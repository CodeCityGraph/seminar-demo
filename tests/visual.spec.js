import { test, expect } from '@playwright/test';

const disableAnimations = async (page) => {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
};

test.describe('Simple HTML app - visual regression', () => {
  test('matches the home page snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });

  test('matches the dark theme snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await disableAnimations(page);

    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page).toHaveScreenshot('home-dark.png', { fullPage: true });
  });
});
