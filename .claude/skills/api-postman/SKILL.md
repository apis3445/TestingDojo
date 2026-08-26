---
name: api-postman
description: Add or update a request + tests in the Postman collection (postman/TestingDojo.postman_collection.json) for an API endpoint. Use when asked to automate, add, or generate a Postman test, e.g. "add a Postman test for test case 456" or "add a Postman request for GET /api/Server/{key}".
allowed-tools: Read, Write, Edit, Bash, Grep, Skill, mcp__azure-devops__wit_get_work_item
---

Turn one API scenario into a request + test script inside `postman/TestingDojo.postman_collection.json`. Invocable directly, or by `api-tester` with an already-resolved scenario.

## Step 1: Resolve the scenario

- Given an ADO test case ID → read it with `read-testcase` (API-tagged cases only; if it's E2E/UI, point the user to `playwright-automation` instead).
- Given an endpoint/path/method/resource → look it up with `read-api-doc`.
- Given an already-resolved scenario (from `api-tester`) → use it as-is, don't re-fetch.
- Given free text only → work from what's stated; ask rather than invent an endpoint, field, or status code.

## Step 2: Read the collection structure — never overwrite the whole file

`postman/TestingDojo.postman_collection.json` is ~3300 lines. A one-request addition is a small, scoped `Edit`, never a full `Write` rewrite. `Grep` it first to find the target folder's `item` array and a neighboring request to copy the shape from.

Folders today: `Login` (`Admin`/`User`/`400 Bad Request` subfolders), `Menu`, `Servers`, `Dashboard`, `401 Unauthorized`, `403 Forbidden`. Match the new request to an existing folder by resource; create a new status-code folder (e.g. `404 Not Found`) only if the scenario is an error case that doesn't fit one already there.

## Step 3: Plan the request

- **Method + URL**: `{{AuthAPI}}` is the only base-URL variable defined today (points at the auth demo). If the scenario targets the business API (`Api:BaseUrl` in `APINet/appsettings.json`, a different host), check whether a second collection/environment variable for it already exists before inventing one — ask if it doesn't and the collection needs it.
- **Auth**: `bearer` with `{{AccessTokenAdmin}}` for admin-scoped calls; a normal-user token variable for non-admin scenarios (mirror how `Servers_WithNormalUser_Returns403`-style cases are set up).
- **Headers**: `Accept-Language: {{language}}` on business endpoints (see `Servers_WithValidServerInfo_CreatesAServer`).
- **Body**: raw JSON, referencing `pm.collectionVariables` set in a `prerequest` script for anything randomly generated.
- **Prerequest script**: only needed when the scenario creates data — generate values with `pm.variables.replaceIn('{{$randomProductName}}')` / `{{$randomUrl}}` / `Math.random()`-based ints, store via `pm.collectionVariables.set(...)` (mirror `Servers_WithValidServerInfo_CreatesAServer`'s prerequest block).
- **Test script**: assert with the collection's own `utils.*` helpers — `utils.StatusOk()`, `utils.StatusCreated()`, `utils.StatusNoContent()`, `utils.Status400/401/403/404()`, `utils.CheckRequired(field)`, `utils.CheckErrorMessage(field, message)`, `utils.ArrayAbove0(name)`, `utils.CheckLength(n)` — never write a raw `pm.response.to.have.status(...)` when a `utils` helper already covers it. Chain any `pm.collectionVariables.set(...)` a later request needs (e.g. `serverId` after create).

Present the planned request compactly (name, folder, method+URL, auth, headers, body, prerequest values, test assertions) and wait for approval before editing.

## Step 4: Write

`Edit` the collection JSON to splice in the new request object (or update an existing one) inside its folder's `item` array, matching the existing key order and formatting (`event` → `request` → `response: []`). Add any new `variable` entries the scripts reference to the collection's top-level `variable` array (empty-string placeholders, matching the existing style). If the scenario needs a new per-environment value (a credential, a fixed config value — not something computed at runtime), add it to `postman/TestingDojoDemo.postman_environment.json` too.

## Step 5: Verify

```bash
python3 -m json.tool postman/TestingDojo.postman_collection.json > /dev/null
```

This only confirms the JSON is well-formed — it does not run the request. Actually executing it needs real credentials that aren't available locally (the environment file's secret values are blank placeholders); tell the user to run the new request in the Postman app, or via `newman run postman/TestingDojo.postman_collection.json -e postman/TestingDojoDemo.postman_environment.json --env-var ...` with real values, to confirm it passes. Never claim it passes without that.
