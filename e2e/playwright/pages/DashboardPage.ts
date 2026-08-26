import test, { Locator, Page, expect } from '@playwright/test';
import { ActiveFilter } from '../components/ActiveFilter';
import { Canvas } from '../components/Canvas';
import { GroupedGrid } from '../components/GroupedGrid';
import { Heading } from '../components/Heading';
import { BasePage } from './BasePage';
import { VisualHelper } from '../utils/VisualHelper';
import { ApiHelper } from '../utils/ApiHelper';
import summary from '../data/mocks/summary.json';
import summaryExpiration from '../data/mocks/due-date-summary.json';
import top5Type from '../data/mocks//top5Type.json';
import top5Delay from '../data/mocks/top5Delay.json';
import top5Total from '../data/mocks//top5Total.json';
import top10Limit1 from '../data/mocks/top10Limit1.json';
import { Table } from '../components/Table';

export class DashboardPage extends BasePage {
    readonly title: Heading;
    readonly top5: Canvas;
    readonly top5Debt: Canvas;
    readonly summaryExpiration: Canvas;
    readonly detailedReportGrid: GroupedGrid;
    readonly detailedReportTitle: Heading;
    readonly activeFilter: ActiveFilter;
    readonly top10Chart: Canvas;
    readonly top10ChartCard: Canvas;
    readonly top5CustomersByDays: Table;
    protected visualHelper = new VisualHelper(this.page);
    protected apiHelper: ApiHelper;

    constructor(page: Page,  locale?: string) {
        super(page, 'Dashboard', locale);
        const noByRole = false;
        this.title = new Heading(page, '.page-header', noByRole);
        this.top5 = new Canvas(page, '#top5', 'Top 5 customers by range of delay days chart');
        this.top5Debt = new Canvas(page, '#top5-debt canvas', 'Top 5 customers with the highest debt chart');
        this.summaryExpiration = new Canvas(page, '#summary-expiration', 'Sales summary by expiration chart');
        this.detailedReportGrid = new GroupedGrid(page, 'table.premium-table');
        this.detailedReportTitle = new Heading(page, this.localeInfo.dashboard.detailedReportTitle);
        this.activeFilter = new ActiveFilter(page);
        this.top10Chart = new Canvas(page, '#client', 'Top 10 chart');
        this.top10ChartCard = new Canvas(page, '#client-detail-chart', 'Top 10 chart card');
        this.top5CustomersByDays = new Table(page, '#top5-delay table');
        this.apiHelper = new ApiHelper(page, this.apiURL);
    }

    /**
     * Go to dashboard page
     */
    public async goTo() {
        const dashboardPage = this.baseURL + '/accounts-receivable/dashboard';
        await test.step(
            `Go to: "${dashboardPage}"`,
            async () => {
                await this.page.goto(dashboardPage);
                await this.title.locator.waitFor({ timeout: 30_000 });
            },
        );
    }

    /**
   * Wait to load the charts
   */
    public async waitForChartsAreVisible() {
        await test.step(
            'Wait to charts are visible',
            async () => {
                await expect(this.page.locator(this.top5.selector), 'Should show the "Top 5 customers by range of delay days" chart').toBeVisible();
                await expect(this.page.locator(this.top5Debt.selector), 'Should show the "Top 5 customers with the highest debt" chart').toBeVisible();
                await expect(this.top5CustomersByDays.locator, 'Should show the "Top 5 customers by days of delay" table').toBeVisible();
                await expect(this.page.locator(this.summaryExpiration.selector), 'Should show the "Sales summary by expiration" chart').toBeVisible();
            },
        );
    }

    /**
     * Click a customer's segment on the "Top 5 customers with the highest debt" chart.
     * Requires mockTop5Total() (or mockAllApis()) so the rendered proportions match top5Total.json.
     * @param clientName customer name as it appears in data/mocks/top5Total.json
     * @returns the customer's ClientId, so callers can assert on it instead of hardcoding it
     */
    public async clickTop5DebtSegment(clientName: string): Promise<number> {
        return await test.step(`Click "${clientName}" segment on "${this.localeInfo.dashboard.top5DebtChartTitle}" chart`, async () => {
            const client = top5Total.find((c) => c.Client === clientName);
            if (!client) {
                throw new Error(`Client "${clientName}" not found in top5Total mock data`);
            }
            const values = top5Total.map((c) => c.Total);
            await this.top5Debt.clickSegment(values, top5Total.indexOf(client));
            return client.ClientId;
        });
    }

