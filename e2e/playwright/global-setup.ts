import { Page, chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LoginApi } from './api/LoginApi';
import { Login } from './api/Login';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const authFolder = '.auth';

// globalSetup runs ONCE before any test file is executed.
// It logs in both users via the API (not the UI) and saves each browser session to a JSON file.
// Tests that need a logged-in user load that file instead of navigating through the login page —
// this avoids repeating authentication in every test and keeps tests faster and more independent.
async function globalSetup() {
    if (process.env.IS_AGENT) {
        return;
    }
    
    await fs.mkdir(authFolder, { recursive: true });

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(process.env.BASE_URL!);

    const loginApi = new LoginApi(page);

    let userLogin: Login = {
        Company: process.env.COMPANY!,
        UserName: process.env.NORMAL_USER!,
        Password: process.env.NORMAL_PASSWORD!,
        KeepSession: true,
        Code: 0,
    };
    await storeToken(page, await loginApi.login(userLogin));
    await saveAuthState(page, 'normal-user.json');

    userLogin = {
        Company: process.env.COMPANY ?? '',
        UserName: process.env.ADMIN_USER ?? '',
        Password: process.env.ADMIN_PASSWORD ?? '',
        KeepSession: true,
        Code: 0,
    };
    await storeToken(page, await loginApi.login(userLogin));
    await saveAuthState(page, 'admin.json');

    await browser.close();
}

// Injects the JWT into the browser's localStorage so the app treats the session as authenticated.
async function storeToken(page: Page, token: string) {
    await page.localStorage.setItem('token', token);
}

// Saves the full browser context (cookies, localStorage, sessionStorage) to a file.
// Playwright can restore this state in any test without re-running the login flow.
async function saveAuthState(page: Page, fileName: string) {
    await page.context().storageState({ path: path.join(authFolder, fileName) });
}

export default globalSetup;
