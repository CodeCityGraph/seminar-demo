/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';

const localBaseUrl = 'http://127.0.0.1:3000';
const playwrightBaseUrl = process.env.PREVIEW_URL || localBaseUrl;
const useExternalServer = Boolean(process.env.PREVIEW_URL);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: playwrightBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  webServer: useExternalServer
    ? undefined
    : {
        command: 'node mock-api.js',
        url: localBaseUrl,
        reuseExistingServer: true,
        timeout: 60_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
