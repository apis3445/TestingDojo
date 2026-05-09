# Testing Dojo

A multi-stack test automation project covering UI, API, and contract testing against the [Testing Dojo demo app](https://abi-testing-dojo-demo.azurewebsites.net/).

---

## How testing is organized

This repo contains three independent testing projects, each targeting the same application from a different angle:

![Project Organization](docs/images/project_overview.svg)

| Project                              | Language         | What it tests                                       |
| ------------------------------------ | ---------------- | --------------------------------------------------- |
| [`e2e/playwright/`](e2e/playwright/) | TypeScript       | UI (browser) — verifies what a user sees and clicks |
| [`APINet/`](APINet/)                 | C# (.NET 10)     | REST API — verifies the server's responses directly |
| [`postman/`](postman/)               | Postman / Newman | REST API — same coverage, visual and scriptable     |

Each project has its own README with detailed setup and architecture notes:

- [Playwright README](e2e/playwright/README.md)
- [.NET API README](APINet/README.md)
- [Postman README](postman/README.md)

---

## Best Practices

These two rules apply to every project in this repo. They are the most important things to understand before writing or running any test.

### Rule 1 — Never store credentials in code

Usernames and passwords must **never** appear in `.ts`, `.cs`, or `.json` files that are committed to git. If they are, anyone with access to the repository can read them — including in old commits even after they are "deleted".

Each project stores credentials in a different safe location:

| Project    | Where credentials live locally                                                                | How CI receives them                                      |
| ---------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Playwright | `.env` file inside `e2e/playwright/` — excluded from git by `.gitignore`                      | GitHub Actions Secrets, injected as environment variables |
| .NET       | `dotnet user-secrets` — stored in your OS user profile, completely outside the project folder | GitHub Actions Secrets, injected as environment variables |
| Postman    | `--env-var` flags passed on the command line — never saved to a file                          | GitHub Actions Secrets, injected as `--env-var` flags     |

Tests read credentials at runtime using environment variables or configuration — the actual values are never in the source code:

```typescript
// Playwright — reads from .env locally or from CI environment at runtime
await loginPage.login({
  UserName: process.env.ADMIN_USER,
  Password: process.env.ADMIN_PASSWORD,
});
```

```csharp
// .NET — reads from user secrets locally or from CI environment at runtime
Company  = Configuration["USER_ADMIN_COMPANY"],
Password = Configuration["USER_ADMIN_PASSWORD"],
```

### Rule 2 — Store UI text in JSON locale files, not in code

The app supports multiple languages (English, Spanish, German, Japanese). UI tests locate elements by their **visible text** — for example, the label on the Login button. If that text is hardcoded in English, tests will fail when a different language is active.

The solution: every UI string lives in a JSON file per language inside `e2e/playwright/data/`.

```
e2e/playwright/data/
  en-US.json   ← English
  es-MX.json   ← Spanish
  de-DE.json   ← German
  ja-JP.json   ← Japanese
```

Each file has the same structure — only the values differ:

```jsonc
// en-US.json
{ "home": { "login": "Login", "user": "User", "pass": "Password" } }

// es-MX.json
{ "home": { "login": "Iniciar Sesión", "user": "Usuario", "pass": "Contraseña" } }
```

In code, always reference the key — never the raw string:

```typescript
// Good — uses the translated label for whichever locale is active
submit = new Button(this.page, this.localeInfo.home.login);

// Bad — hardcoded English; will break when running Spanish or German tests
submit = new Button(this.page, "Login");
```

The framework automatically loads the correct file based on the active Playwright project (language).

---

## Quick start

### Playwright

```bash
cd e2e/playwright
npm ci
npx playwright install --with-deps
# Create a .env file with your credentials — see e2e/playwright/README.md for the template
npx playwright test
```

### .NET API tests

> TUnit uses Microsoft.Testing.Platform and compiles to an executable, so tests are run via `dotnet run` (not `dotnet test`).

```bash
# Store credentials once on your machine (never committed to git)
dotnet user-secrets set "USER_ADMIN_COMPANY"  "YourCompany"      --project APINet
dotnet user-secrets set "USER_ADMIN_USERNAME" "admin@example.com" --project APINet
dotnet user-secrets set "USER_ADMIN_PASSWORD" "secret"           --project APINet

# Run all tests
dotnet run --project APINet/APINet.csproj

# Run a single test by name
dotnet run --project APINet/APINet.csproj -- --filter "Login_WithInvalidUser_ReturnsError"
```

### Postman (Newman)

```bash
npm install -g newman newman-reporter-junitfull
newman run postman/TestingDojo.postman_collection.json \
  --environment postman/TestingDojoDemo.postman_environment.json \
  --env-var "companyAdmin=YourCompany" \
  --env-var "userNameAdmin=admin@example.com" \
  --env-var "passwordAdmin=secret"
```

---

## CI/CD

GitHub Actions runs all three projects on every push and pull request to `main` or `master`. See [`.github/workflows/`](.github/workflows/).

### Required GitHub secrets and variables

Go to **Settings → Secrets and variables → Actions** and add:

| Name              | Type     | Description                                      |
| ----------------- | -------- | ------------------------------------------------ |
| `BASE_URL`        | Variable | App base URL (not sensitive — visible in logs)   |
| `AUTH_URL`        | Variable | Authentication/token endpoint URL (not sensitive — visible in logs) |
| `COMPANY`         | Variable | Company identifier for login (not sensitive)     |
| `ADMIN_USER`      | Secret   | Admin username (encrypted, masked in logs)       |
| `ADMIN_PASSWORD`  | Secret   | Admin password (encrypted, masked in logs)       |
| `NORMAL_USER`     | Secret   | Normal user username (encrypted, masked in logs) |
| `NORMAL_PASSWORD` | Secret   | Normal user password (encrypted, masked in logs) |

Use **Variables** for non-sensitive values like URLs. Use **Secrets** for anything that must not appear in logs.

---

## Repository structure

```
.github/workflows/   CI pipeline definitions
e2e/playwright/      Playwright UI tests (TypeScript)
  api/               API request classes used in setup (e.g. LoginApi)
  data/              JSON locale files — one per supported language
  fixtures/          Custom Playwright fixtures
  pages/             Page Object classes — one per screen
  components/        Reusable UI element wrappers (Button, InputText, etc.)
  tests/             Test specifications
  utils/             Shared utilities (ApiHelper, AnnotationType)
APINet/              .NET API tests (C# + TUnit)
  RestSharp/         Tests using the RestSharp HTTP library
  RestAssured/       Same tests using the RestAssured.Net library (for comparison)
  Models/            Request/response data models
postman/             Postman collection + environment file
```
