import { expect, Page, test } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

/**
 * Canvas component representing a specific element on the page.
 */
export class Canvas extends BaseComponent {

    /**
     * Constructor
     * @param page Playwright page
     * @param selector selector for the canvas element
     */
    constructor(page: Page, public selector: string, description = '') {
        super(page, selector, 'generic', false, description || selector);
    }

    /**
     * Click a pie/doughnut segment by its position in the dataset.
     * Chart.js draws on <canvas> with no per-segment DOM node, so the click point is derived
     * from the known dataset values (e.g. the mocked API response) plus the canvas' live
     * bounding box, instead of a hardcoded pixel position. Assumes Chart.js defaults:
     * segments start at 12 o'clock and are drawn clockwise in dataset order.
     * @param values dataset values in the order they were rendered (same order as the mocked API response)
     * @param index index of the segment to click
     */
    async clickSegment(values: number[], index: number) {
        await test.step(`On "${this.locator.description()}" click segment #${index}`, async () => {
            await this.locator.scrollIntoViewIfNeeded();
            await this.waitForStableRender();
            const box = await this.locator.boundingBox();
            if (!box) {
                throw new Error(`"${this.locator.description()}" has no bounding box (not visible?)`);
            }
            const total = values.reduce((sum, value) => sum + value, 0);
            const cumulative = values.slice(0, index).reduce((sum, value) => sum + value, 0);
            const midValue = cumulative + values[index] / 2;
            const midAngle = -Math.PI / 2 + (midValue / total) * 2 * Math.PI; // Chart.js doughnut: starts at 12 o'clock, clockwise
            const outerRadius = Math.min(box.width, box.height) / 2;
            const radius = outerRadius * 0.75; // midpoint of the doughnut ring (cutout ~50%-100%)
            const relativeX = box.width / 2 + radius * Math.cos(midAngle);
            const relativeY = box.height / 2 + radius * Math.sin(midAngle);
            await this.locator.click({ position: { x: relativeX, y: relativeY } });
        });
    }

    /**
     * Click a vertical bar by its position among evenly-spaced categories.
     * Bar positions can't be guessed from fixed fractions: the plot area's left edge shifts with
     * the y-axis value labels' width (varies a lot by locale, e.g. English "$10K" vs. Spanish
     * "10 mil US$"), and a single fixed row won't intersect every bar (shorter bars, i.e. smaller
     * values, don't reach as high as taller ones). Instead, this samples the rendered canvas
     * pixels: it searches rows from mid-height down toward the baseline for the one closest to
     * the baseline that still shows exactly `categoryCount` bars (any closer risks entering the
     * x-axis label text), then clicks the center of the requested bar on that row. Pixels are
     * classified as "bar" by color saturation (gridlines and axis text are grayscale, R≈G≈B;
     * a solid-color bar isn't) rather than a specific hardcoded RGB, so it survives palette changes.
     * @param categoryCount total number of bars/categories rendered
     * @param index index of the bar to click
     */
    async clickBar(categoryCount: number, index: number) {
        await test.step(`On "${this.locator.description()}" click bar #${index}`, async () => {
            await this.locator.scrollIntoViewIfNeeded();
            await this.waitForStableRender();
            const box = await this.locator.boundingBox();
            if (!box) {
                throw new Error(`"${this.locator.description()}" has no bounding box (not visible?)`);
            }
            const point = await this.locator.evaluate((canvas: HTMLCanvasElement, args) => {
                const scaleX = canvas.width / canvas.clientWidth;
                const scaleY = canvas.height / canvas.clientHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Canvas 2d context unavailable');
                }
                const isColored = (r: number, g: number, b: number, a: number) =>
                    a > 200 && Math.max(r, g, b) - Math.min(r, g, b) > 20;
                const findSegments = (deviceY: number): Array<[number, number]> => {
                    const row = ctx.getImageData(0, deviceY, canvas.width, 1).data;
                    const segments: Array<[number, number]> = [];
                    let segmentStart = -1;
                    for (let x = 0; x < canvas.width; x++) {
                        const i = x * 4;
                        const colored = isColored(row[i], row[i + 1], row[i + 2], row[i + 3]);
                        if (colored && segmentStart === -1) {
                            segmentStart = x;
                        } else if (!colored && segmentStart !== -1) {
                            segments.push([segmentStart, x - 1]);
                            segmentStart = -1;
                        }
                    }
                    if (segmentStart !== -1) {
                        segments.push([segmentStart, canvas.width - 1]);
                    }
                    return segments;
                };
                let bestSegments: Array<[number, number]> | null = null;
                let bestDeviceY = -1;
                const debugCounts: string[] = [];
                for (let fraction = 0.5; fraction <= 0.95; fraction += 0.05) {
                    const deviceY = Math.round(fraction * canvas.height);
                    const segments = findSegments(deviceY);
                    debugCounts.push(`${fraction.toFixed(2)}:${segments.length}`);
                    if (segments.length === args.categoryCount) {
                        bestSegments = segments;
                        bestDeviceY = deviceY;
                    }
                }
                if (!bestSegments) {
                    throw new Error(`Could not find a row showing all ${args.categoryCount} bars. Counts by fraction: ${debugCounts.join(', ')}`);
                }
                const [segmentXStart, segmentXEnd] = bestSegments[args.index];
                return {
                    x: (segmentXStart + segmentXEnd) / 2 / scaleX,
                    y: bestDeviceY / scaleY,
                };
            }, { categoryCount, index });
            await this.locator.click({ position: point });
        });
    }

    /**
     * Wait for the chart's draw animation to finish before computing click coordinates.
     * Chart.js animates bars/arcs growing into place; a click before that finishes can land
     * on empty canvas. Polls the rendered pixels until two consecutive reads match.
     */
    private async waitForStableRender() {
        let previousFrame = '';
        await expect.poll(async () => {
            const currentFrame = await this.locator.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
            const isStable = currentFrame === previousFrame;
            previousFrame = currentFrame;
            return isStable;
        }).toBe(true);
    }
}