import { Page, test } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class ComboBox extends BaseComponent {

    constructor(page: Page, selector: string, byRole = true, name = '') {
        super(page, selector, 'combobox', byRole, name);
    }

    async selectOption(value: string) {
        await test.step(`On "${this.locator.description()}" select the option "${value}"`, async () => {
            await this.locator.selectOption(value);
        });
    }

    async selectRandomOptionWithoutText(textToExclude: string) {
        await test.step(`On "${this.locator.description()}" select any option`, async () => {
            await this.locator.waitFor();
            const options = (await this.locator.locator('option:not([disabled])').allInnerTexts())
                .map(o => o.trim())
                .filter(o => !o.includes(textToExclude));
            if (options.length === 0) throw new Error('No available options found');
            await this.selectOption(this.pickRandom(options));
        });
    }

    async selectRandomOption() {
        await test.step(`On "${this.locator.description()}" select any option`, async () => {
            const options = (await this.locator.locator('option:not([disabled])').allInnerTexts())
                .map(o => o.trim());
            await this.selectOption(this.pickRandom(options));
        });
    }

    private pickRandom(options: string[]): string {
        return options[Math.floor(Math.random() * options.length)];
    }
}