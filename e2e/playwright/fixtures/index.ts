// Fixtures are shared test dependencies that Playwright injects into every test automatically.
// Instead of repeating setup code in each test, you declare it once here and use it as a parameter.
// This file exports a custom `test` object that replaces the default one from @playwright/test.
import { test as base, Page } from '@playwright/test';
import * as path from 'path';

// Maps the Playwright project name (defined in playwright.config.ts) to a BCP-47 locale code.
// The project name is used as the human-readable label in the HTML report.
const localeMap: Record<string, string> = {
    English:  'en-US',
    Spanish:  'es-MX',
    German:   'de-DE',
    Japanese: 'ja-JP',
};

type Fixtures = {
    locale: string;
    adminPage: Page;
    normalUserPage: Page;
};

export const test = base.extend<Fixtures>({
    locale: async ({}, use, testInfo) => {
        await use(localeMap[testInfo.project.name] ?? 'en-US');
    },
    // adminPage and normalUserPage re-use the browser storage state saved by global-setup.ts.
    // This means the test starts already logged in, without going through the login UI again —
    // making every test faster and making login UI tests truly independent from auth state.
    adminPage: async ({ browser }, use) => {
        const context = await browser.newContext({
            storageState: path.join(__dirname, '../.auth/admin.json'),
        });
        const page = await context.newPage();
        await use(page);
        await context.close();
    },
    normalUserPage: async ({ browser }, use) => {
        const context = await browser.newContext({
            storageState: path.join(__dirname, '../.auth/normal-user.json'),
        });
        const page = await context.newPage();
        await use(page);
        await context.close();
    },
});

export { expect } from '@playwright/test';
