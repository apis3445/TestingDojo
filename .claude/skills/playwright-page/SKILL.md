---
name: playwright-page
description: Create or update a Playwright Page Object Model (POM) class. Use when the user asks to create a page object, create a POM for a screen, update an existing page, or add fields/methods to a page. Also use when wiring a new component into its page.
---

Read `.claude/skills/_shared/conventions.md` for locator rules, `test.step` format, locale handling, and all hard rules — skip if already read in this session.

## Extract from the user's request

Before doing anything, identify:

- **Page name** — the screen being modelled (e.g. "Dashboard", "Invoice List"). Use PascalCase → `DashboardPage.ts`.
- **Page path** — the URL path for this screen (e.g. `/accounts-receivable/dashboard`). Ask if not mentioned.
- **Create or update?** — is there an existing file in `e2e/playwright/pages/` for this screen?

## Step 1: Read existing files

Always do these reads before writing anything (each: skip if already read in this session):

1. Read `e2e/playwright/pages/<PageName>.ts` if it already exists.
2. Read `e2e/playwright/components/` directory listing — know what component classes are currently available.
3. Read `e2e/playwright/pages/BasePage.ts` — understand what the base class already provides (navigation helpers, `localeInfo`, `menu`, etc.) so you don't duplicate it.

Constructor signatures vary between components (e.g. `Alert` takes an options object, `Canvas` takes `(page, selector, name)`). Before instantiating any component, read its file for the exact constructor and method signatures — never assume they all match `Button`.

## Step 2: Snapshot the page DOM

Build the full URL from `BASE_URL` in `e2e/playwright/.env` plus the page path — never invent a host, never guess selectors:

```
/page-snapshot <BASE_URL><page-path>
```

Work from `e2e/playwright/.snapshots/<slug>.html` — grep + targeted read only, per the snapshot rules in `conventions.md`.

Scan for every interactive or meaningful element:
- Form inputs → `InputText`, `InputPassword`, `ComboBox`
- Buttons → `Button`
- Links → `Link`
- Headings / titles → `Heading`
- Alert / toast messages → `Alert`
- Data grids / tables → `Grid`
- Charts / canvas elements → `Canvas`

If the page has elements that only appear after interaction (e.g. a dropdown opens, a dialog appears), take a second snapshot after performing that interaction via the MCP browser tools. Use both HTMLs when planning.

## Step 3: Identify locale keys

For every text-based element you find, check `e2e/playwright/data/en-US.json` to see if a matching key already exists under the relevant section (e.g. `localeInfo.home.login`).

**If a key is missing:** do NOT add it to the JSON files. Instead, list every missing key in a clearly formatted block and ask the user to add them before you continue:

```
Missing locale keys — please add these to all four data/*.json files before I continue:

  "invoiceList": {
    "title": "Invoice List",          ← add translation in each language file
    "searchButton": "Search"          ← add translation in each language file
  }
```

Only proceed once the user confirms the keys are in place (or says to use placeholder strings temporarily).

## Step 4: Plan the page fields and methods

Map each element to the right component class and `localeInfo` key. A composite widget (a grid with its own toolbar/paginator, for example) is **one page field** of one component class — don't model its inner controls (page-size select, search box, export buttons) as separate page-level `ComboBox`/`InputText`/`Button` fields; those belong inside the composite component (see the playwright-component skill). Then plan the public methods the page needs — keep the page thin: only navigation and methods that bundle **several interactions** into one intent. Prefer using component functions in the spec file (`page.save.click()`) instead of adding functions on the page that only call the component. Assertions live in the spec (inline `expect` on component locators); a general assertion reused across several tests becomes a page method when it carries page-specific meaning (`assertInvalidCredentials()`), or a component method when it checks the widget's own structure/state (`grid.assertColumnHeaders(...)`, `alert.assertText(...)`) — see the assertions section in `conventions.md`.

**Field naming convention:** use camelCase noun that reflects what the element *is*, not where it is in the DOM.

**Method naming convention:** name by user intent.

| Good                              | Avoid                          |
| --------------------------------- | ------------------------------ |
| `search(query: string)`           | `clickSearchButton()`          |
| `fillServerForm(server)`          | `clickSave()` (single forward) |
| `selectStatus(value: string)`     | `setDropdownValue(value)`      |

Present the full plan to the user and wait for approval:

```
I'll create InvoiceListPage with:

Fields:
  title: Heading         → localeInfo.invoiceList.title
  searchInput: InputText → localeInfo.invoiceList.searchInput
  searchButton: Button   → localeInfo.invoiceList.searchButton
  resultsGrid: Grid      → CSS selector '#invoice-grid'

Methods:
  search(query: string)          (bundles fill + click)
  (title visibility / grid rows → asserted in the spec with expect on component locators)

Does this look right?
```

If the user's request is an **update** (adding fields or methods to an existing page), still present the delta — only the new fields/methods — and wait for approval.

## Step 5: Implement

Follow these rules when writing the class:

- Extend `BasePage`.
- Declare component fields. Prefer inline initializers (`field = new Button(...)`) when the constructor doesn't need to do anything special; use `constructor` assignment only when initialization logic is needed (e.g. `DashboardPage` pattern with complex selectors).
- Pass locale strings via `this.localeInfo.section.key`, never hardcoded UI text.
- When a component needs a CSS selector (no clear ARIA role), pass `byRole = false` and a descriptive `name` string.
- Wrap every public method body in `test.step()`.
- Sub-elements inside a method should be relative to a scoped locator where possible.
- Import only the component classes that are actually used.

**Minimal template:**

```typescript
import { Page, test, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Button } from '../components/Button';
// … other imports

export class ExamplePage extends BasePage {
    searchButton: Button = new Button(this.page, this.localeInfo.example.search);

    constructor(page: Page, locale?: string) {
        super(page, 'Example', locale);
    }

    public async goTo() {
        await this.navigateTo('/example-path');
    }

    async search(query: string) {
        await test.step(`Search for "${query}"`, async () => {
            // …
        });
    }
}
```

## Step 6: Verify

Save to `e2e/playwright/pages/<PageName>.ts`, then run:

```bash
cd e2e/playwright && npx tsc --noEmit
```

Fix all TypeScript errors before reporting done.

## Checklist

- [ ] Every selector/label traced to a snapshot line or an existing `localeInfo` key — zero guesses
- [ ] Component constructors verified by reading their files, not assumed
- [ ] Missing locale keys flagged and user confirmed before proceeding
- [ ] Plan approved by user before writing code
- [ ] `npx tsc --noEmit` passes
