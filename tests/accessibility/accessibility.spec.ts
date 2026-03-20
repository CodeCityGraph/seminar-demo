import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

type Palette = {
  bg: string;
  text: string;
  muted: string;
  primary: string;
};

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '').trim();
  const normalized =
    clean.length === 3 ? clean.split('').map((char) => `${char}${char}`).join('') : clean;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const srgb = [r, g, b].map((value) => value / 255);
  const linear = srgb.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const contrastRatio = (foregroundHex: string, backgroundHex: string) => {
  const fg = relativeLuminance(hexToRgb(foregroundHex));
  const bg = relativeLuminance(hexToRgb(backgroundHex));
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('supports keyboard navigation through primary interactive elements', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.locator('.logo')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Features' })).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'About' })).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Contact' })).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeFocused();
});

test('shows a visible focus indicator for keyboard focus', async ({ page }) => {
  const ctaButton = page.getByRole('button', { name: 'Run demo action' });
  for (let i = 0; i < 20; i += 1) {
    await page.keyboard.press('Tab');
    if (await ctaButton.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(ctaButton).toBeFocused();

  const focusStyles = await ctaButton.evaluate((button) => {
    const styles = window.getComputedStyle(button);
    return {
      outlineStyle: styles.outlineStyle,
      outlineWidth: styles.outlineWidth,
      outlineColor: styles.outlineColor,
    };
  });

  expect(focusStyles.outlineStyle).not.toBe('none');
  expect(Number.parseFloat(focusStyles.outlineWidth)).toBeGreaterThan(0);
  expect(focusStyles.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('uses semantic landmarks and labeled navigation', async ({ page }) => {
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
});

test('maintains acceptable core text contrast in light and dark themes', async ({ page }) => {
  const readPalette = async () =>
    page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        bg: styles.getPropertyValue('--bg').trim(),
        text: styles.getPropertyValue('--text').trim(),
        muted: styles.getPropertyValue('--muted').trim(),
        primary: styles.getPropertyValue('--primary').trim(),
      };
    }) as Promise<Palette>;

  const light = await readPalette();
  expect(contrastRatio(light.text, light.bg)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(light.muted, light.bg)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(light.primary, light.bg)).toBeGreaterThanOrEqual(4.5);

  await page.getByRole('button', { name: 'Toggle theme' }).click();
  const dark = await readPalette();
  expect(contrastRatio(dark.text, dark.bg)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(dark.muted, dark.bg)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(dark.primary, dark.bg)).toBeGreaterThanOrEqual(4.5);
});

test('has no serious accessibility violations in axe scan', async ({ page }) => {
  const axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

  const results = await axe.analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
