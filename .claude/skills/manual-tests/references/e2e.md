# E2E / UI test case template

A manual E2E test case walks a tester through a user journey in the browser and asserts what they should see at each meaningful point. Mirror the real user intent, not the DOM mechanics.

A journey is the **positive scenario** end to end — negative scenarios (validation errors, rejected duplicates, denied access) are written as **separate test cases**, parameterized when only the data changes.

## Step structure

1. **Precondition** — starting state: which URL, logged in or out, any required data. e.g. `Navigate to the login page (BASE_URL/login)|Login form with username and password fields is displayed`.
2. **User actions** — one interaction per step, phrased as the user would describe it: "Enter…", "Click…", "Select…". Intermediate actions may have an empty expected result; give one whenever the UI visibly responds.
3. **Assertions** — what the user observes: a heading, a toast/alert message, a redirected URL, a grid with rows. Never write these as standalone "Observe…" steps — attach each observation to the action step that produces it, as bullets in that step's expected result (one bullet per assertion). Use the real on-screen text when you know it (from the story's Figma design, or `localeInfo` / `e2e/playwright/data/*.json`) rather than paraphrasing.
4. **Cleanup / postcondition** — **required whenever the journey creates data**: delete what was created (e.g. remove the new row) and assert it's gone. Otherwise only if needed (e.g. log out).

## What the expected results must be

- Visible, human-checkable outcomes: "An error alert reads 'Invalid credentials'", "The dashboard heading 'Welcome' is visible", "URL changes to /dashboard".
- Avoid implementation detail (CSS selectors, network calls) — this is a manual script a person follows.

## Examples

Positive journey with cleanup — Title: `Add a new server and it appears active in the grid`

```
1. On the Servers page click "Add New" → The new-server form opens
2. Enter a unique Key, a Name and a valid URL →
3. Click Save →
     - The form closes
     - The new server appears in the grid with Active = Yes
4. Delete the created server from the grid and confirm → The server is no longer listed
```

Negative scenario as its own case — Title: `Login with invalid password shows error and keeps user on login page`

```
1. Navigate to the login page → Login form is displayed
2. Enter a valid username →
3. Enter an incorrect password →
4. Click the Login button →
     - An error alert "Invalid credentials" is shown
     - The URL remains on /login
```

Step 4's bulleted expected result is produced by the steps-XML rewrite described in SKILL.md Step 4 — the plain `steps` create-string cannot hold bullets.

When deriving from a Playwright spec in `e2e/playwright/tests/`, read the spec and its page objects: each page-object action method (`login`, `search`) becomes an action step, and each `expect(...)` becomes an expected result. Prefer the page object's `localeInfo` strings for the expected text.
