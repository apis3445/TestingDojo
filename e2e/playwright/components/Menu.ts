import { Page, test } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class Menu extends BaseComponent {

    constructor(page: Page) {
        const topMenuLocator = '.menu-list';
        super(page, topMenuLocator, 'menu', false, 'Menu');
    }

    waitFor(): Promise<void> {
        return test.step('Wait for menu', () => this.locator.waitFor());
    }

    getMenus(): Promise<string[]> {
        return test.step('Get menu options', async () => {
            const menuTexts = await this.locator.locator('.menu-item .menu-label').describe("menu labels").allInnerTexts();
            return menuTexts.map(text => text.replace(/\n/g, ''));
        });
    }

    async openItem(topLabel: string, itemLabel: string) {
        await test.step(`Open menu item "${topLabel} > ${itemLabel}"`, async () => {
            await this.locator.getByRole('button', { name: topLabel }).click();
            await this.locator.getByRole('button', { name: itemLabel }).click();
        });
    }
}