---
name: playwright-component
description: Create or update a reusable Playwright component class that wraps a UI widget (date picker, grid, autocomplete, rich text editor, etc.). Use when the user asks to create a component for a specific element or control, or to update or add a method to an existing component.
allowed-tools: Read, Write, Edit, Bash(npx tsc*), Skill, mcp__plugin_playwright_playwright__browser_navigate, mcp__plugin_playwright_playwright__browser_click
---

Read `e2e/playwright/components/ComboBox.ts` for the reference implementation — skip if already read in this session.
Read `.claude/skills/_shared/conventions.md` for locator rules, `test.step` format, and all hard rules — skip if already read in this session.

## Extract from the user's request

Before doing anything, identify:

- **Component name** — the widget type (e.g. "DatePicker", "Grid"). Use PascalCase for the class name.
- **Page path** — where the widget lives (e.g. `/servers`). Ask if not mentioned.
- **CSS selector hint** — optional, if the user already knows it.

## Step 1: Create or update?

**Updating an existing component** (user says "update X" or "add method to X"):

- Read the existing file in `e2e/playwright/components/`
- Understand the current implementation before making any changes
- Skip Step 2 unless the new method interacts with elements not already in the component

**Creating a new component**:

- Read `e2e/playwright/components/` first — confirm no existing component covers this widget

## Step 2: Inspect the DOM

**First snapshot — static page state:**

Build the full URL from `BASE_URL` in `e2e/playwright/.env` plus the page path — never invent a host:

```
/page-snapshot <BASE_URL><page-path>
```

Locate the widget's container in `e2e/playwright/.snapshots/<slug>.html` — grep + targeted read only, per the snapshot rules in `conventions.md`.

**Second snapshot — interactive state (only if needed):**

After identifying the component, check if its meaningful DOM only appears after interaction:

| Component type             | Interaction needed before second snapshot         |
| -------------------------- | ------------------------------------------------- |
| Date picker / calendar     | Click the input to open the calendar panel        |
| Autocomplete / combobox    | Type a valid value to trigger the suggestion list |
| Dropdown / select          | Click to open the options list                    |
| Static input, button, grid | No second snapshot needed                         |

For autocomplete/combobox, `/page-snapshot <URL> <valid-value>` types the value before capturing — use that instead of manual browser steps. For click-to-open widgets (date picker, dropdown), use MCP `browser_navigate` (auth already loaded from first snapshot), perform the click, then `/page-snapshot` again with the same URL. Use both HTML files when planning methods — the first for the closed/idle state selectors, the second for the open/expanded state.

Use only what you observe — no guessing.

## Step 3: Plan the component methods

**Scope: a composite widget is one component.** Look at the widget's container in the snapshot before deciding what "the component" is. A grid that renders with its own toolbar (search, export buttons) and paginator (page-size select, page buttons, range label) is *one* widget the user thinks of as "the grid" — model it as one class scoped to the outermost container (e.g. `.grid-container`), with the sub-widgets exposed as methods/locators inside it (`filter(text)`, `selectPageSize(size)`, `emptyMessage`). Do **not** leave the sub-widgets for the page object to assemble from standalone components (a `ComboBox` field for the page-size select, or `Button` fields for its export buttons) — that scatters one widget across several page fields, and every page that uses the grid has to re-assemble it. A standalone component (`ComboBox`, `InputText`) is for widgets that appear *independently* on pages, not for parts of a larger widget.

This includes actions that bundle a trigger with a wait, not just plain clicks — a grid's own "Excel"/"PDF" toolbar buttons are `Grid` methods, not page methods with page-level `Button` fields. Components stay locale-unaware, so the label is a parameter the page passes in from `localeInfo`, same as `clickRowLink(name)`:

```typescript
// Grid.ts
async export(label: string): Promise<Download> {
    return await test.step(`Export "${this.locator.description()}" via "${label}"`, async () => {
        const [download] = await Promise.all([
            this.page.waitForEvent('download'),
            this.locator.getByRole('button', { name: label }).click(),
        ]);
        return download;
    });
}
```

```typescript
// ServersPage.ts — the page only exposes the grid field, no separate excel/pdf Button fields
await serversPage.grid.export(serversPage.localeInfo.general.excel);
```

**Wrap every public method in `test.step()` — readers included.** Methods that only read (`getRowCount`, `getColumnValues`, `getSelectedDate`) wrap the same as actions; see the test.step section in `conventions.md` for the return-value pattern and the why. Only plain locator getters are exempt.

Name methods by user intent, not DOM mechanics:

| Good                       | Avoid                              |
| -------------------------- | ---------------------------------- |
| `selectDate(date: string)` | `clickCalendarCell(index: number)` |
| `getSelectedValue()`       | `readSpanText()`                   |
| `isDisabled()`             | `checkAttributeDisabled()`         |

Present the planned class name and method signatures to the user and wait for approval before writing any code. Example:

```
I'll create DatePicker with these methods:
- selectDate(value: string)
- getSelectedDate(): Promise<string>
- isDisabled(): Promise<boolean>

Does this look right, or do you want to add/change anything?
```

## Step 4: Implement

- Extend `BaseComponent`. The constructor must call `super(page, selector, '<aria-role>', byRole, name)` — `selector` is the visible label when `byRole = true`, a CSS selector when `byRole = false`. Match the ARIA role observed in the snapshot to `BaseComponent`'s role union.
- Follow all rules from `conventions.md`
- When the same widget appears multiple times on a page, scope the locator to an unambiguous parent container so interactions never land on the wrong instance

## Step 5: Verify

Save to `e2e/playwright/components/<ComponentName>.ts`, then run `npx tsc --noEmit` from `e2e/playwright/`.

## Checklist

- [ ] Every selector traced to a line in a snapshot file — zero guessed selectors
- [ ] Second snapshot taken if the widget has an open/expanded state
- [ ] Composite widget (toolbar/paginator/sub-controls in one container) modelled as ONE component, not split across page fields
- [ ] Every public method — actions and readers — wrapped in `test.step()`; only plain locator getters exempt
- [ ] Plan approved by user before writing code
- [ ] `npx tsc --noEmit` passes
