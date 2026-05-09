// Fixtures are shared test dependencies that Playwright injects into every test automatically.
// Instead of repeating setup code in each test, you declare it once here and use it as a parameter.
// This file exports a custom `test` object that replaces the default one from @playwright/test.
import { test as base } from '@playwright/test';

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
};

export const test = base.extend<Fixtures>({
    locale: async ({}, use, testInfo) => {
        await use(localeMap[testInfo.project.name] ?? 'en-US');
    },
});

export { expect } from '@playwright/test';
