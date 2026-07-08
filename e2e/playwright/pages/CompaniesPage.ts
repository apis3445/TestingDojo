import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Heading } from '../components/Heading';

export class CompaniesPage extends BasePage {
    title: Heading = new Heading(this.page, this.localeInfo.companies.title);

    constructor(page: Page, locale?: string) {
        super(page, 'Companies', locale);
    }
}
