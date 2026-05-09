import { Page } from "@playwright/test";
import { BaseComponent } from "./BaseComponent";

export class InputText extends BaseComponent {
    constructor(page: Page, selector: string, byRole = true) {
        super(page, selector, 'textbox', byRole);
    }

    async fill(value: string) {
        const stepDescription = `Fill "${this.locator.description()}:" with the value: "${value}"`;
        await this.addStep(stepDescription, async () => {
            await this.locator.fill(value);
        });
    }

    async clear() {
        const stepDescription = `Clear "${this.locator.description()}"`;
        await this.addStep(stepDescription, async () => {
            await this.locator.clear();
        });
    }

    async type(value: string) {
        const stepDescription = `Type "${this.locator.description()}:" with the value: "${value}"`;
        await this.addStep(stepDescription, async () => {
            await this.locator.pressSequentially(value);
        });
    }
}