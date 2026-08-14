import { Page } from '@playwright/test';
import { Table } from './Table';
import { Paginator } from './Paginator';

export class Grid extends Table {

    editButtonSelector: string;
    deleteButtonSelector: string;
    paginator: Paginator;

    constructor(
        page: Page,
        selector = 'table',
        editLabel = 'Edit',
        deleteLabel = 'Delete',
        paginationLabel = 'Pagination',
        nextPageLabel = 'Next page',
    ) {
        super(page, selector);
        this.editButtonSelector = `[aria-label="${editLabel}"]`;
        this.deleteButtonSelector = `[aria-label="${deleteLabel}"]`;
        this.paginator = new Paginator(page, paginationLabel, nextPageLabel);
    }

    async clickInEditByKey(keyValue: number): Promise<void> {
        await this.addStep(`Click in the edit table for the row with the key: "${keyValue}"`, async () => {
            const row = this.locator.getByRole('row', { name: keyValue.toString() });
            await row?.locator(this.editButtonSelector).click();
        });
    }

    async clickInDeleteByKey(keyValue: number): Promise<void> {
        await this.addStep(`Click in the delete table for the row with the key: "${keyValue}"`, async () => {
            const row = this.locator.getByRole('row', { name: keyValue.toString() });
            await row?.locator(this.deleteButtonSelector).click();
        });
    }

    /**
     * Get every row's values across all pages, walking the paginator forward from whatever page
     * is currently shown, so grids with more rows than fit on one page aren't silently under-checked.
     */
    async getAllRowsValues(): Promise<Record<string, string | number>[]> {
        return await this.addStep('Get all row values across every page', async () => {
            const rows: Record<string, string | number>[] = [];
            rows.push(...await this.getRowsValues());
            while (await this.paginator.hasNextPage()) {
                await this.paginator.goToNextPage();
                rows.push(...await this.getRowsValues());
            }
            return rows;
        });
    }
}
