import { Page } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class Link extends BaseComponent {

    constructor(page: Page, selector: string, byRole = true) {
        super(page, selector, 'link', byRole);
    }

    async click() {
        const stepDescription = `Click: "${this.locator.description()}"`;
        await this.addStep(stepDescription, async () => {
            await this.locator.click();
        });
    }

}