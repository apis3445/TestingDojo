Get the HTML snapshot of a page and save it to a file for component creation.

Arguments: `<URL> [valid-value]`
- First argument: the URL to inspect
- Second argument (optional): a valid value to type into an autocomplete field before capturing the HTML

Parse `$ARGUMENTS` to extract the URL (first token) and optional valid value (second token).

## Before doing anything

Read and follow `.claude/commands/check-auth.md`. If it reports missing or expired auth, stop — do not continue with the snapshot.

## Capture the snapshot

Derive a filename slug from the URL path (e.g. `/security/servers` → `security-servers`). The output file is `e2e/playwright/.snapshots/<slug>.html`.

Use MCP Playwright tools only — no shell commands needed:

1. The browser is already at the base URL from the auth check. Use `browser_evaluate` to inject all localStorage entries from the auth file:
   ```js
   localStorage.setItem('token', '<value>');
   localStorage.setItem('__rm_sid__', '<value>');
   localStorage.setItem('__rm_sid_ts__', '<value>');
   ```

2. `browser_navigate` to the full target URL.

3. `browser_wait_for` with selector `app-root [role="main"], main, [ng-version]` — waits for Angular to bootstrap and render the page content before capturing. If the selector is not found within the timeout, proceed anyway.

4. `browser_evaluate` with `document.documentElement.outerHTML` — the result is returned directly as a string.

5. Use the Write tool to save the HTML to `e2e/playwright/.snapshots/<slug>.html`.

## After saving

Tell the user: "HTML snapshot saved to `e2e/playwright/.snapshots/<slug>.html`."

If the snapshot contains a login form or sign-in heading, stop and tell the user: "The page requires authentication. Please run global setup first with: `cd e2e/playwright && npx playwright test tests/login.spec.ts --project=English` — then retry the snapshot."
