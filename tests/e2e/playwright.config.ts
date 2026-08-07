import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './specs',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'pnpm --filter @bcip/web dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          DATABASE_URL:
            process.env.DATABASE_URL ?? 'postgresql://bcip:change-me@127.0.0.1:5433/bcip',
          BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? '0123456789abcdef0123456789abcdef',
          BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://127.0.0.1:3000',
          AI_SERVICE_URL: process.env.AI_SERVICE_URL ?? 'http://127.0.0.1:8000',
          AI_SERVICE_TOKEN: process.env.AI_SERVICE_TOKEN ?? 'replace-me',
          S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? 'change-me',
          S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? 'change-me-change-me',
          APP_URL: process.env.APP_URL ?? 'http://127.0.0.1:3000',
        },
      },
});
