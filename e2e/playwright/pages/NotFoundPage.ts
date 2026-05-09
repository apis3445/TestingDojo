import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Heading } from "../components/Heading";

export class NotFoundPage extends BasePage {
    title: Heading = new Heading(this.page, this.localeInfo.notFound.title);

    constructor(page: Page, locale?: string) {
        super(page, 'NotFound', locale);
    }
}