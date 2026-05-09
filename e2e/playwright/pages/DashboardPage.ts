import { expect, Page } from "@playwright/test";
import { Canvas } from "../components/Canvas";
import { Heading } from "../components/Heading";
import { BasePage } from "./BasePage";
import { AnnotationType } from "../utils/AnnotationType";

export class DashboardPage extends BasePage {
    readonly title: Heading;
    readonly top5: Canvas;
    readonly top5Debt: Canvas;
    readonly top5DaysDelay: Canvas;
    readonly summaryExpiration: Canvas;

    constructor(page: Page, locale?: string) {
        super(page, 'Dashboard', locale);
        this.title = new Heading(page, '#title', false);
        this.top5 = new Canvas(page, '#top5');
        this.top5Debt = new Canvas(page, '#top5-debt');
        this.top5DaysDelay = new Canvas(
            page,
            '#top5-type-delay',
        );
        this.summaryExpiration = new Canvas(
            page,
            '#summary-expiration',
        );
    }

    public async goTo() {
        const dashboardPage = this.baseURL + '/accounts-receivable/dashboard';
        await this.addStepWithAnnotation(
            AnnotationType.GoTo,
            `Go to: "${dashboardPage}"`,
            async () => {
                await this.page.goto(dashboardPage);
                await this.title.locator.waitFor({ timeout: 30_000 });
            },
        );
    }

    public async waitForChartsAreVisible() {
        await this.addStepWithAnnotation(
            AnnotationType.Assert,
            'Wait to charts are visible',
            async () => {
                await expect(this.top5.locator).toBeVisible();
                await expect(this.top5Debt.locator).toBeVisible();
                await expect(this.top5DaysDelay.locator).toBeVisible();
                await expect(this.summaryExpiration.locator).toBeVisible();
            },
        );
    }
}