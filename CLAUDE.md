# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

TestingDojo is a dual-stack test automation project targeting `https://abi-testing-dojo-demo.azurewebsites.net/`:

- **`e2e/playwright/`** — TypeScript end-to-end UI tests using Playwright
- **`APINet/`** — .NET 10 API tests using TUnit + RestAssured.Net/RestSharp

## Commands

### Playwright (e2e/playwright/)

```bash
# Install dependencies
npm ci

# Install browsers
npx playwright install --with-deps

# Run all tests (all browsers)
npx playwright test

# Run a single test file
npx playwright test tests/login.spec.ts

# Run in a specific browser
npx playwright test --project=chromium

# Run with UI
npx playwright test --ui

# View HTML report
npx playwright show-report
```

### .NET API tests (APINet/)

```bash
# Build
dotnet build

# Run all tests
dotnet run --project APINet/APINet.csproj

# Run a single test by name
dotnet run --project APINet/APINet.csproj -- --filter "Login_WithInvalidUser_ReturnsError"
```

## Architecture

### Playwright layer

Tests follow a **Page Object Model** with a shared component library:

- **`tests/`** — Test specs. Each test uses page objects; never interacts with the DOM directly.
- **`pages/`** — Page objects extend `BasePage`. Pages compose typed components (e.g., `InputText`, `Button`) and use `test.step()` directly for structured HTML reporting.
- **`components/`** — UI component wrappers extend `BaseComponent`. Components locate elements by ARIA role (`byRole=true`) or CSS selector, and wrap every action in `test.step()` for the report timeline.
- **`utils/AnnotationType.ts`** — Enum with three values (`Precondition`, `PostCondition`, `Description`) used exclusively in spec annotation arrays. Never used inside page objects or components.


**Environment:** `BASE_URL` and credentials are read from `e2e/playwright/.env` (see that file for variable names). On CI the `BASE_URL` env var must be set externally; `workers` is forced to 1 and retries to 2.

### .NET layer

`APINet/` is a single TUnit project (net10.0) with `RestAssured.Net` and `RestSharp` for HTTP. Tests use TUnit's `[Before(Class)]`/`[Before(Test)]` lifecycle hooks. There is currently one test class (`BasicTests` in `LoginTests.cs`).

## Claude Code setup

The Azure DevOps MCP is pre-configured via `.mcp.json` (org: `wbi1521`, default project: `EffizienteAuth`). Authentication uses the Azure CLI (`--authentication azurecli`), so no Personal Access Token is needed. Each developer just signs in once:

```bash
az login
```

The MCP reads your Azure CLI session to mint Azure DevOps tokens on demand. Work item IDs are org-wide, so the default project does not restrict which projects you can query — pass a different `project` per call when needed.

## Code style

Use comments sparingly. Only comment complex or non-obvious code.

## CI

`.github/workflows/tests.yml` runs Playwright, .NET, and Postman tests on push/PR to `main`/`master`. The Playwright job sets `working-directory: e2e/playwright` and runs `npm ci` / `npx playwright test` from there — ensure `package.json` and `playwright.config.ts` remain at `e2e/playwright/`.
