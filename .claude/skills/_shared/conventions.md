# Playwright Conventions

Applies to all Playwright skills. Read this when starting any component, page object, or test task.

## Locator priority

`BaseComponent` supports exactly two locating modes — pick one, don't improvise others:

1. **Role + accessible name** (`byRole = true`, the default) — pass the visible label as `selector` and the ARIA role. Preferred: survives CSS changes and matches what screen readers see.
2. **CSS selector** (`byRole = false`) — only when the element has no usable ARIA role. Pass a human-readable `name` so the HTML report shows something better than the raw selector.

For ad-hoc locators *inside* component methods (always relative to `this.locator`, never `page`), prefer in order: `getByRole()` → `getByText()` → `getByLabel()` → `getByTestId()` → CSS.

## Reading HTML snapshots

Snapshot files in `e2e/playwright/.snapshots/` are full Angular DOM dumps. Never read one whole. Grep it first (widget tag, id, label text, `role=` attribute) to find the line range, then Read only that region with offset/limit. If grep finds nothing, grep for nearby landmarks (headings, form tags) — don't fall back to a full read.

## Localization — no hardcoded UI text

The app runs in English, Spanish, German, and Japanese. All visible UI strings must come from the locale JSON files in `data/`, never hardcoded.

Page objects access translated strings via `this.localeInfo`, which `BasePage` loads automatically based on the active Playwright project:

```typescript
// Good — locale-aware, works in every language
submit = new Button(this.page, this.localeInfo.home.login);

// Bad — hardcoded; breaks when running Spanish or German tests
submit = new Button(this.page, 'Login');
```

Components receive labels as string parameters — the page object passes `this.localeInfo.xxx`. Components themselves are locale-unaware.

**Where to get real translations:** You can get from the test case, never invent a translation or scrape each language by hand. Strings that are *not* in those bundles (e.g. API error messages shown in a toast) come from the server and are the same in every language — store the same text in all four `data/*.json` files.

To add a new language: create `data/xx-XX.json`, import it in `BasePage.ts`, add it to the `locales` map, and add a project in `playwright.config.ts`.

## Credentials — never in code

Credentials are read from environment variables at runtime. They must never appear in `.ts` files.

- **Local**: values live in `e2e/playwright/.env` (git-ignored)
- **CI**: injected as GitHub Actions Secrets

Available env vars: `BASE_URL`, `AUTH_URL`, `COMPANY`, `ADMIN_USER`, `ADMIN_PASSWORD`, `NORMAL_USER`, `NORMAL_PASSWORD`

```typescript
// Good
await loginPage.login({
    Company:  process.env.COMPANY ?? '',
    UserName: process.env.ADMIN_USER ?? '',
    Password: process.env.ADMIN_PASSWORD ?? '',
});
```

## test.step

Every **public component method** wraps its body in `test.step()` — actions *and* readers alike. The HTML report timeline is the manual tester's view of the run; a read that isn't wrapped (get row count, read column values) is invisible there, so the report shows a decision being made on data it never shows being fetched. Include `this.locator.description()` and the relevant value in the step name:

```typescript
async selectOption(value: string) {
    await test.step(`On "${this.locator.description()}" select "${value}"`, async () => {
        await this.locator.selectOption(value);
    });
}
```

`test.step()` returns the callback's value, so readers wrap without extra plumbing:

```typescript
async getRowCount(): Promise<number> {
    return await test.step(`Get the row count of "${this.locator.description()}"`, async () => {
        return await this.rows.count();
    });
}
```

To protect sensitive values (passwords, tokens) in the HTML report, replace the real value with `*****` in the step description — this is the only way to prevent it from appearing in the report:

```typescript
// InputPassword pattern — never include the real value in the description
await test.step(`Fill "${this.locator.description()}" with value: *****`, async () => {
    await this.locator.fill(value);
});
```

## Keep page objects thin

Prefer using component functions in the spec file instead of adding functions on the page that only call the component (`serversPage.save.click()`, not `serversPage.clickSave()`). A page keeps only its component fields, navigation, and methods that bundle several interactions into one intent (`login()`, `fillServerForm()`).

## Assertions live in the spec

Write assertions in the spec, so each test states clearly what it verifies — inline `expect` on a component's locator is the normal form (`expect(serversPage.save.locator).toBeDisabled()`). A general assertion reused across several tests earns a method — put it at the level that owns what it checks:

- **Component level** when it asserts the widget's own structure or state, so every page using the widget reuses it — `grid.assertColumnHeaders(expected)`, `alert.assertText(message)` (see `Alert.ts` for the existing pattern). Expected values arrive as parameters (components stay locale-unaware) and the body wraps in `test.step`.
- **Page level** when it carries page-specific meaning — `assertInvalidCredentials()` knows which message on which screen.

One-off expectations stay inline in the spec; don't wrap every `expect` in a method.