    /**
     * Click a customer's row on the "Top 5 customers by days of delay" table.
     * Requires mockTop5Delay() (or mockAllApis()) so the table matches top5Delay.json.
     * @param clientName customer name as it appears in data/mocks/top5Delay.json
     * @returns the customer's ClientId, so callers can assert on it instead of hardcoding it
     */
    public async clickTop5DelayRow(clientName: string): Promise<number> {
        return await test.step(`Click "${clientName}" row on the "Top 5 customers by days of delay" table`, async () => {
            const client = top5Delay.find((c) => c.Client === clientName);
            if (!client) {
                throw new Error(`Client "${clientName}" not found in top5Delay mock data`);
            }
            await this.top5CustomersByDays.clickRow(clientName);
            return client.ClientId;
        });
    }

    /**
     * Click a legend item on the "Sales summary by expiration" chart. Reveals the "Top 10" bar chart
     * for that bucket (e.g. clicking the "30 Days" legend shows "Top 10 (30 Days)").
     * @param label legend label as it appears on screen (e.g. localeInfo.dashboard.legend30DaysLabel)
     */
    public async clickExpirationLegend(label: string) {
        await test.step(`Click "${label}" legend on "${this.localeInfo.dashboard.summaryExpirationChartTitle}" chart`, async () => {
            await this.summaryExpiration.locator.getByRole('tab', { name: label }).click();
        });
    }

    /**
     * Click a customer's bar on the "Top 10" chart revealed by clickExpirationLegend().
     * Requires mockTop10Limit1() so the rendered bars match top10Limit1.json.
     * @param clientName customer name as it appears in data/mocks/top10Limit1.json
     * @returns the customer's ClientId, so callers can assert on it instead of hardcoding it
     */
    public async clickTop10Segment(clientName: string): Promise<number> {
        return await test.step(`Click "${clientName}" bar on the "Top 10" chart`, async () => {
            const client = top10Limit1.find((c) => c.Client === clientName);
            if (!client) {
                throw new Error(`Client "${clientName}" not found in top10Limit1 mock data`);
            }
            await this.top10Chart.clickBar(top10Limit1.length, top10Limit1.indexOf(client));
            return client.ClientId;
        });
    }

    /**
     * Check the "Active Filter" banner after navigating via a chart/table click.
     * Reused by every chart/table-click flow (top5Debt segment, top5Delay row, top10 bar), so the
     * assertion lives in one place.
     * @param clientId expected client id in the URL (from clickTop5DebtSegment()/clickTop5DelayRow()/clickTop10Segment())
     * @param filterDescription expected "Active Filter" description text
     */
    public async checkFilter(clientId: number, filterDescription: string) {
        await test.step(`Check filter for client #${clientId}`, async () => {
            await expect(this.page, `Should navigate to the client detail page for client #${clientId}`).toHaveURL(new RegExp(`/collection-detailed/${clientId}$`));
            await this.activeFilter.checkFilter(this.localeInfo.dashboard.activeFilterLabel, filterDescription);
        });
    }

    /**
     * Check the detailed report grid shows the expected client's group with a matching item count.
     * Reused by every chart/table-click flow (top5Debt segment, top5Delay row, top10 bar), so the
     * assertion lives in one place.
     * @param clientName expected group name in the detailed report grid
     */
    public async checkDetailGroupedGrid(clientName: string) {
        await test.step(`Check grid for client "${clientName}"`, async () => {
            await expect(this.detailedReportTitle.locator, 'Should show the detailed report title').toBeVisible();
            await expect(this.detailedReportGrid.locator, 'Should show the detailed report grid').toBeVisible();
            await this.detailedReportGrid.checkGroupItemCount(clientName);
        });
    }

