import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/DashboardPage';
import top5Delay from '../data/mocks/top5Delay.json';
import top5Total from '../data/mocks/top5Total.json';
import top10Limit1 from '../data/mocks/top10Limit1.json';

test.describe('Check Dashboard', () => {
    let dashboardPage: DashboardPage;
    test.use({ storageState: '.auth/admin.json' });

    test.beforeEach(async ({ page, locale }) => {
        dashboardPage = new DashboardPage(page, locale);
        await dashboardPage.mockAllApis();
        await dashboardPage.goTo();
        await dashboardPage.waitForChartsAreVisible();
    });

    // eslint-disable-next-line playwright/expect-expect
    test('Should show dashboard', {
        tag: ['@VisualTesting', '@Dashboard'],
    }, async () => {
        await dashboardPage.checkPageSnapshot();

    });

    test('Should go to client detail when clicking a "Top 5 customers with the highest debt" segment', {
        tag: ['@Dashboard'],
    }, async () => {
        const client = top5Total[0].Client;

        const clientId = await dashboardPage.clickTop5DebtSegment(client);
        const filterDescription = dashboardPage.localeInfo.dashboard.activeFilterDescription.replace('{clientId}', String(clientId));

        await dashboardPage.checkFilter(clientId, filterDescription);
        await dashboardPage.checkDetailGroupedGrid(client);
    });

    test('Should go to client detail when clicking a "Top 5 customers by days of delay" row', {
        tag: ['@Dashboard'],
    }, async () => {
        const client = top5Delay[0].Client;
        const headers = dashboardPage.localeInfo.dashboard.tableHeaders;
        await dashboardPage.top5CustomersByDays.checkHeaders([headers.number, headers.client, headers.total, headers.delay]);
        await test.step('Check "Top 5 customers by days of delay" table rows match the API data', async () => {
            const actualRows = await dashboardPage.top5CustomersByDays.getRowsValues();
            const expectedRows = top5Delay.map((row) => ({
                [headers.number]: row.ClientId,
                [headers.client]: row.Client,
                [headers.total]: row.Total,
                [headers.delay]: row.DaysOverdue,
            }));
            expect(actualRows, 'Rows should match the mocked API data').toStrictEqual(expectedRows);
        });

        const clientId = await dashboardPage.clickTop5DelayRow(client);
        const filterDescription = dashboardPage.localeInfo.dashboard.top5DelayFilterDescription.replace('{clientId}', String(clientId));

        await dashboardPage.checkFilter(clientId, filterDescription);
        await dashboardPage.checkDetailGroupedGrid(client);
    });

    test('Should show and navigate from the "Top 10" chart when clicking an expiration legend item', {
        tag: ['@Dashboard'],
    }, async () => {
        const client = top10Limit1[0].Client;
        await dashboardPage.clickExpirationLegend(dashboardPage.localeInfo.dashboard.legend30DaysLabel);
        const top10ChartTitle = dashboardPage.localeInfo.dashboard.top10ChartTitle.replace('{label}', dashboardPage.localeInfo.dashboard.legend30DaysLabel);
        await expect(dashboardPage.top10Chart.locator, `Should show the "${top10ChartTitle}" chart`).toBeVisible();
        await dashboardPage.checkTop10Chart('-top10-30-days');
        const clientId = await dashboardPage.clickTop10Segment(client);
        const filterDescription = dashboardPage.localeInfo.dashboard.top10FilterDescription
            .replace('{label}', dashboardPage.localeInfo.dashboard.legend30DaysLabel)
            .replace('{clientId}', String(clientId));

        await dashboardPage.checkFilter(clientId, filterDescription);
        await dashboardPage.checkDetailGroupedGrid(client);
    });
});