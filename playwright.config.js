import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npx http-server -p 3000 .',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true
  }
});
