import { Page, test } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class Button extends BaseComponent {

    constructor(page: Page, selector: string, byRole = true, name = '') {
        super(page, selector, 'button', byRole, name);
    }

    async click() {
        const stepDescription = `Click: "${this.locator.description()}"`;
        await test.step(stepDescription, async () => {
            await this.locator.click();
        });
    }
}