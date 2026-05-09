import { expect, Page, test } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Heading } from "../components/Heading";

export class NotFoundPage extends BasePage {
    title: Heading = new Heading(this.page, this.localeInfo.notFound.title);

    constructor(page: Page, locale?: string) {
        super(page, 'NotFound', locale);
    }

    public async goTo() {
        await this.navigateTo('/servers');
    }

    public async assertTitleVisible() {
        await test.step('Not Found page title is visible', async () => {
            await expect(this.title.locator, 'Should be visible').toBeVisible();
        });
    }
}