    /**
     * Check snapshot
     * @param nameSuffix optional suffix to keep multiple snapshots in the same test from colliding
     */
    public async checkPageSnapshot(nameSuffix = '') {
        await this.visualHelper.checkPageSnapshot(`dashboard-${this.locale}${nameSuffix}.png`, 10_000);
    }

    public async checkTop10Chart(name: string, timeout = 5_000, maxDiffPixels = 100) {
        const snapshotName = `dashboard-${this.locale}${name}.png`;
        // The AI assistant chat bubble is fixed to the viewport, not the page, so its position
        // inside the cropped element screenshot depends on where the chart card lands in the
        // viewport once scrolled into view. Playwright's own scroll-into-view is a minimal
        // ("nearest") scroll, so the resulting offset (and the bubble's masked position) drifts
        // with whatever scroll state preceded it. Anchor the card's top edge to the viewport's
        // top edge ourselves first so every run scrolls to the same deterministic offset, which
        // in turn keeps the fixed bubble's position inside the crop stable and mask-able.
        await this.top10ChartCard.locator.evaluate((el) => el.scrollIntoView({ block: 'start', inline: 'nearest' }));
        // The mouse cursor is left wherever the previous click (the legend button) landed. Chromium
        // re-hit-tests whatever sits under a stationary cursor after a scroll, so if the resulting
        // scroll happens to park that spot over a chart bar, its hover tooltip pops open and makes
        // the capture non-deterministic. Move the cursor off the chart before capturing.
        await this.page.mouse.move(0, 0);
        await this.visualHelper.checkElementSnapshot(this.top10ChartCard.locator, snapshotName, timeout, maxDiffPixels, [this.page.locator('.chat-fab')]);
    }

    /**
     * Change the summary to fixed json file to get always the same data
     */
    async mockSummary() {
        const stepDescription = 'Modify the summary with fixed data';
        await test.step(stepDescription, async () => {
            await this.apiHelper.mockApi(
                stepDescription,
                '/api/collection/summary',
                summary,
            );
        });
    }

    /**
   * Change the summary expiration api response to fixed json file to get always the same data
   */
    async mockSummaryExpiration() {
        const stepDescription = 'Modify the "Sumary Expiration" with fixed data';
        await test.step(stepDescription, async () => {
            await this.apiHelper.mockApi(
                stepDescription,
                '/api/collection/due-date-summary',
                summaryExpiration,
            );
        });
    }

    /**
   * Change the top 5 delay api response to fixed json file to get always the same data
   */
    async mockTop5Delay() {
        const stepDescription = 'Modify the "Top 5 delay" with fixed data';
        await test.step(stepDescription, async () => {
            await this.apiHelper.mockApi(
                stepDescription,
                '/api/collection/top-5-avg-days',
                top5Delay,
            );
        });
    }

    /**
   * Change the top 5 total api response to fixed json file to get always the same data
   */
    async mockTop5Total() {
        const stepDescription = 'Modify the "Top 5 total" with fixed data';
        await test.step(stepDescription, async () => {
            await this.apiHelper.mockApi(
                stepDescription,
                '/api/collection/top-5-total',
                top5Total,
            );
        });
    }

    /**
   * Change the top 5 type api response to fixed json file to get always the same data
   */
    async mockTop5Type() {
        const stepDescription = 'Modify the "Top 5 type" with fixed data';
        await test.step(stepDescription, async () => {
            await this.apiHelper.mockApi(
                stepDescription,
                '/api/collection/top-5-type',
                top5Type,
            );
        });
    }

    /**
   * Change the top 10 (30 days bucket) api response to fixed json file to get always the same data
   */
    async mockTop10Limit1() {
        const stepDescription = 'Modify the "Top 10 (30 Days)" with fixed data';
        await test.step(stepDescription, async () => {
            await this.apiHelper.mockApi(
                stepDescription,
                '/api/collection/top-10-limit-1',
                top10Limit1,
            );
        });
    }

    /**
   * Mock all apis for dashboard
   */
    async mockAllApis() {
        await test.step('Mock all apis for dashboard', async () => {
            await this.mockSummary();
            await this.mockSummaryExpiration();
            await this.mockTop5Delay();
            await this.mockTop5Total();
            await this.mockTop5Type();
            await this.mockTop10Limit1();
        });
    }
}
