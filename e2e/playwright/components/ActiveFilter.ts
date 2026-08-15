import { expect, Page, test } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class ActiveFilter extends BaseComponent {

    
    constructor(page: Page, selector = '.active-filter-card') {
        super(page, selector, 'generic', false, 'Active filter banner');
    }

    async checkFilter(label: string, description: string): Promise<void> {
        await test.step(`Check active filter shows label: "${label}" and description: "${description}"`, async () => {
            await expect(this.locator, 'Should be visible').toBeVisible();
            const activeFilter = this.locator.getByTestId("active-filter-label");
            const activeFilterDescription = this.locator.getByTestId("active-filter-value");
            await expect(activeFilter, `Should have the label "${label}"`).toHaveText(label);
            await expect(activeFilterDescription, `Should have the description "${description}"`).toHaveText(description);
        });
    }
}
