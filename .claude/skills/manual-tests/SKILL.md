---
name: manual-tests
description: Create and update manual Test Cases in Azure DevOps from a user story — API, E2E/UI, and performance types and wire them into a Test Plan/Suite. Use to write, generate, revise, or refresh manual test cases, e.g. "create test cases for story 123", "turn this Playwright spec into ADO test cases", "update test case 456 steps", "create test cases from this Figma design".
allowed-tools: >-
  Read,
  mcp__azure-devops__core_list_projects,
  mcp__azure-devops__wit_get_work_item,
  mcp__azure-devops__wit_update_work_item,
  mcp__azure-devops__testplan_list_test_plans,
  mcp__azure-devops__testplan_create_test_plan,
  mcp__azure-devops__testplan_list_test_suites,
  mcp__azure-devops__testplan_create_test_suite,
  mcp__azure-devops__testplan_create_test_case,
  mcp__azure-devops__testplan_add_test_cases_to_suite,
  mcp__azure-devops__testplan_update_test_case_steps,
  mcp__claude-in-chrome__tabs_context_mcp,
  mcp__claude-in-chrome__tabs_create_mcp,
  mcp__claude-in-chrome__navigate,
  mcp__claude-in-chrome__computer,
  mcp__claude-in-chrome__read_page
---

Act as a manual tester: turn a user story (or an automated test / feature description) into well-structured **manual** Test Case work items in Azure DevOps, and keep existing ones current when the story changes. Test cases come in three flavours — API, E2E/UI, and Performance — each with its own step template (see `references/`).

## Mode: create vs. update

Decide up front which you're doing:

