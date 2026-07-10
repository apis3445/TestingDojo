---
name: playwright-automation
description: Automate an Azure DevOps E2E/UI test case into a Playwright spec. Use when asked to automate, implement, or generate a Playwright test e.g. "automate test case 1234".
allowed-tools: Read, Write, Edit, Bash, Skill, mcp__azure-devops__wit_get_work_item
---

Turn a **manual** Azure DevOps E2E/UI test case into an **automated** Playwright spec. Follow the steps to create the test. Use the `playwright-component` when a component is needed like a grid, or date picker. Use `playwright-page` when the page doesn't exists or needs a new method. The test case must have an ID and be in the manual test format (action + expected result steps). If the case isn't in ADO, ask for the ID and read it with `read-testcase`. 

**Scope:** E2E/UI cases only. Never guess selectors or locale strings — those come from the sub-skills' DOM snapshots, never from here.

## Conventions that shape every choice

Read `.claude/skills/_shared/conventions.md` once for the full rules (skip if already read this session).

- **Localization (i18n) — never hardcode visible text.** The app runs in English, Spanish, German, and Japanese. Locate elements by role + accessible name (`getByRole`, then `getByText` / `getByLabel`), and feed every label from `this.localeInfo.<section>.<key>` (the `data/*.json` files), the way `LoginPage` does — e.g. `new InputText(this.page, this.localeInfo.home.user)`, never `"User"`. If a step needs a locale key that doesn't exist yet, the sub-skills will flag it; surface that and wait, don't invent or inline the string.
- **Components before the page object.** Reuse an existing component when one fits the widget; only create a new component when none does; then build or extend the page object (POM) on top of those components. The spec talks to component methods and page methods — never to raw locators (`page.getByRole(...)`) or hardcoded text.

## Step 1: Read the test case

Need a test case ID; if the user described a case without one, ask for the test case Id. Read it with the `read-testcase` skill (returns title, ordered `action → expected` steps, parameters, preconditions). If the ADO MCP isn't connected, stop and tell the user to configure `.mcp.json` + `AZURE_DEVOPS_TOKEN`. Capture the **ID and title**.

## Step 2: Map each step — and check what already exists

First read what's already there, so "reuse if it exists" isn't a guess: the `e2e/playwright/components/` and `e2e/playwright/pages/` listings, the file of any page you'll reuse (for its existing methods), and `data/en-US.json` for existing locale keys.

Then walk the steps — **no code yet** — and for each decide the following, tagging every piece **exists** or **new**:

1. **Which page** — a "navigate to X" marks a page boundary; group actions on the same screen. (existing page / new page → `playwright-page`)
2. **Which component** — does a component already cover this widget (`InputText`, `Grid`)? Reuse it. If none fits, plan a new one. (existing / new component → `playwright-component`)
3. **Which translation** — is there a `localeInfo` key for the label in `e2e/playwright/data/en-US.json`? If not, note it as a missing key — it must be added to **all four** files (`data/en-US.json`, `es-MX.json`, `de-DE.json`, `ja-JP.json`) before the spec can use it. Never hardcode the text.
4. **How to express the action** — for a **single interaction**, call the component field directly in the spec (`loginPage.submit.click()`, `loginPage.user.fill(value)`); don't add a single-element wrapper like `clickSubmit()` (the component already reports its own `test.step`). Add a page method only when it **bundles several interactions** into one intent (`login()`, `search()`), named by intent — never `clickX()`. (existing / new method → `playwright-page` update mode)
5. **What the expected result asserts** — a non-empty expected result becomes an assertion written **in the spec**, as inline `expect` on the component's locator (`expect(serversPage.save.locator).toBeDisabled()`), so the test states clearly what it verifies. A general assertion reused across several tests becomes a page method when it carries page-specific meaning (`assertInvalidCredentials()`), or a component method when it checks the widget's own structure/state (`grid.assertColumnHeaders(...)`, `alert.assertText(...)`) — see the assertions section in `conventions.md`.

Everything tagged **new** (component, page, method, locale key) is the to-create list you present in Step 3 and build in Steps 4–6 (components → pages → spec).

**Parameterized cases:** if the ADO case has `@token` parameters with multiple data rows, plan **one** data-driven spec — a `scenarios` array + `for` loop, like the invalid-login block in `tests/login.spec.ts`. Not N copies.

**Don't store any sensitive information like password into code** — `@user`/`@password`/`@company` map to `process.env.*` (`COMPANY`, `ADMIN_USER`, `ADMIN_PASSWORD`, `NORMAL_USER`, `NORMAL_PASSWORD`), even if ADO shows real values.

## Step 3: Save the plan, present it, and get approval

Save the plan to `e2e/playwright/.plans/tc-<id>.md` (create the folder if missing) — one file per test case, overwritten on revision so the file always holds the agreed mapping. Start the file with the case ID, title, target spec path, and tag, then the step mapping and to-create list exactly as presented below.

Show the same mapping compactly in the conversation before creating anything — cheaper to correct than generated code:

