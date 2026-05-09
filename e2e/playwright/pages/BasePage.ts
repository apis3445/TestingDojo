import { Page, test, expect } from '@playwright/test';
import { AnnotationType } from '../utils/AnnotationType';
import { Menu } from '../components/Menu';
import enUS from '../data/en-US.json';
import esMX from '../data/es-MX.json';
import deDE from '../data/de-DE.json';
import jaJP from '../data/ja-JP.json';

export type Role = 'admin' | 'normal';
export type LocaleData = typeof enUS;

// Maps locale codes to their JSON data files.
// Adding a new language means: (1) add a JSON file under data/, (2) import it here, (3) add the entry below.
const locales: Record<string, LocaleData> = {
    'en-US': enUS,
    'es-MX': esMX,
    'de-DE': deDE,
    'ja-JP': jaJP,
};

export class BasePage {

    public menu: Menu;
    public localeInfo: LocaleData;
    protected baseURL: string;

    /**
     * @param page - Playwright Page instance injected by the test fixture.
     * @param keyPage - Logical name for this page (e.g. `'Login'`, `'Dashboard'`). Used for step descriptions in the HTML report.
     * @param locale - BCP-47 locale code (e.g. `'en-US'`, `'es-MX'`). Determines which `data/xx-XX.json` file is loaded.
     *                 Defaults to the `LOCALE` environment variable, or `'en-US'` if not set.
     */
    constructor(protected readonly page: Page, public readonly keyPage: string, locale = process.env.LOCALE ?? 'en-US') {
        this.baseURL = process.env.BASE_URL ?? ''; // Read from .env (local) or CI environment variable — never hardcoded
        this.localeInfo = locales[locale] ?? enUS; // Loads the JSON file for the active locale; defaults to English if unknown
        this.menu = new Menu(page);
    }

    public async goTo() {
        await this.addStep(`Go to: "${this.baseURL}"`, async () => {
            await this.page.goto(this.baseURL);
        });
    }

    addAnnotation(type: AnnotationType, description: string) {
        test.info().annotations.push({ type: type, description: description });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async addStep(stepDescription: string, stepFunction: any): Promise<any> {
        return test.step(stepDescription, stepFunction);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async addStepWithAnnotation(type: AnnotationType, description: string, stepFunction: () => Promise<any>) {
        this.addAnnotation(type, description);
        return this.addStep(description, stepFunction);
    }

    async goToDefaultPage() {
        await this.addStep('Go to default page', async () => {
            await this.page.goto('/');
        });
    }

    async press(key: string) {
        await this.page.keyboard.press(key);
    }

    public async assertEqual(expected: string, actual: string, assertMessage: string) {
        await this.addStep(assertMessage, async () => {
            expect(actual, assertMessage).toEqual(expected);
        });
    }

    public async assertArrayEqual(expected: string[], actual: string[], assertMessage: string) {
        await this.addStep(assertMessage, async () => {
            expect(actual, assertMessage).toEqual(expected);
        });
    }

}