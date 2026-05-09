import { Locator, Page } from "@playwright/test";

// Base class for every UI component (Button, InputText, etc.).
// Centralizes two responsibilities:
//   1. Locating the element — preferring ARIA roles (what an element *is*) over CSS selectors
//      (how it looks), so tests stay stable when styles change.
//   2. Reporting — every action is automatically recorded in the HTML report via addStep/addAnnotation.
export class BaseComponent {
    locator: Locator;

    protected isAnnotationEnabled = true;

    /**
     * @param page - Playwright Page instance injected by the test fixture.
     * @param selector - The visible label (e.g. "Login") when `byRole=true`, or a CSS selector (e.g. "#submit-btn") when `byRole=false`.
     * @param role - ARIA role of the element (e.g. `'button'`, `'textbox'`). Only used when `byRole=true`.
     * @param byRole - When `true` (default), locates the element by ARIA role + visible label — preferred for resilience.
     *                 When `false`, `selector` is treated as a CSS selector — use only for elements with no clear ARIA role.
     * @param name - Optional human-readable label for the CSS-selector path, shown in the HTML report instead of the raw selector.
     */
    constructor(
        protected page: Page,
        selector: string,
        role:
            | 'alert'
            | 'alertdialog'
            | 'application'
            | 'article'
            | 'banner'
            | 'blockquote'
            | 'button'
            | 'caption'
            | 'cell'
            | 'checkbox'
            | 'code'
            | 'columnheader'
            | 'combobox'
            | 'complementary'
            | 'contentinfo'
            | 'definition'
            | 'deletion'
            | 'dialog'
            | 'directory'
            | 'document'
            | 'emphasis'
            | 'feed'
            | 'figure'
            | 'form'
            | 'generic'
            | 'grid'
            | 'gridcell'
            | 'group'
            | 'heading'
            | 'img'
            | 'insertion'
            | 'link'
            | 'list'
            | 'listbox'
            | 'listitem'
            | 'log'
            | 'main'
            | 'marquee'
            | 'math'
            | 'meter'
            | 'menu'
            | 'menubar'
            | 'menuitem'
            | 'menuitemcheckbox'
            | 'menuitemradio'
            | 'navigation'
            | 'none'
            | 'note'
            | 'option'
            | 'paragraph'
            | 'presentation'
            | 'progressbar'
            | 'radio'
            | 'radiogroup'
            | 'region'
            | 'row'
            | 'rowgroup'
            | 'rowheader'
            | 'scrollbar'
            | 'search'
            | 'searchbox'
            | 'separator'
            | 'slider'
            | 'spinbutton'
            | 'status'
            | 'strong'
            | 'subscript'
            | 'superscript'
            | 'switch'
            | 'tab'
            | 'table'
            | 'tablist'
            | 'tabpanel'
            | 'term'
            | 'textbox'
            | 'time'
            | 'timer'
            | 'toolbar'
            | 'tooltip'
            | 'tree'
            | 'treegrid'
            | 'treeitem' = 'generic',
        byRole = true,
        name?: string
    ) {
        // byRole=true (default): finds the element by its semantic ARIA role and visible label.
        //   Example: getByRole('button', { name: 'Login' }) finds the button labelled "Login".
        //   This is preferred because it works regardless of CSS class changes and matches how screen readers see the page.
        // byRole=false: falls back to a CSS selector (e.g. '#submit-btn') for elements without a clear ARIA role.
        if (byRole) {
            this.locator = page.getByRole(role, { name: selector }).describe(selector);
        } else {
            this.locator = name
                ? page.locator(selector).describe(name)
                : page.locator(selector);
        }
    }

}