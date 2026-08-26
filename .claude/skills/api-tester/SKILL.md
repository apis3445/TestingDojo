---
name: api-tester
description: Turn an Azure DevOps API test case, or an API endpoint from the OpenAPI/Scalar docs, into automated tests for the client(s) you choose. Use when asked to automate an API test case or generate API tests from documentation, e.g. "automate API test case 789" or "create API tests for the Server endpoints from the docs".
allowed-tools: Read, Skill, mcp__azure-devops__wit_get_work_item
---

Entry point for API test automation. This skill resolves the source and confirms scope once, then dispatches to the client-specific skill(s) that actually write code: `api-restassured`, `api-restsharp`, `api-postman`. It never writes test code itself.

**Scope:** API cases/endpoints only. For E2E/UI cases, use `playwright-automation` instead.

## Step 1: Determine the source

- **An ADO test case ID** → read it with `read-testcase`. If its type/tags mark it E2E/UI rather than API, stop and point to `playwright-automation`.
- **An endpoint** (path, method, tag, or resource name) named directly, or "from the docs"/"from Swagger"/"from Scalar" → look it up with `read-api-doc`.
- **A free-text description** → work only from what's stated plus obvious low-risk preconditions; never invent an endpoint, field, or status code — ask if something critical is missing.

If the request names a resource but not a source ("write API tests for Server"), ask whether it should come from an ADO test case or the docs.

## Step 2: Determine target client(s)

Ask which of **RestAssured**, **RestSharp**, **Postman** (multiple allowed) if not already stated. There is no default: these are three independently-invocable skills on purpose, so a single generation run only touches the client(s) actually requested — don't assume "all three" just because all three exist in the repo.

## Step 3: Present one combined plan

Before dispatching, show every scenario to generate (method + path, condition, expected result) and the chosen target client(s) in one place — cheaper to correct here than after two or three implementations exist:

```
Source: ADO #789 "DELETE /api/Server/{id} with a valid id returns 200"
Targets: RestAssured, RestSharp

Scenario: DeleteServer_WithValidId_Returns200
  Send DELETE /api/Server/{id} for a server created via ServerTestData.RandomServer()
  Assert: 200

Proceed?
```

Wait for approval.

## Step 4: Dispatch

For each approved client, invoke its skill with the resolved scenario(s) so it doesn't need to re-fetch the source:

- `api-restassured` → writes to `APINet/RestAssured/Tests/`
- `api-restsharp` → writes to `APINet/RestSharp/Tests/`
- `api-postman` → writes to `postman/TestingDojo.postman_collection.json`

Each still runs its own naming/assertion planning and a second, client-specific approval (exact method signature, exact Postman request shape) before writing and verifying — that detail isn't decided at this level. When RestAssured and RestSharp are both targets for the same scenario, tell both skills to use the identical class/method name so the two implementations stay comparable, as every existing pair (`LoginTests`, `DashboardTests`, `ServerTests`) already does.

## Step 5: Report

Summarize what was created per target — files/classes touched and the single-test verify result for the .NET clients, the request name + folder for Postman — and remind the user that the Postman addition still needs a manual run (real credentials aren't available locally) to confirm it passes.
