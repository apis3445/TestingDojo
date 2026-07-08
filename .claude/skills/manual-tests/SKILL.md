---
name: manual-tests
description: Create and update manual Test Cases in Azure DevOps from a user story — API, E2E/UI, and performance types — and wire them into a Test Plan/Suite. Use to write, generate, revise, or refresh manual test cases, e.g. "create test cases for story 123", "turn this Playwright spec into ADO test cases", "update test case 456 steps", "create test cases from this Figma design".
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

- **Create** — author new test cases and wire them into a Test Plan/Suite. Follow Steps 1–7.
- **Update** — revise the steps of an existing test case (e.g. the story's acceptance criteria changed, or a step is wrong). Jump to the **Updating an existing test case** section near the end.

A single request can mix both (a story gained a new criterion → add one case, and an existing case needs a tweak). Handle each test case in its appropriate mode.

This skill **writes to live Azure DevOps**. Creating or overwriting a work item is hard to undo, so always present the drafted/changed test case(s) for approval before calling any `create`, `add`, or `update` tool. Never write silently.

## Step 0: Verify the MCP is available

Before anything else, confirm the Azure DevOps MCP is connected (e.g. attempt a small read like `mcp__azure-devops__testplan_list_test_plans`). If it is not available, stop and show:

```
Azure DevOps MCP is not set up. Configure it in .mcp.json (set your org) and set
AZURE_DEVOPS_TOKEN in your shell, then restart Claude Code and try again.
```

**Determine the target project** — never hardcode it:

1. If the user named a project, use it.
2. Otherwise, propose the MCP default from `.mcp.json` (the `--project` arg) and confirm it's the right one before writing.
3. If neither is clear, list the available projects with `mcp__azure-devops__core_list_projects` and ask which one.

`testplan_*` and `wit_*` tools require an explicit `project` arg on every call, so resolve it once up front and reuse it. If a single request spans projects (e.g. a story in one project, test cases destined for another), confirm each.

## Step 1: Determine the test type

Pick exactly one per test case: **API**, **E2E** (UI / end-to-end), or **Performance**. Infer from the request when obvious (an endpoint/HTTP verb → API; a screen/user journey → E2E; load/throughput/latency → Performance). If genuinely ambiguous, ask.

One story can — and often should — yield cases of more than one type. A story whose feature sits on an endpoint deserves API cases (the response contract: status codes, body, error payloads) *alongside* the E2E cases (what the user sees). When the story clearly covers both layers, draft both and let the user drop what they don't want at the approval step, rather than silently covering only the UI.

Then read the matching template — it defines the step structure and what each step's expected result must assert:

- API → `references/api.md`
- E2E → `references/e2e.md`
- Performance → `references/performance.md`

## Step 2: Gather the source material

Identify what the test case is derived from. The user picked one of these inputs:

**From an ADO work item (user story / bug):**
- Fetch it with `mcp__azure-devops__wit_get_work_item` (`expand: "all"`).
- Extract the title, description, and acceptance criteria. Scope test cases as **user journeys**, not one case per criterion: group the criteria into a handful of coherent flows — e.g. one case for the grid (view, sort, filter, pagination, export), one for create, one for edit, one for delete — and let each criterion become a `- ` assertion line inside the step that exercises it. A story should typically yield about 3–6 cases per layer (UI / API), not 20; only split a journey when it needs different preconditions or data.
- **A journey covers the positive scenario only** — the happy path from start to outcome. Negative scenarios (validation errors, rejected duplicates, unauthorized access) go in **separate test cases**, parameterized when only the data varies.
- **A journey that creates data ends with a cleanup postcondition** — e.g. delete the new row and confirm it's gone — so the environment is left as it was found.
- Remember the work item ID — it becomes the `testsWorkItemId` link (TestedBy) in Step 5.

**From an existing automated test in the repo:**
- Read the actual spec file — never reconstruct it from memory. Playwright specs live in `e2e/playwright/tests/`; .NET tests in `APINet/`.
- Each `test(...)` / `[Test]` becomes one manual test case. Translate the automated steps (page-object calls, request calls, assertions) into human-readable manual actions and expected results. An `expect(...)`/assertion maps to a step's expected result.

**From a free-text description:**
- Work only from what the user stated plus obvious, low-risk preconditions (e.g. "user is logged in"). Do not invent endpoints, field names, or thresholds. If a critical detail is missing (endpoint URL, a performance threshold, expected error text), ask rather than guess.

### Figma design check (E2E cases)

User stories often carry a Figma link, either in the description HTML or as a hyperlink in the work item's `relations`. Check for one every time you draft E2E/UI cases from a story. When you find one (or the user pastes one), **open it in the user's Chrome via Claude-in-Chrome and inspect it before drafting — by default, without asking first**. The link is in the story precisely because the design is the source of truth for what a manual tester will see — real field labels, button captions, headings, error/empty states — so expected results should quote the actual UI, not paraphrase it. Offering the check and waiting for a yes only costs a round-trip; the link is in the story to be used.

Skip the inspection only when it genuinely can't happen: the browser tools are unavailable, the Chrome extension lacks site permission for figma.com, Figma shows a login/permission wall you can't get past, or the user told you not to open it. In that fallback, draft from the story alone — mention which expected results would have benefited, and rate them Med confidence.

To inspect:

1. Load the browser tools in **one** ToolSearch call: `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page`.
2. Call `tabs_context_mcp` first, then open the Figma URL in a **new** tab — don't reuse the user's tabs.
3. Figma renders on a canvas, so reading the page DOM returns almost nothing — work from screenshots (`computer`). Zoom/pan to the frame(s) the story covers; a link with a `node-id` usually lands on the right frame already.
4. Extract verbatim what the tester will observe: field labels, button text, headings, validation/error messages, placeholder text, empty states. Quote these exactly in the actions and expected results.

Expected-result text taken from the design counts as **High** confidence in Step 5 — it comes from a real artifact, not app convention. Keep the boundary clear, though: the story's acceptance criteria still decide **which** test cases exist. A design detail the story never mentions can justify an extra assertion step inside an existing case (e.g. a visible success toast), but do not invent whole scenarios from the mock — if the design implies a flow the story doesn't cover, flag the gap to the user instead.

### Ask the open doubts before drafting

Once all sources are gathered (story, specs, design), you'll usually still have gaps: an exact message text neither the story nor the design shows, an unspecified behavior (redirect vs. error page for unauthorized access?), an edge case nobody defined (what does exporting an empty list produce?). **Collect these doubts and ask the user in one batched message before drafting** — the user is a tester who knows the app; one question round-trip is cheaper than presenting a draft full of Med/Low assumptions they then have to correct one by one, and their answers turn those steps into High confidence.

Keep the batch honest and small:

- Ask only what genuinely blocks an accurate expected result — not things any source already answers, and not trivia (an obvious "user is logged in" precondition needs no question).
- Phrase each doubt so a short answer resolves it: "What exact text shows when the filter matches nothing?", "Unauthorized access to the screen: redirect to login, or an error page?".
- If the user answers, quote the answers verbatim as High confidence. If they say "just draft it" or can't answer, fall back to the assumption path: draft with Med/Low tags and explicit `Why` notes as before.

## Step 3: Resolve the destination Test Plan and Suite

Test cases must land in a Suite inside a Plan, so figure out where before drafting.

1. `mcp__azure-devops__testplan_list_test_plans` (project) → find the plan the user named, or list active plans and ask which one if unclear.
2. **If no plan exists** (the list is empty) or the user wants a new one, create it with `mcp__azure-devops__testplan_create_test_plan` — required args are `project`, `name`, and `iteration`. The `iteration` is an iteration path; default it to the project root iteration (the project name itself) unless the user names a sprint/iteration. Confirm the plan name with the user before creating. A freshly created plan comes with a root suite — list suites to get its ID.
3. `mcp__azure-devops__testplan_list_test_suites` (project, planId) → find the target suite. The suite whose `parentSuite` is empty / equal to itself is the **root suite**; note its ID. Test cases can be added directly to the root suite if the user doesn't want a sub-suite.
4. If the user wants a new sub-suite, create it with `mcp__azure-devops__testplan_create_test_suite` (project, planId, `parentSuiteId` = root suite id unless they nominate another parent, name). Do this only after they confirm the name.

Capture `planId` and `suiteId` for Step 6.

## Step 4: Draft the steps

Write each test case as an ordered list of `action | expected result` pairs, following the chosen template. Rules that keep the cases usable:

- **Every step is a concrete, executable action** a manual tester can perform without guessing. "Verify it works" is not a step.
- **Expected result is observable** — a status code, a visible message (use the real `localeInfo` text when known), a row count, a latency threshold.
- **No assertion-only steps.** "Observe the grid", "Inspect the response body", "Verify X" are not steps — a step exists only when the tester performs a real action. Fold each observation into the expected result of the action step that produces it; when one action yields several observations, write the expected result as `- ` prefixed lines, one line per assertion.
- **One journey = the positive scenario.** Keep the case on the happy path; negative scenarios are their own test case (one parameterized case when only the data varies), never extra detours inside the journey.
- **Cleanup postcondition when the case creates data** — the last step(s) undo what the test created (e.g. delete the new row) with an expected result confirming it's gone.
- Title: a clear, specific behavior statement, e.g. `Login with invalid password shows error message` — not `Login test`.

The MCP `steps` string must be formatted exactly like this (newline-separated, 1-based, `|` between action and expected result):

```
1. Navigate to the login page|Login form is displayed
2. Enter a valid username and an invalid password|
3. Click the Login button|An "Invalid credentials" error message is shown and the user stays on the login page
```

**Bulleted expected results:** the plain `steps` string is single-line text per step — it cannot express multiple lines. When a step's expected result carries several assertions, create the case with the plain string first (separate the assertions with "; "), then immediately rewrite `/fields/Microsoft.VSTS.TCM.Steps` with `mcp__azure-devops__wit_update_work_item` (op `replace`) so each assertion sits on its own line prefixed with `- `. Do **not** use `<UL>/<LI>` HTML lists — the user maintains these by hand in the ADO editor, where plain `- ` lines are easier to edit. The field value is the steps XML; the HTML inside each `parameterizedString` must be XML-escaped, one `&lt;P&gt;- …&lt;/P&gt;` per assertion. Verified working shape:

```xml
<steps id="0" last="1"><step id="1" type="ValidateStep"><parameterizedString isformatted="true">&lt;P&gt;Click the Login button&lt;/P&gt;</parameterizedString><parameterizedString isformatted="true">&lt;P&gt;- An "Invalid credentials" error is shown&lt;/P&gt;&lt;P&gt;- The user stays on /login&lt;/P&gt;</parameterizedString><description/></step></steps>
```

Use `type="ValidateStep"` for steps with an expected result and `ActionStep` otherwise; step `id`s are 1-based and `last` is the highest id.

## Step 5: Present the draft and get approval

Preview each test case with its full ADO content — title, every step's action and expected result, and any parameters — so the user reviews the real artifact. Use a **compact line format**, not a markdown table: tables cost many more tokens for no extra information, and this matches the `read-testcase` output style (`action → expected`). For every case show:

- The **title**, with the destination **Plan/Suite**, **priority**, **linked work item**, and a **confidence** tag on the same header line.
- One line per step: `N. Action → Expected Result` (1-based). When the expected result holds several assertions, show them as indented `- ` lines under the step line — exactly what will land in ADO. A step with no distinct assertion still gets a light expected result — never blank (see Step 4).
- A compact **Params** block only when the case is data-driven (see below).
- A one-line **Why** note whenever confidence is below High, naming the assumption or missing detail behind it.

**Confidence tag** — `High` / `Med` / `Low`, reflecting how directly the case derives from the source material (Step 2):

- **High** — every step and expected result comes straight from explicit acceptance criteria, a spec assertion, the design, or a fact the user stated (including their answers to the doubts batch in Step 2). No guessing.
- **Med** — a reasonable, low-risk inference filled a gap (e.g. an obvious "user is logged in" precondition, or expected text taken from app convention rather than the story).
- **Low** — the case rests on real assumptions or missing detail (an unstated endpoint, field name, error message, or threshold).

Med and Low tags should be rare by this point: the doubts behind them belong in the Step 2 question batch. Reaching Step 5 with Med/Low cases is legitimate only when the user was asked and deferred ("just draft it"), couldn't answer, or the gap surfaced during drafting — and then the `Why` note must make the assumption explicit so they can correct it.

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

**Parameters / data-driven cases:** Sometimes the same steps run several times with only the data changing — for example the spec loops over invalid username, invalid password, and invalid company. When that happens:

- Write **one** test case, not three near-identical ones.
- In the action/expected text, use `@name` tokens for the values that change (e.g. `@user`, `@password`, `@company`).
- Add a small table giving the values for each token, one row per data set.

One parameterized case is the standard ADO shape and far less to maintain. If the user would rather have separate cases, follow their preference.

**Tool limitation — always say this when you propose a parameterized case:** `testplan_create_test_case` only accepts the `steps` string. The `@name` tokens make ADO create the parameter **columns** (the headers), but the tool **cannot** fill in the **value rows** (the actual data). So after the case is created, the values do not exist yet:

- The user must type them into the ADO web UI themselves, **or**
- They give you the values and you create the case, but you tell them clearly that the rows still must be entered by hand.

Never imply the data rows are filled in automatically.

Only proceed once the user confirms. If they request changes, revise and re-present — do not create a "draft" version in ADO and edit it.

## Step 6: Create and wire up

For each approved test case:

1. `mcp__azure-devops__testplan_create_test_case` with:
   - `project`, `title`, `steps` (the formatted string from Step 4).
   - `testsWorkItemId` — the source story/bug ID when the input was a work item, so ADO records the TestedBy link.
   - `priority` — default 2 unless the user specified one.
   - `areaPath` / `iterationPath` — only if the user named them; otherwise omit and let ADO default.
   - Capture the returned new test case ID.
2. `mcp__azure-devops__testplan_add_test_cases_to_suite` with `project`, `planId`, `suiteId`, and the new `testCaseIds` (pass all IDs from this batch in one call when possible).

Failure handling — these are independent steps, so a later failure does not undo an earlier one:
- If a `create` call fails, stop and report which test cases were already created (with IDs) so nothing is silently half-done — do not blindly retry.
- If `add_test_cases_to_suite` — or any `testplan_create_test_plan` / `testplan_create_test_suite` call — returns **"not authorized to access this API"**, the test cases were still created as work items. All Test Plans *write* operations (plans, suites, suite membership) need the paid **Basic + Test Plans** access level; the free Basic level only allows creating/editing work items and *reading* plans, so on a free account these calls always fail. Report the created IDs, skip further suite operations in the session, and tell the user their options: add the cases to the plan manually in the ADO web UI (if their UI has the license), have an admin grant Test Plans access (30-day trial exists), or organize the cases with tags/queries instead of suites. Do not treat the cases as failed and do not retry.

## Step 7: Report

Summarize concisely: for each created case, its ID, title, and the suite it was added to. Include the work-item link when one was set. Surface the ADO URL pattern `https://dev.azure.com/<org>/<project>/_workitems/edit/<id>` so the user can open them.

## Updating an existing test case

Use this when the user wants to change an existing case rather than make a new one — a step is wrong, the acceptance criteria moved, or coverage needs tightening.

1. **Find the test case(s).** If the user gave a test case ID, use it. If they gave a *story* ID and asked to refresh its cases, fetch the story with `mcp__azure-devops__wit_get_work_item` (`expand: "all"`) and follow its `Microsoft.VSTS.Common.TestedBy` links to the linked test cases.
2. **Read the current steps.** `mcp__azure-devops__wit_get_work_item` (id, `expand: "all"`) → parse `Microsoft.VSTS.TCM.Steps`. The steps XML uses `<step type="ValidateStep">` (has an expected result) or `type="ActionStep">` (action only); each `<parameterizedString>` holds action then expected result, wrapped in `<P>` tags you must strip. (This is the same format `read-testcase` parses.)
3. **Determine the new step list**, applying the same drafting rules and template as create (Step 4). Re-ground against the current story / spec — don't edit blind.
4. **Present a before → after diff** and wait for approval. `testplan_update_test_case_steps` **replaces the entire step list**, so always show the full new set, not just the delta, to make accidental drops obvious:

```
Update test case #456 "Login with invalid password":
  - step 3 expected result: "Invalid credentials" → "Error: Invalid user"
  + new step 4: Verify the user stays on the login page | URL remains /login
Full new step list:
  1. ...|...
Apply this update?
```

5. **Apply** with `mcp__azure-devops__testplan_update_test_case_steps` (id, the full formatted `steps` string). When any expected result needs a bullet list, skip that tool (single-line text only) and write the steps XML directly via `wit_update_work_item` as described in Step 4. Title/priority/other fields are not changed by either steps tool — if those need editing, use `wit_update_work_item` on the specific fields and call it out.
6. **Report** the updated ID and what changed.

Because the update overwrites all steps, never call it with a partial list you derived from memory — always start from the freshly read current steps in step 2.

## Checklist

- [ ] Mode (create vs. update) chosen; for updates, current steps read fresh before drafting changes
- [ ] Test type chosen and the matching `references/*.md` template followed
- [ ] Steps derived from real source (story fields / actual spec file / stated facts) — zero invented endpoints, fields, or thresholds
- [ ] Figma link in the story spotted and the design opened and inspected before drafting (E2E create mode); design-quoted text marked High confidence
- [ ] Open doubts (unspecified texts, behaviors, edge cases) batched and asked before drafting; assumptions only after the user deferred or couldn't answer
- [ ] No `|` inside any action or expected-result text
- [ ] No assertion-only "Observe/Inspect/Verify" steps; multi-assertion expected results written as bullets (steps XML via `wit_update_work_item`)
- [ ] Journeys are positive-scenario only, negative scenarios split into their own (parameterized) cases; cleanup postcondition present when the case creates data
- [ ] Destination plan + suite resolved (plan/suite created on request when none exists) — create mode
- [ ] Draft (create) or before→after diff (update) presented and user approved before any write
- [ ] Created/updated IDs reported; new cases added to the suite; work-item link set when applicable
