import { test } from '../fixtures';
import { DashboardPage } from '../pages/DashboardPage';
import { checkAccessibility } from 'snap-ally';
import { ServersPage } from '../pages/ServersPage';

test.describe('Accessibility Testing', {
    tag: ['@Accessibility'],
}, () => {
     test.use({ storageState: '.auth/admin.json' });

    // eslint-disable-next-line playwright/expect-expect
    test('Dashboard Page', async ({ page, locale }, testInfo) => {
        test.skip(testInfo.project.name !== 'English', 'Accessibility checks only run against the English locale');
        const dashboardPage = new DashboardPage(page, locale);
        await dashboardPage.goTo(); 
        await dashboardPage.waitForChartsAreVisible();
        await checkAccessibility(page, testInfo);
    });

    test('Server Page', async ({ page, locale }, testInfo) => {
        test.skip(testInfo.project.name !== 'English', 'Accessibility checks only run against the English locale');
        const serversPage = new ServersPage(page, locale);
        await serversPage.goToServers();
        await checkAccessibility(page, testInfo, { 
            tags: ['wcag2a', 'wcag2aa'],
        });
    });
});