import { expect, Page, test } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class Alert extends BaseComponent {

    constructor(page: Page, description = 'Alert') {
        super(page, '[data-test="message"]', 'generic', false, description);
    }

    async assertText(expected: string): Promise<void> {
        await test.step(`Assert alert text: "${expected}"`, async () => {
            await expect(this.locator, 'Should be visible').toBeVisible();
            await expect(this.locator.locator('.message-text').describe('Alert message text'), `Should have text "${expected}"`).toHaveText(expected);
        });
    }
}
