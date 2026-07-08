import { Page, test } from "@playwright/test";
import { BaseComponent } from "./BaseComponent";

// Wraps <input type="number">, which exposes the 'spinbutton' ARIA role instead of 'textbox'.
export class InputNumber extends BaseComponent {
    constructor(page: Page, selector: string, byRole = true, name = '') {
        super(page, selector, 'spinbutton', byRole, name);
    }

    async fill(value: string) {
        const stepDescription = `Fill "${this.locator.description()}:" with the value: "${value}"`;
        await test.step(stepDescription, async () => {
            await this.locator.fill(value);
        });
    }

    async clear() {
        const stepDescription = `Clear "${this.locator.description()}"`;
        await test.step(stepDescription, async () => {
            await this.locator.clear();
        });
    }
}
