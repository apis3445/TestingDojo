import test, { Page } from '@playwright/test';
import { InputText } from './InputText';

export class InputPassword extends InputText {

    constructor(page: Page, selector: string, byRole = true) {
        super(page, selector, byRole);
    }

    override async fill(value: string) {
        // Passwords are shown as ***** in the HTML report so that real credentials are never exposed
        // in screenshots, videos, or CI logs even when a test fails and artifacts are uploaded.
        // { box: true } groups all sub-steps inside this step so failures are highlighted at this level.
        const stepDescription = `Fill "${this.locator.description()}" with value: *****`;
        await test.step(stepDescription, async () => {
            await this.locator.fill(value);
        }, { box: true });
    }
}