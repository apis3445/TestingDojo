import { expect, Locator, Page, test } from '@playwright/test';

export class VisualHelper {

    constructor(private page: Page) {

    }

    /**
     * Check full page snapshot
     * @param snapshotName Snapshot name
     * @param timeout Max timeout
     * @param maxDiffPixels Max number of differing pixels allowed
     */
    async checkPageSnapshot(snapshotName: string, timeout = 5_000, maxDiffPixels = 100) {
        const stepDescription = 'Compare snapshot: ' + snapshotName + ' with maxDiffPixels: ' + maxDiffPixels;
        await test.step(stepDescription, async () => {
            await expect(this.page).toHaveScreenshot(snapshotName, {
                timeout: timeout,
                maxDiffPixels: maxDiffPixels
            });
        });
    }

    /**
     * Check element snapshot
     * @param element Element to check the snapshot
     * @param snapshotName Name of the snapshot
     * @param timeout Max timeout
     * @param maxDiffPixels Max number of differing pixels allowed
     * @param mask Locators to mask out of the screenshot (e.g. floating widgets not relevant to the assertion)
     */
    async checkElementSnapshot(element: Locator, snapshotName: string, timeout = 5_000, maxDiffPixels = 100, mask: Locator[] = []) {
        const stepDescription = 'Compare snapshot: ' + snapshotName + ' with maxDiffPixels: ' + maxDiffPixels;
        await test.step(stepDescription, async () => {
            await expect(element).toHaveScreenshot(snapshotName, {
                timeout: timeout,
                maxDiffPixels: maxDiffPixels,
                mask: mask
            });
        });
    }
}