```
Automate #1234 "Login with invalid password shows error"   spec: tests/login.spec.ts · tag @Login

  1. Navigate to login page          → loginPage.goTo()                     exists
  2. Enter creds + click Login       → loginPage.login({...})               exists
  3. (expected) error "Invalid user" → loginPage.assertInvalidCredentials() exists

To create first: (none)
Parameterized: yes — [invalid user, invalid password, invalid company]

Proceed?
```

List anything missing under "To create first" (e.g. `Grid (new component)`, `search() on InvoiceListPage (new method)`). Wait for approval; revise, re-save `tc-<id>.md`, and re-present if they adjust the mapping.

## Step 4: Build the new components

Build components first — pages and the spec depend on them. For each component the mapping tagged **new**, invoke `playwright-component` with the widget type and page path; it snapshots the DOM, plans methods, gets its own approval, and type-checks. Only build what's new — reuse always beats creating. Skip this step if no component is new.

When a static DOM snapshot isn't enough to pin down a locator or confirm a step's flow (a dynamic widget, a multi-screen path, an unclear control), `playwright-cli` can drive and inspect the running app — e.g. codegen to capture real locators/steps. Discovery aid only: the selector still lands in the component/page file via the sub-skills, never inlined into the spec.

## Step 5: Build or extend the page objects

With the components in place, for each page tagged **new** (or needing a new bundling method), invoke `playwright-page` with the page name, path, and needed methods (update mode for a new method on an existing page). Let it run its full flow (snapshot, approval, type-check). If it flags missing locale keys, surface that and wait — don't hardcode text. Skip this step if no page changes are needed.

## Step 6: Write the spec

Once everything it depends on exists, write one spec at `e2e/playwright/tests/<feature>.spec.ts` (add to an existing feature spec rather than a parallel file). Mirror `tests/login.spec.ts`:

- Import `test` from `../fixtures` (not `@playwright/test`); instantiate pages as `new PageName(page, locale)`.
- Annotations via `AnnotationType` in the annotation array only: `Description` = a sentence describing what the test verifies (the behavior, from the case title/intent — e.g. `'Login with valid credentials should navigate to the dashboard'`, like `login.spec.ts`), `Precondition` = required starting state, `PostCondition` only if there's cleanup.
- Keep traceability to the source case in a brief comment above the test (e.g. `// ADO test case #1234`), never inside the `Description`.
- `tag: ['@Feature']` on every test.
- Assertions written in the spec — inline `expect` on component locators; use a page assertion method only when it's general and reused across tests.
- Parameterized → `scenarios` + `for` loop.
- No screencast/overlay unless asked — keep specs lean.
- **Test data:** generate created-entity values with `@faker-js/faker` (`faker.company.name()`, `faker.internet.url()`, `faker.number.int({ min, max })`) — no hardcoded names/URLs and no `Date.now()` suffixes. Deliberately invalid values stay literal. Install faker once (`npm i -D @faker-js/faker`) if missing.
- **Cleanup:** if the test creates data, delete it at the end of the spec (API preferred, short UI flow otherwise), assert it's gone, and declare it with a `PostCondition` annotation.

**Example.** ADO test case #1234 "Login with invalid password shows error":

```
1. Navigate to the login page | Login form is displayed
2. Enter valid company and user, an invalid password, click Login |
3. (expected) Error "Invalid user" is shown, user stays on login |
```

Produces:

```typescript
import { test } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { AnnotationType } from '../utils/AnnotationType';

// ADO test case #1234
test.describe('Invalid login', () => {
  test('invalid password shows error', {
    tag: ['@Login'],
    annotation: [
      { type: AnnotationType.Description,  description: 'Login with an invalid password should show an error and keep the user on the login page' },
      { type: AnnotationType.Precondition, description: 'The login page must be accessible' },
    ],
  }, async ({ page, locale }) => {
    const loginPage = new LoginPage(page, locale);
    await loginPage.login({
      Company:  process.env.COMPANY ?? '',
      UserName: process.env.ADMIN_USER ?? '',
      Password: 'wrong_password',
    });
    await loginPage.assertInvalidCredentials();
  });
});
```

Note how the three action steps collapse into one `login()` call, the expected result becomes the `assertInvalidCredentials()` page assertion, credentials come from `process.env`, and the case id lives in a comment — not the `Description`.

## Step 7: Verify

From `e2e/playwright/`, type-check then run only this spec on chromium:

```bash
npx tsc --noEmit
npx playwright test tests/<feature>.spec.ts --project=chromium --reporter=line | tail -30
```

Fix all TS errors first. Report the run honestly; if it fails, show the trimmed failure and whether it's a spec issue, a wrong page method, or genuine app behavior. Don't loop on browser automation to debug — surface the cause for the user (the test runner) to confirm.

## Checklist

- [ ] Case read from ADO (not reconstructed); ID + title captured; E2E/UI scope confirmed
- [ ] Each step mapped against what exists — page, component, locale key, method tagged exists/new — before any code
- [ ] Existing components/pages reused where present; plan saved to `e2e/playwright/.plans/tc-<id>.md` and approved before creating or writing
- [ ] Missing pieces built via the sub-skills (selectors/locale from their snapshots)
- [ ] Spec imports `test` from `../fixtures`, uses `AnnotationType`, tagged, credentials from env
- [ ] Parameterized cases written as one looped test; `tsc --noEmit` passes; single chromium run reported
