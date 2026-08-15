import { expect, Locator, Page } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class Table extends BaseComponent {

    columnsText: string[];
    columnSelector = 'th';
    cellSelector = 'td';
    rowSelector = 'tbody > tr';

    constructor(page: Page, selector = 'table') {
        super(page, selector, 'table', false);
        this.columnsText = [];
    }

    async getTotalRows(): Promise<number> {
        return await this.addStep('Get total of rows in the table', async () => {
            const totalRows = await this.locator.locator(this.rowSelector).count();
            return totalRows;
        });
    }

    async getColumnsHeaders(): Promise<string[]> {
        return await this.addStep('Get the columns headers of the table', async () => {
            const gridColumns = await this.locator.locator(this.columnSelector).allInnerTexts();
            this.columnsText = [];
            for (let i = 0; i < gridColumns.length; i++) {
                const columnHeader = gridColumns[i].trim();
                if (columnHeader != '' && columnHeader != 'Actions') {
                    // Webkit adds '\n' so we need to remove
                    this.columnsText.push(columnHeader.replace(/\n/g, ''));
                }
            }
            return this.columnsText;
        });
    }

    async getColumnIndex(columnHeader: string): Promise<number> {
        await this.getColumnsHeaders();
        return this.columnsText.indexOf(columnHeader);
    }

    async getRowByColumnIndex(value: string, index: number): Promise<Locator | null> {
        return await this.addStep(`Get the row with the value: "${value}" in the column: "${index}"`, async () => {
            const rows = this.locator.locator(this.rowSelector);
            const totalRows = await rows.count();
            for (let i = 0; i < totalRows; i++) {
                const row = rows.nth(i);
                const cellValue = await row.locator(this.cellSelector).nth(index).innerText();
                if (cellValue == value)
                    return row;
            }
            return null;
        });
    }

    /**
     * Get the rows of the table as an array of record <string, string | number>
     * @returns The rows in the table as an array of record with the header as properties and the row data as the value
     */
    async getRowsValues(): Promise<Record<string, string | number>[]> {
        return await this.addStep('Get all the rows in the table', async () => {
            const rows: Record<string, string | number>[] = [];
            const totalRows = await this.getTotalRows();
            await this.getColumnsHeaders();

            //Starts in 1 to exclude header
            for (let i = 0; i < totalRows; i++) {
                let rowValues: Record<string, string | number> = {};
                const row = this.locator.locator(this.rowSelector).nth(i);
                rowValues = await this.getRowValues(row);
                rows.push(rowValues);
            }
            return rows;
        });
    }

    /**
     * Get row values in a object from a row — numeric cells (currency, unit-suffixed counts) are
     * normalized to numbers, text cells stay as trimmed strings.
     * @param row Row to get value
     * @returns row values as object
     */
    async getRowValues(row: Locator | null) {
        return await this.addStep('Get the row values', async () => {
            const rowValues: Record<string, string | number> = {};
            const columnValues = await row?.locator(this.cellSelector).allInnerTexts();
            for (let i = 0; i < columnValues!.length; i++) {
                if (columnValues) {
                    let columnValue = columnValues[i].trim();
                    if (columnValue != '') {
                        rowValues[this.columnsText[i]] = this.normalizeCellValue(columnValue);
                    }
                }
            }
            return rowValues;
        });
    }

    /**
     * Locate a row by its accessible name (rows expose role="button" for accessibility, per WAI-ARIA:
     * https://www.w3.org/WAI/ARIA/apg/patterns/table/ — the click target keeps the row's accessible
     * name, computed from its cell text, so matching by client name is enough).
     * @param rowName accessible name of the row (e.g. a client name)
     */
    private getRowByButton(rowName: string): Locator {
        return this.locator.getByRole('button', { name: rowName });
    }

    /**
     * Click a row by its accessible name.
     * @param rowName accessible name of the row (e.g. a client name)
     */
    async clickRow(rowName: string): Promise<void> {
        await this.addStep(`Click "${rowName}" row`, async () => {
            await this.getRowByButton(rowName).click();
        });
    }

    /**
     * Get the values of a single row identified by its accessible name.
     * @param rowName accessible name of the row (e.g. a client name)
     */
    async getRowValuesByName(rowName: string): Promise<Record<string, string | number>> {
        return await this.addStep(`Get values for "${rowName}" row`, async () => {
            await this.getColumnsHeaders();
            const row = this.locator
                .locator(this.rowSelector)
                .filter({ has: this.page.getByRole('button', { name: rowName }) });
            return await this.getRowValues(row);
        });
    }

    /**
     * Normalize a rendered cell for comparison: if the cell starts with a number (after stripping
     * currency symbols and thousands separators) and nothing after it contains another digit, it's
     * treated as numeric with a unit suffix (e.g. "$3,480.00" -> 3480, "69 d" -> 69, "69 日" -> 69 —
     * suffix scripts aren't assumed, only "no more digits follow"); otherwise the trimmed text is
     * returned as-is, so text columns (e.g. a client name) compare unaffected.
     */
    private normalizeCellValue(text: string): string | number {
        const stripped = text.replace(/[$,]/g, '').trim();
        const match = stripped.match(/^-?\d+(\.\d+)?/);
        if (match && !/\d/.test(stripped.slice(match[0].length))) {
            return Number(match[0]);
        }
        return text.trim();
    }

        /**
     * Get rows values as an object finding the row with the key column
     * @param key Key to find the row
     * @param keyColumnTitle Key column header title
     * @returns
     */
    async getRowValuesByKey(key: number, keyColumnTitle = 'Key') {
        return await this.addStep(`Get the row values for the key: "${key}" in the column: "${keyColumnTitle}"`, async () => {
            const row = await this.getRowByKey(key, keyColumnTitle);
            const rowValues = await this.getRowValues(row);
            return rowValues;
        });
    }

    async getRowByKey(key: number, keyColumnTitle = 'Key'): Promise<Locator | null> {
        return await this.addStep(`Get the row with the "${key}" in the column: "${keyColumnTitle}"`, async () => {
            const index = await this.getColumnIndex(keyColumnTitle);
            const row = await this.getRowByColumnIndex(key.toString(), index);
            return row;
        });
    }

    async checkHeaders(expectedHeaders: string[]) {
        await this.addStep(`Check headers match: ${expectedHeaders.join(', ')}`, async () => {
            const actualHeaders = await this.getColumnsHeaders();
            expect(actualHeaders, 'Table headers should match with:' + expectedHeaders.join(', ')).toEqual(expectedHeaders);
        });
    }
}
