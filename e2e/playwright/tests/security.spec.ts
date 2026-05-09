// Access-control tests — verify that the app protects routes correctly.
// test.use({ storageState }) loads a pre-authenticated browser session saved by global-setup.ts,
// so these tests start already logged in without touching the login page.
import { test } from '../fixtures';
import { expect } from '@playwright/test';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LoginPage } from '../pages/LoginPage';
import { AnnotationType } from '../utils/AnnotationType';

test.describe('Valid access to the page', () => {
    test.use({ storageState: '.auth/normal-user.json' });

    test('Normal user should see not found page for restricted page', {
        tag: ['@Login'],
        annotation: [
            { type: AnnotationType.Description, description: 'Login with valid admin user' },
            { type: AnnotationType.Precondition, description: 'A valid admin username and password should exist' },
        ],
    }, async ({ page, locale }) => {
        await page.goto('/servers');
        const notFoundPage = new NotFoundPage(page, locale);
        await expect(notFoundPage.title.locator).toBeVisible();
    });
});

test.describe('Access without authentication', () => {

    test('User without access should redirects to login', {
        tag: ['@Login'],
        annotation: [
            { type: AnnotationType.Description, description: 'Login with valid admin user' },
            { type: AnnotationType.Precondition, description: 'A valid admin username and password should exist' },
        ],
    }, async ({ page, locale }) => {
        await page.goto('/accounts-receivable/dashboard');
        const loginPage = new LoginPage(page, locale);
        await expect(loginPage.submit.locator).toBeVisible();
    });
});
