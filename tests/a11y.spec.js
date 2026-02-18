import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Simple HTML app - accessibility', () => {
  test('has no automatically detectable a11y issues', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
