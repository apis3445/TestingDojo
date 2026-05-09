# APINet — .NET API Tests

This project contains REST API tests written in **.NET 10** using **TUnit** as the test framework. The same tests are implemented twice using two different HTTP libraries so you can compare both approaches side by side.

## What is being tested?

The tests target the [Testing Dojo demo app](https://abi-testing-dojo-demo.azurewebsites.net/) — a sample REST API with authentication and protected endpoints.

## Libraries used

### TUnit
The test framework that discovers and runs the tests. Similar to NUnit or xUnit but with modern async support and a rich assertion API.

### RestSharp
A popular .NET HTTP client library. In this project it is wrapped in a custom `ApiClient` class that handles authentication, request building, and response mapping for you.

### RestAssured.Net
A port of the Java library REST Assured. It uses a **Given / When / Then** style that reads almost like plain English, making tests easy to follow even for beginners.

```csharp
// RestAssured.Net example — reads like a sentence
Given()
    .ContentType("application/json")
    .Body(loginRequest)
.When()
    .Post($"{AuthUrl}/api/Users/login")
.Then()
    .StatusCode(200);
```

---

## Key concepts

### TestBase
Both `RestSharp/TestBase.cs` and `RestAssured/TestBase.cs` are **base classes** that all test classes inherit from.

Before any test runs, `TestBase` does two things:
1. Loads configuration (URLs, timeouts) from `appsettings.json` and environment variables
2. Logs in once and stores the JWT access token in `AuthToken`

This means the login request is made only **once per test session**, not before every single test. Future test classes that need authentication just extend `TestBase` and use `AuthToken` directly.

```
TestBase
  └── LoginTests
  └── (your future test classes)
```

### Parameterized tests
The login test runs **twice** — once for the admin user and once for the regular user — using TUnit's `[Arguments]` attribute:

```csharp
[Arguments("USER_ADMIN_COMPANY", "USER_ADMIN_USERNAME", "USER_ADMIN_PASSWORD")]
[Arguments("USER_COMPANY", "USER_USERNAME", "USER_PASSWORD")]
public async Task Login_WithValidCredentials_ReturnsToken(
    string companyKey, string userNameKey, string passwordKey)
```

The attribute values are the **names** of the configuration keys (not the actual credentials). The real values are read from configuration inside the test body at runtime.

---

## Project structure

```
APINet/
  Models/
    User.cs               The request body sent to the login endpoint
    LoginResponse.cs      The response body returned by the login endpoint
  RestSharp/
    ApiClient.cs          Wraps RestSharp — handles requests, responses, and logging
    ApiResponse.cs        A wrapper that holds the status code, data, and any errors
    TestBase.cs           Loads config and gets the auth token once per session
    Tests/
      LoginTests.cs       Login endpoint tests using RestSharp
  RestAssured/
    TestBase.cs           Same as above but uses RestAssured.Net for the auth call
    Tests/
      LoginTests.cs       Login endpoint tests using RestAssured.Net
  appsettings.json        Base configuration (API URLs, timeout values)
  appsettings.Development.json  Local overrides (optional)
```

---

## Setup

### 1. Install .NET 10

Download from [dot.net](https://dot.net) if you don't have it yet.

```bash
dotnet --version  # should print 10.x.x
```

### 2. Set credentials as user secrets

Credentials are never stored in code or committed to git. .NET **user secrets** store them safely on your local machine only.

Run these commands from the repo root (where `APINet/APINet.csproj` lives):

```bash
dotnet user-secrets set "USER_ADMIN_COMPANY" "YourCompany"    --project APINet
dotnet user-secrets set "USER_ADMIN_USERNAME" "admin@example.com" --project APINet
dotnet user-secrets set "USER_ADMIN_PASSWORD" "secret"         --project APINet
dotnet user-secrets set "USER_COMPANY"        "YourCompany"    --project APINet
dotnet user-secrets set "USER_USERNAME"       "user@example.com"  --project APINet
dotnet user-secrets set "USER_PASSWORD"       "secret"         --project APINet
```

| Variable | Description |
|---|---|
| `USER_ADMIN_COMPANY` | Company identifier for the admin user |
| `USER_ADMIN_USERNAME` | Admin username |
| `USER_ADMIN_PASSWORD` | Admin password |
| `USER_COMPANY` | Company identifier for the regular user |
| `USER_USERNAME` | Regular username |
| `USER_PASSWORD` | Regular password |

### 3. Build

```bash
dotnet build
```

---

## Running tests

```bash
# Run all tests
dotnet run --project APINet/APINet.csproj

# Run a single test by name
dotnet run --project APINet/APINet.csproj -- --filter "Login_WithValidCredentials_ReturnsToken"
```

---

## Configuration resolution order

When the tests start, configuration is loaded in this order (later sources override earlier ones):

1. `appsettings.json` — base defaults (API URLs, timeout in ms, retry count)
2. `appsettings.{env}.json` — environment-specific overrides (set `DOTNET_ENVIRONMENT` to switch)
3. Environment variables — used by CI
4. User secrets — your local credentials (never committed to git)

---

## CI

GitHub Actions runs all tests automatically on every push and pull request to `main`. The credentials are stored as GitHub repository secrets and injected as environment variables at runtime.

---

## Troubleshooting

**`InvalidOperationException: USER_ADMIN_PASSWORD is not configured`**
User secrets are not set on this machine. Run the `dotnet user-secrets set` commands from the Setup section above, making sure to include `--project APINet`.

**`dotnet: command not found` or wrong version**
Download .NET 10 from [dot.net](https://dot.net). Verify with:
```bash
dotnet --version  # should print 10.x.x
```

**`dotnet run` exits immediately with no test output**
Run `dotnet build` first to see if there are compilation errors. Fix any reported errors before running tests.

**Tests fail with `could not authenticate` / `Session setup failed`**
The admin credentials stored in user secrets are incorrect or the auth service is unreachable. Double-check the values and that `Api:AuthUrl` in `appsettings.json` points to the right URL.
