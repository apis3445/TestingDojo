import { expect, Page } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class Alert extends BaseComponent {

    constructor(page: Page) {
        super(page, '[data-test="message"]', 'generic', false, 'Alert');
    }

    async assertText(expected: string): Promise<void> {
        await this.addStep(`Assert alert text: "${expected}"`, async () => {
            await expect(this.locator).toBeVisible();
            await expect(this.locator.locator('.message-text')).toHaveText(expected);
        });
    }
}
