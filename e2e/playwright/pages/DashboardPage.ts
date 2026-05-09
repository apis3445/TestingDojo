import { expect, Page, test } from "@playwright/test";
import { Canvas } from "../components/Canvas";
import { Heading } from "../components/Heading";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
    readonly title: Heading;
    readonly top5: Canvas;
    readonly top5Debt: Canvas;
    readonly top5DaysDelay: Canvas;
    readonly summaryExpiration: Canvas;

    constructor(page: Page, locale?: string) {
        super(page, 'Dashboard', locale);
        this.title = new Heading(page, '#title', false);
        this.top5 = new Canvas(page, '#top5', 'Top 5 chart');
        this.top5Debt = new Canvas(page, '#top5-debt', 'Top 5 Debt chart');
        this.top5DaysDelay = new Canvas(page, '#top5-type-delay', 'Top 5 Days Delay chart');
        this.summaryExpiration = new Canvas(page, '#summary-expiration', 'Summary Expiration chart');
    }

    public async goTo() {
        const url = this.baseURL + '/accounts-receivable/dashboard';
        await test.step(`Go to: "${url}"`, async () => {
            await this.page.goto(url);
            await this.title.locator.waitFor({ timeout: 30_000 });
        });
    }

    public async waitForChartsAreVisible() {
        await test.step('Wait for charts to be visible', async () => {
            await expect(this.top5.locator, 'Should be visible').toBeVisible();
            await expect(this.top5Debt.locator, 'Should be visible').toBeVisible();
            await expect(this.top5DaysDelay.locator, 'Should be visible').toBeVisible();
            await expect(this.summaryExpiration.locator, 'Should be visible').toBeVisible();
        });
    }
}