import { expect, Locator, Page } from '@playwright/test';
import { Grid } from './Grid';

/**
 * Grid with collapsible group rows (e.g. "Reporte Detallado de Cuentas por Cobrar").
 * Each group row shows aggregated values and a toggle; expanding it reveals child rows.
 */
export class GroupedGrid extends Grid {

    groupRowSelector = 'tr.group-row';

    constructor(page: Page, selector = 'table') {
        super(page, selector);
    }

    private getGroupRow(groupName: string): Locator {
        return this.locator
            .locator(this.groupRowSelector)
            .filter({ has: this.page.locator('.group-label', { hasText: groupName }) });
    }

    async isGroupExpanded(groupName: string): Promise<boolean> {
        return await this.addStep(`Check if group "${groupName}" is expanded`, async () => {
            const expanded = await this.getGroupRow(groupName).locator('.group-toggle').getAttribute('aria-expanded');
            return expanded === 'true';
        });
    }

    async expandGroup(groupName: string): Promise<void> {
        await this.addStep(`Expand group "${groupName}"`, async () => {
            if (!(await this.isGroupExpanded(groupName))) {
                await this.getGroupRow(groupName).locator('.group-toggle').click();
            }
        });
    }

    async collapseGroup(groupName: string): Promise<void> {
        await this.addStep(`Collapse group "${groupName}"`, async () => {
            if (await this.isGroupExpanded(groupName)) {
                await this.getGroupRow(groupName).locator('.group-toggle').click();
            }
        });
    }

    async getGroupItemCount(groupName: string): Promise<number> {
        return await this.addStep(`Get item count for group "${groupName}"`, async () => {
            const text = await this.getGroupRow(groupName).locator('.item-count').innerText();
            const match = text.match(/\d+/);
            return match ? Number(match[0]) : 0;
        });
    }

    async getGroupSummary(groupName: string): Promise<Record<string, string | number>> {
        return await this.addStep(`Get summary values for group "${groupName}"`, async () => {
            await this.getColumnsHeaders();
            return await this.getRowValues(this.getGroupRow(groupName));
        });
    }

    /**
     * Check that a group's declared item count matches the number of child rows actually shown.
     * @param groupName group name (e.g. a client name)
     */
    async checkGroupItemCount(groupName: string): Promise<void> {
        await this.addStep(`Check item count for group "${groupName}" matches its child rows`, async () => {
            const itemCount = await this.getGroupItemCount(groupName);
            const childRows = await this.getGroupChildRows(groupName);
            expect(childRows, `Should show ${itemCount} child rows, matching the group's declared item count`).toHaveLength(itemCount);
        });
    }

    async getGroupChildRows(groupName: string): Promise<Record<string, string | number>[]> {
        return await this.addStep(`Get child rows for group "${groupName}"`, async () => {
            await this.expandGroup(groupName);
            await this.getColumnsHeaders();
            const itemCount = await this.getGroupItemCount(groupName);
            const childRows = this.getGroupRow(groupName).locator(`xpath=following-sibling::tr[position() <= ${itemCount}]`);
            const rows = await childRows.all();
            const values: Record<string, string | number>[] = [];
            for (const row of rows) {
                values.push(await this.getRowValues(row));
            }
            return values;
        });
    }
}
