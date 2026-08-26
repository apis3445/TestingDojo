# .NET API test conventions

Applies to `api-restassured` and `api-restsharp`. Read this once per session before writing or editing any file under `APINet/`.

## The two implementations mirror each other

`APINet/RestAssured/Tests/` and `APINet/RestSharp/Tests/` cover the **same** scenarios with the **same** method names — they exist side by side so a reader can compare how the two libraries approach the same task. When a scenario is generated for both, keep the class name, method name, and `[Arguments]` identical between them; only the HTTP-call syntax differs (RestAssured's `Given()/When()/Then()` DSL vs. RestSharp's `ApiClient`).

## Method naming

`{Verb}{Resource}_With{Condition}_Returns{Result}`, e.g. `CreateServer_WithValidInfo_Returns201`, `GetServerByKey_WithInvalidKey_Returns404`, `Login_WithMissingRequiredField_Returns400`. The class is `{Resource}Tests` (`LoginTests`, `DashboardTests`, `ServerTests`), extending `TestBase`.

## Auth

`TestBase` (`APINet/RestAssured/TestBase.cs`, `APINet/RestSharp/TestBase.cs`) logs in as the admin user once per test session and exposes `AuthToken`, `Configuration`, `AuthUrl`, `BaseUrl` as `protected static`. Use `AuthToken` directly for the common case. For a **different** role/user (a 403 test, a language variant), log in again inline with `Configuration["USER_COMPANY"]` / `USER_USERNAME` / `USER_PASSWORD` (see `ServerTests.GetServers_WithNormalUser_Returns403`) — never hardcode credentials.

## Test data

Never hardcode values for data a test **creates**. Add a `RandomX()` factory to `APINet/Data/<Resource>TestData.cs` (see `ServerTestData.RandomServer()`) and call it from the test. Deliberately **invalid** values (a duplicate key, a 151-char name) stay literal — they're the point of the test, not real data.

## Cleanup

Any test that creates a resource deletes it in a `finally` block, even on assertion failure (see `CreateServer_WithValidInfo_Returns201`, `UpdateServer_WithValidInfo_Returns204`, `UpdateServer_WithMismatchedId_Returns400`).

## Error assertions

For 400s, deserialize to `APINet/Models/ValidationProblemDetails.cs` and assert the **exact** message string per field (see `CreateServer_WithInvalidInfo_Returns400`) — not just the status code.

## Models

If the endpoint's request/response schema isn't represented yet, add a plain DTO under `APINet/Models/` (see `Server.cs` for the shape: public auto-properties, no attributes). Get field names/types from `read-api-doc`'s output, cross-checked against the real response — don't assume the OpenAPI schema's casing is what the server actually sends.

## Verification

Never run the full suite. After writing or editing a test:

```bash
dotnet build
dotnet run --project APINet/APINet.csproj -- --filter "<TestMethodName>"
```

Fix compile errors before reporting done. Report the single-test result honestly.
