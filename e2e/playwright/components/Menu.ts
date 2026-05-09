import { Page } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class Menu extends BaseComponent {

    constructor(page: Page) {
        const topMenuLocator = '.menu-list';
        super(page, topMenuLocator, 'menu', false, 'Menu');
    }

    getMenus(): Promise<string[]> {
        return this.addStep('Get menu options', async () => {
            const menuTexts = await this.locator.locator('.menu-item .menu-label').describe("menu labels").allInnerTexts();
            return menuTexts.map(text => text.replace(/\n/g, ''));
        });
    }
}