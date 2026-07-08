import { test } from '../fixtures';
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
        const notFoundPage = new NotFoundPage(page, locale);
        await notFoundPage.navigateTo('/security/servers');
        await notFoundPage.assertTitleVisible();
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
        const loginPage = new LoginPage(page, locale);
        await loginPage.navigateTo('/accounts-receivable/dashboard');
        await loginPage.assertLoginFormVisible();
    });
});
