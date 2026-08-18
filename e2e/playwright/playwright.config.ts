import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never', noSnippets: true }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    video: {
      mode: 'retain-on-failure',
      show: {
        actions: { position: 'top-left' },
        test: { position: 'top-right' },
      },
    },
  },

  // Each project runs the full test suite once in that language.
  // The project name is matched by the locale fixture in fixtures/index.ts to load the correct data/xx-XX.json file.
  // To add a new language: add a project here, add the mapping in fixtures/index.ts, and create data/xx-XX.json.
  projects: [
    { name: 'English', use: { ...devices['Desktop Chrome'] } },
    { name: 'Spanish', use: { ...devices['Desktop Chrome'] } },
    { name: 'German', use: { ...devices['Desktop Chrome'] } },
    { name: 'Japanese', use: { ...devices['Desktop Chrome'] } },
  ],

});
