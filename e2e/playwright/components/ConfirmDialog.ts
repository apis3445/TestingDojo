import { expect, Page, test } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class ConfirmDialog extends BaseComponent {
    confirmButtonSelector = '.modal-footer button:not([data-bs-dismiss])';
    cancelButtonSelector = '.modal-footer button[data-bs-dismiss="modal"]';
    closeButtonSelector = '.modal-header .btn-close';
    titleSelector = '.modal-title';
    messageSelector = '.modal-body';

    constructor(page: Page, name = 'Confirm dialog') {
        super(page, 'app-confirm-dialog .modal.show', 'dialog', false, name);
    }

    async confirm() {
        await test.step(`On "${this.locator.description()}" confirm the action`, async () => {
            await this.locator.locator(this.confirmButtonSelector).click();
            await this.locator.waitFor({ state: 'hidden' });
        });
    }

    async cancel() {
        await test.step(`On "${this.locator.description()}" cancel the action`, async () => {
            await this.locator.locator(this.cancelButtonSelector).click();
            await this.locator.waitFor({ state: 'hidden' });
        });
    }

    async close() {
        await test.step(`Close "${this.locator.description()}" without confirming`, async () => {
            await this.locator.locator(this.closeButtonSelector).click();
            await this.locator.waitFor({ state: 'hidden' });
        });
    }

    /**
     * Check the dialog is visible with the expected content
     * @param title Expected dialog title
     * @param body Expected dialog message
     * @param confirmLabel Expected confirm button label
     * @param cancelLabel Expected cancel button label
     */
    async checkDialog(title: string, body: string, confirmLabel: string, cancelLabel: string) {
        await test.step(`Check "${this.locator.description()}" shows title: "${title}" and message: "${body}"`, async () => {
            await expect(this.locator, 'Should be visible').toBeVisible();
            await expect(this.locator.locator(this.titleSelector), `Should have the title "${title}"`).toHaveText(title);
            await expect(this.locator.locator(this.messageSelector), `Should have the message "${body}"`).toHaveText(body);
            await expect(this.locator.locator(this.confirmButtonSelector), `Should have the confirm button "${confirmLabel}"`).toHaveText(confirmLabel);
            await expect(this.locator.locator(this.cancelButtonSelector), `Should have the cancel button "${cancelLabel}"`).toHaveText(cancelLabel);
        });
    }
}
