import { Page } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

/**
 * Pagination bar shown below a paged grid (First/Previous/Next/Last page controls).
 */
export class Paginator extends BaseComponent {

    nextPageLabel: string;

    constructor(page: Page, navigationLabel = 'Pagination', nextPageLabel = 'Next page') {
        super(page, navigationLabel, 'navigation');
        this.nextPageLabel = nextPageLabel;
    }

    private nextPageButton() {
        return this.locator.getByRole('button', { name: this.nextPageLabel });
    }

    /**
     * Whether there's a next page to go to.
     */
    async hasNextPage(): Promise<boolean> {
        return await this.addStep('Check if there is a next page', async () => {
            return await this.nextPageButton().isEnabled();
        });
    }

    /**
     * Go to the next page.
     */
    async goToNextPage(): Promise<void> {
        await this.addStep('Go to next page', async () => {
            await this.nextPageButton().click();
        });
    }
}