- **Create** — author new test cases and wire them into a Test Plan/Suite. Follow Steps 1–5.
- **Update** — revise the steps of an existing test case (e.g. the story's acceptance criteria changed, or a step is wrong). Resolve the project and find the test case per Step 1, then jump to the **Updating an existing test case** section near the end.

A single request can mix both (a story gained a new criterion → add one case, and an existing case needs a tweak). Handle each test case in its appropriate mode.

This skill **writes to live Azure DevOps**. Creating or overwriting a work item is hard to undo, so always present the drafted/changed test case(s) for approval before calling any `create`, `add`, or `update` tool. Never write silently.

## Step 1: Verify the MCP is available and Test Plan Id

Before anything else, confirm the Azure DevOps MCP is connected (e.g. attempt a small read like `mcp__azure-devops__testplan_list_test_plans`). If it is not available, stop and show:

```
Azure DevOps MCP is not set up. Configure it in .mcp.json (set your org) and set
AZURE_DEVOPS_TOKEN in your shell, then restart Claude Code and try again.
```

**Determine the target project** — never hardcode it: use the project the user named; otherwise propose the `.mcp.json` default (`--project` arg) and confirm before writing; if neither is clear, list projects with `mcp__azure-devops__core_list_projects` and ask.

`testplan_*` and `wit_*` tools require an explicit `project` arg on every call, so resolve it once up front and reuse it. If a single request spans projects (e.g. a story in one project, test cases destined for another), confirm each.

**Determine the destination Plan/Suite** — ask the user whether cases go into an **existing** Plan/Suite or a **new** one, if they haven't said:

- **Existing** — `mcp__azure-devops__testplan_list_test_plans` (project) to find the named plan; `mcp__azure-devops__testplan_list_test_suites` (project, planId) to find the named suite, or use the root suite (`parentSuite` empty/itself) if they don't want a sub-suite.
- **New** — create the plan with `mcp__azure-devops__testplan_create_test_plan` (project, name, iteration — default to the project root iteration unless they name a sprint), then the suite with `mcp__azure-devops__testplan_create_test_suite` (project, planId, `parentSuiteId` = root suite id, name). Confirm both names before creating.

Capture `planId` and `suiteId` — needed later when the cases are created and added to the suite.

**Find the test case (update mode)** — if the user gave a test case ID, use it directly; if they gave a story ID and asked to refresh its cases, fetch the story with `mcp__azure-devops__wit_get_work_item` (`expand: "all"`) and follow its `Microsoft.VSTS.Common.TestedBy` links to the linked test cases.

## Step 2: Determine the test type

Each test case is **API**, **E2E** (UI), or **Performance** — infer from cues (endpoint/HTTP verb → API; screen/user journey → E2E; load/latency → Performance), ask if ambiguous. Stories often span more than one type (e.g. an endpoint-backed feature gets both API and E2E cases) — draft all types the story covers and let the user drop unwanted ones at approval, rather than silently covering only one.

Read the matching template before drafting — it defines the step structure and what each expected result must assert:

- API → `references/api.md`
- E2E → `references/e2e.md`
- Performance → `references/performance.md`

## Step 3: Identify the story, spec file, or description

Identify what the test case is derived from. The user picked one of these inputs:

**From an ADO work item (user story / bug):**
- Fetch it with `mcp__azure-devops__wit_get_work_item` (`expand: "all"`).
- Extract the title, description, and acceptance criteria. If the story includes a Figma link, open it with Claude-in-Chrome and inspect via screenshots before drafting — quote real field labels, button text, and error messages verbatim instead of paraphrasing. Skip only if inspection isn't possible and draft from the story alone, flagging those results as an assumption.
- For API cases, check the story's linked child Task work items (`relations`, type Task) — endpoint paths, verbs, request/response bodies, and status codes typically live there, not in the story itself. Fetch each with `wit_get_work_item` and use them as the source of truth instead of inventing endpoints.
- Scope test cases as **user journeys**, not one case per criterion: group the criteria into a handful of coherent flows — e.g. one case for the grid (view, sort, filter, pagination, export), one for create, one for edit, one for delete — and let each criterion become a `- ` assertion line inside the step that exercises it. A story should typically yield about 3–6 cases per layer (UI / API), not 20; only split a journey when it needs different preconditions or data.
- Remember the work item ID — it becomes the `testsWorkItemId` link (TestedBy) when creating the case.

**From an existing automated test in the repo:**
- Read the actual spec file — never reconstruct it from memory. Playwright specs live in `e2e/playwright/tests/`; .NET tests in `APINet/`.
- Each `test(...)` / `[Test]` becomes one manual test case. Translate the automated steps (page-object calls, request calls, assertions) into human-readable manual actions and expected results. An `expect(...)`/assertion maps to a step's expected result.

**From a free-text description:**
- Work only from what the user stated plus obvious, low-risk preconditions (e.g. "user is logged in"). Do not invent endpoints, field names, or thresholds. If a critical detail is missing (endpoint URL, a performance threshold, expected error text), ask rather than guess.

**Before drafting**, batch any open doubts (exact message text, unspecified behavior, undefined edge cases) into one question — answers become High confidence; if the user defers, draft with Med/Low confidence and a `Why` note.

## Step 4: Draft and present the steps

Applies whether drafting brand-new cases or revising an existing one's steps. Write each test case as an ordered list of `action → expected result` pairs, following the chosen template. Two formats matter here — don't conflate them: this **preview format** (`N. Action → Expected Result`, used throughout drafting and presenting) is for the user to review; the pipe-delimited **tool input format** (`N. Action|Expected Result`) only applies when actually calling the ADO tools in Step 5. Rules that keep the cases usable:

- **Every step is a concrete, executable action** a manual tester can perform without guessing. "Verify it works" is not a step.
- **Expected result is observable** — a status code, a visible message (use the real `localeInfo` text when known), a row count, a latency threshold.
- **No assertion-only steps.** "Observe the grid", "Inspect the response body", "Verify X" are not steps — a step exists only when the tester performs a real action. Fold each observation into the expected result of the action step that produces it; when one action yields several observations, write the expected result as `- ` prefixed lines, one line per assertion.
- **One journey = the positive scenario.** Keep the case on the happy path; negative scenarios are their own test case (one parameterized case when only the data varies), never extra detours inside the journey.
- **Cleanup postcondition when the case creates data** — the last step(s) undo what the test created (e.g. delete the new row) with an expected result confirming it's gone.
- Title: a clear, specific behavior statement, e.g. `Login with invalid password shows error message` — not `Login test`.

Preview each test case with its full content — title, every step's action and expected result, and any parameters — so the user reviews the real artifact before anything is written to ADO. Use a **compact line format**, not a markdown table: tables cost many more tokens for no extra information, and this matches the `read-testcase` output style (`action → expected`). For every case show:

- The **title**, with the destination **Plan/Suite**, **priority**, **linked work item**, and a **confidence** tag on the same header line.
- One line per step: `N. Action → Expected Result` (1-based). When the expected result holds several assertions, show them as indented `- ` lines under the step line — exactly what will land in ADO. A step with no distinct assertion still gets a light expected result — never blank.
- A compact **Params** block only when the case is data-driven (see below).
- A one-line **Why** note whenever confidence is below High, naming the assumption or missing detail behind it.

**Confidence tag** — `High` / `Med` / `Low`, reflecting how directly the case derives from the source material:

- **High** — every step and expected result comes straight from explicit acceptance criteria, a spec assertion, the design, or a fact the user stated (including their answers to the doubts batch). No guessing.
- **Med** — a reasonable, low-risk inference filled a gap (e.g. an obvious "user is logged in" precondition, or expected text taken from app convention rather than the story).
- **Low** — the case rests on real assumptions or missing detail (an unstated endpoint, field name, error message, or threshold).

Med and Low tags should be rare by this point: the doubts behind them belong in the earlier question batch. Reaching this point with Med/Low cases is legitimate only when the user was asked and deferred ("just draft it"), couldn't answer, or the gap surfaced during drafting — and then the `Why` note must make the assumption explicit so they can correct it.

Use this exact layout:

```
[UI] Login with invalid password shows error   [<project> · plan "<plan>"/suite "<suite>" · P2 · TestedBy #482 · Confidence: Med]
  1. Navigate to the login page → Login form with Company, User and Password is displayed
  2. Enter @company, @user and @password → Credentials are entered in the form
  3. Click the Login button →
       - Error message "Error: Invalid user" is shown
       - The user stays on the login page
  Params  @company | @user | @password
          Acme | valid_user | wrong_pass
  Why Med  Error text "Error: Invalid user" taken from app convention; the story doesn't specify the exact message

[API] POST /api/login with invalid password returns 401   [<project> · plan "<plan>"/suite "<suite>" · P2 · TestedBy #482 · Confidence: High]
  1. Obtain the base URL and a valid existing username → Prerequisites ready
  2. Send POST /api/login with the valid username and a wrong password →
       - Status code is 401 Unauthorized
       - Body contains error code "INVALID_CREDENTIALS" and no token field

Create these now?
```

**Parameters / data-driven cases:** when the same steps repeat with only the data changing (e.g. invalid username, invalid password, invalid company), write **one** test case using `@name` tokens for the varying values plus a small table of value sets — not near-duplicate cases. Follow the user's preference if they'd rather have separate cases.

**Translations:** when a story includes localized text (an attached translations file, or acceptance criteria naming multiple languages), don't draft a separate case per language — parameterize the one journey with an `@language`-driven token for the translated labels/messages, and a value row per language.

**Tool limitation:** `testplan_create_test_case` only creates the parameter **columns** from `@name` tokens — it cannot fill in the **value rows**. Always tell the user the rows still need to be entered by hand in the ADO web UI (or hand them the values to enter); never imply they're filled in automatically.

Only proceed once the user confirms. If they request changes, revise and re-present — do not create a "draft" version in ADO and edit it.

## Updating an existing test case

Use this when the user wants to change an existing case rather than make a new one — a step is wrong, the acceptance criteria moved, or coverage needs tightening.

Find the test case(s) as described in Step 1, then:

1. **Read the current steps.** `mcp__azure-devops__wit_get_work_item` (id, `expand: "all"`) → parse `Microsoft.VSTS.TCM.Steps`. The steps XML uses `<step type="ValidateStep">` (has an expected result) or `type="ActionStep">` (action only); each `<parameterizedString>` holds action then expected result, wrapped in `<P>` tags you must strip. (This is the same format `read-testcase` parses.)
2. **Determine the new step list**, applying the same drafting rules and template as create. Re-ground against the current story / spec — don't edit blind.
3. **Present a before → after diff** and wait for approval. `testplan_update_test_case_steps` **replaces the entire step list**, so always show the full new set, not just the delta, to make accidental drops obvious:

```
Update test case #456 "Login with invalid password":
  - step 3 expected result: "Invalid credentials" → "Error: Invalid user"
  + new step 4: Verify the user stays on the login page | URL remains /login
Full new step list:
  1. ...|...
Apply this update?
```

4. **Apply** with `mcp__azure-devops__testplan_update_test_case_steps` (id, the full formatted `steps` string). When any expected result needs a bullet list, skip that tool (single-line text only) and write the steps XML directly via `wit_update_work_item`, following the same bulleted format used when creating. Title/priority/other fields are not changed by either steps tool — if those need editing, use `wit_update_work_item` on the specific fields and call it out.
5. **Report** the updated ID and what changed.

Because the update overwrites all steps, never call it with a partial list you derived from memory — always start from the freshly read current steps in step 1.

## Checklist

Run through this silently before presenting the draft/diff for approval, and once more before any write call — it's a final gate, not documentation.

- [ ] Mode (create vs. update) chosen; for updates, current steps read fresh before drafting changes
- [ ] Test type chosen and the matching `references/*.md` template followed
- [ ] Steps derived from real source (story fields / actual spec file / stated facts) — zero invented endpoints, fields, or thresholds
- [ ] Figma link in the story spotted and the design opened and inspected before drafting (E2E create mode); design-quoted text marked High confidence
- [ ] Open doubts (unspecified texts, behaviors, edge cases) batched and asked before drafting; assumptions only after the user deferred or couldn't answer
- [ ] No extra `|` inside any action/expected-result text — `|` is the tool-input delimiter (Step 5), not part of the preview's `→` format
- [ ] No assertion-only "Observe/Inspect/Verify" steps; multi-assertion expected results written as bullets (steps XML via `wit_update_work_item`)
- [ ] Journeys are positive-scenario only, negative scenarios split into their own (parameterized) cases; cleanup postcondition present when the case creates data
- [ ] Destination plan + suite resolved (plan/suite created on request when none exists) — create mode
- [ ] Draft (create) or before→after diff (update) presented and user approved before any write

## Step 5: Create, wire up, and report

Once approved, create each test case in Azure DevOps with `mcp__azure-devops__testplan_create_test_case` (`project`, `title`, `steps`, `testsWorkItemId` to link it to the source story/bug — follow the tool's own format instructions for `steps`), capture the returned ID, then add it to the suite with `mcp__azure-devops__testplan_add_test_cases_to_suite` (`project`, `planId`, `suiteId`, `testCaseIds`).

For bulleted expected results (the tool only accepts one line per step), create the case with the plain string first, then read it back with `wit_get_work_item` to see the generated `Microsoft.VSTS.TCM.Steps` XML. Edit **only** that step's expected-result `parameterizedString` — keep every id, the `type` (`ValidateStep` has an expected result, `ActionStep` doesn't), and the surrounding tags exactly as read — then write it back with `wit_update_work_item` (op `replace`). The HTML inside each `parameterizedString` must be XML-escaped, one `&lt;P&gt;- …&lt;/P&gt;` per assertion — never paste raw, unescaped `<P>` tags, or the field becomes malformed. Verified working shape for one step:

```xml
<steps id="0" last="1"><step id="1" type="ValidateStep"><parameterizedString isformatted="true">&lt;P&gt;Click the Login button&lt;/P&gt;</parameterizedString><parameterizedString isformatted="true">&lt;P&gt;- An "Invalid credentials" error is shown&lt;/P&gt;&lt;P&gt;- The user stays on /login&lt;/P&gt;</parameterizedString><description/></step></steps>
```

If a call fails, stop and report what was already created rather than retrying — on a free ADO tier, suite-add can fail with "not authorized" (Test Plans is a paid add-on) even though the test case itself was created fine.

Report each case's ID, title, suite, and the ADO URL (`https://dev.azure.com/<org>/<project>/_workitems/edit/<id>`).
