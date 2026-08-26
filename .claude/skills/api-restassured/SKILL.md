---
name: api-restassured
description: Automate an API test case into a TUnit + RestAssured.Net test under APINet/RestAssured/Tests/. Use when asked to automate, implement, or generate a RestAssured API test, e.g. "add a RestAssured test for test case 456" or "add a RestAssured test for DELETE /api/Server/{id}".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Skill, mcp__azure-devops__wit_get_work_item
---

Turn one API scenario into a TUnit + RestAssured.Net test method in `APINet/RestAssured/Tests/`. Invocable directly, or by `api-tester` with an already-resolved scenario.

Read `.claude/skills/_shared/dotnet-api-conventions.md` once for the full rules (skip if already read this session).

## Step 1: Resolve the scenario

- Given an ADO test case ID → read it with `read-testcase` (API-tagged cases only; if it's E2E/UI, point the user to `playwright-automation` instead).
- Given an endpoint/path/method/resource → look it up with `read-api-doc`.
- Given an already-resolved scenario (from `api-tester`) → use it as-is, don't re-fetch.
- Given free text only → work from what's stated; ask rather than invent an endpoint, field, or status code.

## Step 2: Check what already exists

`Glob`/`Grep` `APINet/RestAssured/Tests/*.cs` for a class matching the resource (`{Resource}Tests.cs`) and any method already covering this endpoint + condition, so you extend an existing class/test rather than duplicate one.

## Step 3: Plan and present

For each scenario, decide: method name (`{Verb}{Resource}_With{Condition}_Returns{Result}`), the concrete assertions (status code, then specific field/error values — never "response is correct"), whether a new `Models/` DTO or `Data/<Resource>TestData.cs` factory is needed, and whether cleanup applies. Present compactly:

```
RestAssured: ServerTests.cs (exists)
  + DeleteServer_WithValidId_Returns200
      Send DELETE /api/Server/{id} for a server created via ServerTestData.RandomServer()
      Assert: 200
  New: none

Proceed?
```

Wait for approval before writing.

## Step 4: Write

Add the method to the existing `{Resource}Tests.cs`, or create it (extending `TestBase`, `using static RestAssured.Dsl;`, namespace `APINet.RestAssured`) mirroring `LoginTests.cs` / `DashboardTests.cs` / `ServerTests.cs` — `Given()...When()...Then()...DeserializeTo<T>()`, `AuthToken`/`BaseUrl`/`AuthUrl` from `TestBase`. Add any new Model/data-factory file the plan called for.

## Step 5: Verify

```bash
dotnet build
dotnet run --project APINet/APINet.csproj -- --filter "<MethodName>"
```

Never run the full suite. Fix compile errors first; report the single-test result honestly.
