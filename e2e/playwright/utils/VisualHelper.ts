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

    async checkElementSnapshot(element: Locator, snapshotName: string, timeout = 5_000, maxDiffPixels = 100) {
        const stepDescription = 'Compare snapshot: ' + snapshotName + ' with maxDiffPixels: ' + maxDiffPixels;
        await test.step(stepDescription, async () => {
            await expect(element).toHaveScreenshot(snapshotName, {
                timeout: timeout,
                maxDiffPixels: maxDiffPixels
            });
        });
    }
}