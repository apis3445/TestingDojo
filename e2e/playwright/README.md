# Playwright — UI End-to-End Tests

This project contains UI end-to-end tests for the [Testing Dojo demo app](https://abi-testing-dojo-demo.azurewebsites.net/) written in **TypeScript** using [Playwright](https://playwright.dev/).

## What is being tested?

The tests open a real browser, interact with the app the same way a user would (clicking, typing, navigating), and verify the app behaves correctly — for example, that a valid login redirects to the right page and that an invalid password shows an error message.

---

## Key concepts

### Playwright
A browser automation library from Microsoft. It controls real browsers (Chrome, Firefox, Safari) from code, letting you simulate user interactions and assert what appears on screen. No manual clicking required.

### Architecture: POM + Components

This project combines two patterns: **Page Object Model (POM)** and **Atomic Components**. Together they give each layer a single job, so tests stay short and selectors live in one place.

![Playwright Architecture](docs/images/architecture.svg)

**Why split pages from components?**
- A `Button` or `InputText` component can be reused on any page — define it once, use it everywhere.
- If the selector for a text box changes, you fix it in `InputText.ts`, not in every test that uses it.
- Components automatically add a step to the HTML report on every action — pages and tests get reporting for free.

**How it looks in practice:**

```typescript
// components/Button.ts — knows how to click one button and log it
export class Button extends BaseComponent {
    async click() {
        await test.step(`Click: "${this.locator.description()}"`, async () => {
            await this.locator.click();
        });
    }
}

// pages/LoginPage.ts — composes components into a page-level action
export class LoginPage extends BasePage {
    company  = new InputText(this.page, this.localeInfo.home.company);
    user     = new InputText(this.page, this.localeInfo.home.user);
    password = new InputPassword(this.page, this.localeInfo.home.pass);
    submit   = new Button(this.page, this.localeInfo.home.login);

    async login(userLogin: UserLogin) {
        await this.goTo();
        await this.company.fill(userLogin.Company);
        await this.user.fill(userLogin.UserName);
        await this.password.fill(userLogin.Password);
        await this.submit.click();
    }
}

// tests/login.spec.ts — describes the scenario, no selectors in sight
test('Admin user sees correct menu', async ({ page, locale }) => {
    const loginPage = new LoginPage(page, locale);
    await loginPage.login({
        Company:  process.env.COMPANY,
        UserName: process.env.ADMIN_USER,
        Password: process.env.ADMIN_PASSWORD,
    });
    // assert the menu...
});
```

### ARIA roles
Components locate elements by their **ARIA role** (what an element *is* — a button, a text box, a heading) and visible label, not by CSS class or ID. This means tests keep working when the app's styling or markup changes, and the same locator strategy works across all languages since the role doesn't change.

```typescript
// Finds the button whose visible text matches localeInfo.home.login ("Login", "Iniciar Sesión", etc.)
new Button(this.page, this.localeInfo.home.login)
// → page.getByRole('button', { name: 'Login' })
```

### HTML report
After every test run, Playwright generates an HTML report that shows:
- Which tests passed and failed
- A step-by-step trace of every action taken
- Screenshots and videos on failure

Open it with `npx playwright show-report`.

### Locales and JSON language files
The tests run against **English, Spanish, German, and Japanese** locales on Desktop Chrome. This verifies that the app works correctly for international users without manually switching the browser language.

Because the app shows different text in each language, UI strings are never hardcoded. Every label is stored in a JSON file under `data/` and referenced by key in code:

```
data/
  en-US.json   ← English  (e.g. "login": "Login")
  es-MX.json   ← Spanish  (e.g. "login": "Iniciar Sesión")
  de-DE.json   ← German   (e.g. "login": "Anmelden")
  ja-JP.json   ← Japanese (e.g. "login": "ログイン")
```

```typescript
// Good — locale-aware, works in every language
submit = new Button(this.page, this.localeInfo.home.login);

// Bad — hardcoded English, breaks in other locales
submit = new Button(this.page, 'Login');
```

`BasePage` automatically loads the right file based on the active Playwright project (language). See [`docs/01-framework.md`](docs/01-framework.md) for details on adding a new language.

---

## Project structure

```
e2e/playwright/
  tests/
    login.spec.ts       Login scenarios (valid, invalid credentials)
    security.spec.ts    Access control for protected routes
  pages/                Page objects — one class per screen
  components/           Reusable UI element wrappers (InputText, Button, etc.)
  data/                 JSON locale files — one per language (en-US, es-MX, de-DE, ja-JP)
  api/                  API helpers for pre-conditions (faster than going through the UI)
  fixtures/             Custom test setup — injects locale and pre-authenticated pages
  utils/
    AnnotationType.ts   Enum with Precondition / PostCondition / Description — spec annotation arrays only
  global-setup.ts       Runs once before all tests — logs in via API and saves browser auth state
  playwright.config.ts  Browser projects (one per language), timeouts, reporter config
  .env                  Local credentials — excluded from git, never committed
```

---

## Setup

### 1. Install Node.js

Download from [nodejs.org](https://nodejs.org/) (LTS version recommended).

```bash
node --version  # should print v18 or higher
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Install browsers

Playwright manages its own browser binaries. This command downloads them:

```bash
npx playwright install --with-deps
```

### 4. Create a `.env` file

> **Security rule:** credentials must never be stored in code or committed to git.
> The `.env` file is excluded from the repository by `.gitignore` — it exists only on your machine.
> On CI, credentials are injected automatically via GitHub Actions Secrets.

Copy the example file and fill in the real values:

```bash
cp .env.example .env
```

Then open `.env` and replace the placeholder values. The file looks like this (see [`.env.example`](.env.example) for the full template with descriptions):

| Variable | Description |
|---|---|
| `BASE_URL` | URL of the app under test |
| `AUTH_URL` | URL of the authentication service |
| `COMPANY` | Company identifier used at login |
| `ADMIN_USER` | Admin username |
| `ADMIN_PASSWORD` | Admin password |
| `NORMAL_USER` | Regular user username |
| `NORMAL_PASSWORD` | Regular user password |
| `LOCALE` | Browser locale for local runs |

On CI these are injected automatically via GitHub Actions secrets and variables — no `.env` file needed.

---

## Running tests

```bash
# All tests, all browsers
npx playwright test

# Single test file
npx playwright test tests/login.spec.ts

# Single browser only
npx playwright test --project=chromium

# Interactive UI mode (great for debugging)
npx playwright test --ui

# View the HTML report after a run
npx playwright show-report
```

---

## Test coverage

| File | What it tests |
|---|---|
| `login.spec.ts` | Admin login sees admin menu · Normal user login sees normal menu · Invalid username / password / company show an error |
| `security.spec.ts` | Admin user can navigate to protected routes |

---

## Writing your first test

See **[docs/02-how-to-create-a-test.md](docs/02-how-to-create-a-test.md)** for a step-by-step guide covering:
- How to find element locators using Playwright's tools
- How to create a component, a page object, and a test from scratch
- How to use locale keys instead of hardcoded strings

---

## Troubleshooting

**Tests fail with `Error: browserType.launch: Executable doesn't exist`**
You skipped the browser installation step. Run:
```bash
npx playwright install --with-deps
```

**Tests fail with `process.env.ADMIN_USER is undefined` or similar**
Your `.env` file is missing or incomplete. Copy the template and fill in the values:
```bash
cp .env.example .env
```

**Tests fail with `Login API failed` during setup**
The `AUTH_URL` or credentials in your `.env` are incorrect. Double-check that `ADMIN_USER`, `ADMIN_PASSWORD`, and `COMPANY` match a real account in the app.

**All tests fail but I ran them before and they passed**
The app may be down or slow. Check `BASE_URL` in your `.env` is reachable, then try:
```bash
npx playwright test --project=English --retries=1
```