**One concern per method/step.** Don't test two unrelated things in the same method or the same `test.step` — e.g. don't bundle "check the active filter banner" and "check the detailed grid" into one `checkClientFilterAndGrid()`; split into a filter step and a separate grid step, each with its own `test.step`/`expect`. A failure then points at exactly what broke instead of a vague catch-all step name, and each method/step name stays accurate to what it actually checks. This applies inside the spec too: prefer several `test.step()` blocks, one per concern, over one step wrapping several unrelated assertions.

## Test data

Generate test data with `@faker-js/faker` — never hardcode values or build "unique" ones by concatenating `Date.now()`:

```typescript
import { faker } from '@faker-js/faker';

const serverName = faker.company.name();
const serverUrl = faker.internet.url();
const serverKey = String(faker.number.int({ min: 1, max: 999999 }));
```

Deliberately *invalid* values (a wrong password, a malformed URL) are scenario constants, not random data — write those literally. If `@faker-js/faker` is missing from `package.json`, install it once with `npm i -D @faker-js/faker`.

## Test data cleanup

A test that creates data must delete it at the end of the same spec — via the API (`ApiHelper`) or a short UI flow (grid delete + confirm dialog) — declare it with a `PostCondition` annotation.

## Hard rules

- `page.waitForTimeout` is forbidden — use `locator.waitFor()`, `page.waitForResponse()`, or `ApiHelper.waitForResponse`
- No hardcoded values — all values come from parameters or `localeInfo`
- Locate sub-elements relative to `this.locator` (not `page`) so the component stays scoped to its container

## API usage in tests

Use `ApiHelper` from `utils/ApiHelper.ts` for:
- **Preconditions / postconditions** — call the API directly instead of navigating through the UI (faster, more reliable, avoids flaky UI setup)
- **Waiting for dynamic content** — `ApiHelper.waitForResponse(url, statusCode, method)` instead of arbitrary timeouts
- **Mocking** — `ApiHelper.mockApi(description, url, jsonData)` to stub external dependencies
- **Ground-truth data for a grid/list** — `ApiHelper.waitForResponse(url, statusCode, method)`, bundled with the triggering navigation, to capture the real response a page's own network call returns while it loads, instead of hardcoding a value read off the rendered page

API classes go in `e2e/playwright/api/`. See `api/LoginApi.ts` as a reference implementation.

**Never hardcode a value you found in the browser or a DOM snapshot** (a specific company name, a specific key) — it breaks the moment test data changes and proves nothing if the UI silently renders stale or wrong data. Instead, capture the real response the page's own network call returns while it loads.

The **Page Object** owns this, never the spec directly — same division as every other page method: the page exposes a method for its own screen that navigates itself and returns the parsed response. Don't reach for `Promise.all` with a `navigate` callback — start the wait, trigger the action, then await the wait, the same sequential shape `goTo()` already uses for its own readiness check:

```typescript
// ServersPage.ts
public async goTo() {
    await test.step(`Go to the servers page`, async () => {
        const waitForServersPromise = this.serverApi.waitForGetServers();
        await this.page.goto(this.baseURL + '/security/servers');
        await waitForServersPromise;
        await this.title.locator.waitFor({ timeout: 30_000 });
    });
}

async goToServers(): Promise<Server[]> {
    return await test.step('Get servers from API', async () => {
        const responsePromise = this.serverApi.waitForGetServers();
        await this.goTo();
        const response = await responsePromise;
        return await response.json() as Server[];
    });
}
```

```typescript
// spec
const servers = await serversPage.goToServers();
const targetServer = servers[0];

await serversPage.filter.fill(targetServer.Name);
await expect(serversPage.table.locator).toContainText(targetServer.Name);
```

Confirm the endpoint and JSON field casing from the **real** response — don't assume it matches the OpenAPI schema names (backends may serialize PascalCase even when the spec lists lowercase properties, as seen in `LoginApi`'s `LoginResponse`). Only call the API directly with no `trigger`/`Promise.all` (like `LoginApi.login()`) when there's no page navigation to piggyback on — e.g. precondition/postcondition setup before any page loads.

## Test specs (applies to tests/ only)

**Import `test` from fixtures**, not from `@playwright/test`:
```typescript
import { test } from '../fixtures'; // injects locale automatically
```

**Annotations** — use `AnnotationType` (from `utils/AnnotationType.ts`) only in spec annotation arrays:
```typescript
annotation: [
    { type: AnnotationType.Description,   description: 'What this test verifies' },
    { type: AnnotationType.Precondition,  description: 'What must be true before the test' },
    { type: AnnotationType.PostCondition, description: 'State to verify or clean up after' },
]
```
`AnnotationType` must never be used inside page objects or components.

**Tags** — add `tag: ['@FeatureName']` to every test for filtering:
```typescript
test('should do X', { tag: ['@Login'] }, async ({ page, locale }) => { ... });
```

**Pre-authenticated tests** — use `storageState` to skip the login flow:
```typescript
test.use({ storageState: '.auth/normal-user.json' });
```

## Before finishing

Run from `e2e/playwright/`:
```bash
npx tsc --noEmit
```
Fix all TypeScript errors before reporting done.
