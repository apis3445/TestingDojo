import { Page, test, expect } from '@playwright/test';
import { Menu } from '../components/Menu';
import { Alert } from '../components/Alert';
import { ConfirmDialog } from '../components/ConfirmDialog';
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
    public locale: string;
    public screencastOverlay = false;
    protected baseURL: string;
    protected apiURL: string;
    public message: Alert;
    public confirmDialog: ConfirmDialog;
    
    /**
     * @param page - Playwright Page instance injected by the test fixture.
     * @param keyPage - Logical name for this page (e.g. `'Login'`, `'Dashboard'`). Used for step descriptions in the HTML report.
     * @param locale - BCP-47 locale code (e.g. `'en-US'`, `'es-MX'`). Determines which `data/xx-XX.json` file is loaded.
     *                 Defaults to the `LOCALE` environment variable, or `'en-US'` if not set.
     */
    constructor(protected readonly page: Page, public readonly keyPage: string, locale = process.env.LOCALE ?? 'en-US') {
        this.baseURL = process.env.BASE_URL ?? ''; // Read from .env (local) or CI environment variable — never hardcoded
        this.apiURL = process.env.API_URL ?? ''; // Read from .env (local) or CI environment variable — never hardcoded
        this.locale = locale;
        this.localeInfo = locales[locale] ?? enUS; // Loads the JSON file for the active locale; defaults to English if unknown
        this.menu = new Menu(page);
        this.message = new Alert(page, 'Success message');
        this.confirmDialog = new ConfirmDialog(page);
    }

    public async goTo() {
        await test.step(`Go to: "${this.baseURL}"`, async () => {
            await this.page.goto(this.baseURL);
        });
    }

    public async navigateTo(path: string) {
        const url = this.baseURL + path;
        await test.step(`Go to: "${url}"`, async () => {
            await this.page.goto(url);
        });
    }

    async goToDefaultPage() {
        await test.step('Go to default page', async () => {
            await this.page.goto('/');
        });
    }

    async press(key: string) {
        await this.page.keyboard.press(key);
    }

    public async assertEqual(expected: string, actual: string, assertMessage: string) {
        await test.step(assertMessage, async () => {
            expect(actual, assertMessage).toEqual(expected);
        });
        if (this.screencastOverlay) await this.showAssertOverlay(assertMessage);
    }

    public async assertArrayEqual(expected: string[], actual: string[], assertMessage: string) {
        await test.step(assertMessage, async () => {
            expect(actual, assertMessage).toEqual(expected);
        });
        if (this.screencastOverlay) await this.showAssertOverlay(assertMessage);
    }

    private async showAssertOverlay(message: string): Promise<void> {
        await this.page.screencast.showOverlay(
            `<div style="
                background: #1a4731;
                color: #6ee7b7;
                border-left: 4px solid #34d399;
                border-radius: 8px;
                padding: 10px 18px;
                font-family: monospace;
                font-size: 14px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.35);
                opacity: 0.8;
            ">✔ ${message}</div>`,
            { duration: 2000 },
        );
    }

    async checkSuccessMessage() {
        const assertDescription = 'Success message is visible';
        await test.step(
            assertDescription,
            async () => {
                await expect(this.message.locator, assertDescription).toBeVisible();
            },
        );
    }

}
