// Login feature tests.
// Credentials come from process.env.* — never hardcoded.
//   Local:  values are read from e2e/playwright/.env (excluded from git via .gitignore)
//   CI:     values are injected by GitHub Actions secrets
// Expected menu items come from localeInfo (data/xx-XX.json) so assertions work in every language.
import { test } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { AnnotationType } from '../utils/AnnotationType';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Valid login', () => {

  test('Admin user sees correct menu', {
    tag: ['@Login'],
    annotation: [
      { type: AnnotationType.Description, description: 'Login with valid admin user' },
      { type: AnnotationType.Precondition, description: 'A valid admin username and password should exist' },
    ],
  }, async ({ page, locale }) => {
    const loginPage = new LoginPage(page, locale);
    await loginPage.goTo();
    await loginPage.login({
      Company: process.env.COMPANY ?? '',
      UserName: process.env.ADMIN_USER ?? '',
      Password: process.env.ADMIN_PASSWORD ?? '',
    });
    const dashboardPage = new DashboardPage(page, locale);
    const expectedMenus = dashboardPage.localeInfo.menu.admin;
    const menuInPage = await dashboardPage.menu.getMenus();
    await dashboardPage.assertArrayEqual(expectedMenus, menuInPage, `Menu are equal to: "${expectedMenus}"`);
  });

  test('Normal user sees correct menu', {
    tag: ['@Login'],
    annotation: [
      { type: AnnotationType.Description, description: 'Login with valid normal user' },
      { type: AnnotationType.Precondition, description: 'A valid normal username and password should exist' },
    ],
  }, async ({ page, locale }) => {
    const loginPage = new LoginPage(page, locale);
    await loginPage.goTo();
    await loginPage.login({
      Company: process.env.COMPANY ?? '',
      UserName: process.env.NORMAL_USER ?? '',
      Password: process.env.NORMAL_PASSWORD ?? '',
    });
    const dashboardPage = new DashboardPage(page, locale);
    await dashboardPage.menu.locator.waitFor();
    const expectedMenus = dashboardPage.localeInfo.menu.normal;
    const menuInPage = await dashboardPage.menu.getMenus();
    await dashboardPage.assertArrayEqual(expectedMenus, menuInPage, `Menu are equal to: "${expectedMenus}"`);
  });

});

test.describe('Invalid login', () => {

  const scenarios = [
    {
      description: 'invalid username',
      credentials: { Company: process.env.COMPANY ?? '', UserName: 'invalid_user', Password: process.env.ADMIN_PASSWORD ?? '' },
    },
    {
      description: 'invalid password',
      credentials: { Company: process.env.COMPANY ?? '', UserName: process.env.ADMIN_USER ?? '', Password: 'wrong_password' },
    },
    {
      description: 'invalid company',
      credentials: { Company: 'wrong_company', UserName: process.env.ADMIN_USER ?? '', Password: process.env.ADMIN_PASSWORD ?? '' },
    },
  ];

  for (const scenario of scenarios) {
    test(`${scenario.description} shows error`, {
      tag: ['@Login'],
      annotation: [
        { type: AnnotationType.Description, description: `Login with ${scenario.description} should show a generic error` },
        { type: AnnotationType.Precondition, description: 'The login page must be accessible' },
      ],
    }, async ({ page, locale }) => {
      const loginPage = new LoginPage(page, locale);
      await loginPage.goTo();
      await loginPage.login(scenario.credentials);
      await loginPage.assertInvalidCredentials();
    });
  }

});
