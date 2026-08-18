# Postman — API Tests

This project contains REST API tests built in [Postman](https://www.postman.com/). Locally they can be run with [Newman](https://github.com/postmanlabs/newman); in CI they run with the [Postman CLI](https://learning.postman.com/docs/postman-cli/postman-cli-overview/), which executes the collection and environment directly from your Postman cloud workspace instead of the local JSON files.

## What is being tested?

The tests call the [Testing Dojo demo app](https://abi-testing-dojo-demo.azurewebsites.net/) REST API directly — no browser involved. They verify that endpoints return the correct status codes, response bodies, and tokens for different users and scenarios.

---

## Key concepts

### Postman
A tool for building and testing HTTP requests. You create a **collection** (a set of requests grouped into folders) and add **test scripts** to each request. Each script runs after the response comes back and asserts things like status codes or response fields.

```javascript
// Example test script inside Postman
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Response has access token", () => {
    const body = pm.response.json();
    pm.expect(body.accessToken).to.not.be.empty;
});
```

### Newman
Postman's command-line runner. It executes the collection outside of the Postman app by reading the local `TestingDojo.postman_collection.json` / `TestingDojoDemo.postman_environment.json` files. Useful for running the tests locally without opening the desktop app.

### Postman CLI
Postman's own command-line tool (`postman`), separate from Newman. Instead of reading local files, it authenticates with `postman login --with-api-key` and then runs a collection/environment by their **UID**, pulling the current version straight from the Postman cloud workspace. **This is what CI uses now** — both the GitHub Actions `postman` job (`.github/workflows/tests.yml`, via the `postmanlabs/postman-cli-action`) and the scheduled Azure Pipelines run (`azure-pipelines-postman.yml`).

Because CI runs the cloud copy of the collection/environment by UID, it can drift from the committed JSON files in this folder if changes are made in the Postman app but not re-exported — see [Updating the collection](#updating-the-collection).

### Collection file
`TestingDojo.postman_collection.json` — contains all the requests, their bodies, headers, and test scripts. This file is committed to the repo so everyone has the same tests.

### Environment file
`TestingDojoDemo.postman_environment.json` — contains variables like the API base URL. **Sensitive values (usernames, passwords) are left empty** in this file so they are never committed to git. They are passed in at runtime via `--env-var`.

---

## Files

| File | Description |
|---|---|
| `TestingDojo.postman_collection.json` | All requests and test scripts |
| `TestingDojoDemo.postman_environment.json` | Environment template — sensitive values are empty and injected at runtime |

---

## Setup

### Install Newman

Newman is an npm package. Install it globally so you can run it from any directory:

```bash
npm install -g newman newman-reporter-junitfull
```

---

## Running locally

Run from the `postman/` directory:

```bash
newman run TestingDojo.postman_collection.json \
  --environment TestingDojoDemo.postman_environment.json \
  --env-var "companyAdmin=YourCompany" \
  --env-var "userNameAdmin=admin@example.com" \
  --env-var "passwordAdmin=secret" \
  --env-var "company=YourCompany" \
  --env-var "userName=user@example.com" \
  --env-var "password=secret"
```

To also save a JUnit XML report (useful for CI dashboards):

```bash
newman run TestingDojo.postman_collection.json \
  --environment TestingDojoDemo.postman_environment.json \
  --env-var "companyAdmin=YourCompany" \
  --env-var "userNameAdmin=admin@example.com" \
  --env-var "passwordAdmin=secret" \
  --env-var "company=YourCompany" \
  --env-var "userName=user@example.com" \
  --env-var "password=secret" \
  --reporters cli,junitfull \
  --reporter-junitfull-export results/postman-results.xml
```

---

## Running in CI (Postman CLI)

CI does **not** run Newman against the local JSON files — it runs the [Postman CLI](https://learning.postman.com/docs/postman-cli/postman-cli-overview/) against the collection and environment stored in the Postman cloud workspace, referenced by UID:

```bash
postman login --with-api-key "$POSTMAN_API_KEY"

postman collection run 1273809-cdf08318-6fff-48af-a18d-ba4d2e2ec21f \
  -e 1273809-6dd814a7-aeb2-46d9-a9da-8a9164b22db7 \
  --env-var "companyAdmin=YourCompany" \
  --env-var "userNameAdmin=admin@example.com" \
  --env-var "passwordAdmin=secret" \
  --env-var "company=YourCompany" \
  --env-var "userName=user@example.com" \
  --env-var "password=secret" \
  --reporters cli,junit \
  --reporter-junit-export results/postman-results.xml
```

> Don't wrap the collection/environment UIDs in quotes — some CLI wrappers (e.g. the `postmanlabs/postman-cli-action` GitHub Action) split the command string without stripping shell quoting, so quoted UIDs are passed through literally and fail to resolve.

This runs in two pipelines:

| Pipeline | File | Trigger |
|---|---|---|
| GitHub Actions — `postman` job | `.github/workflows/tests.yml` | push/PR to `main`/`master`, via `postmanlabs/postman-cli-action` |
| Azure Pipelines | `azure-pipelines-postman.yml` | daily schedule (`main`), installs the CLI with `curl \| sh` and runs it directly |

Both pipelines authenticate with a `POSTMAN_API_KEY` secret and pass credentials in via `--env-var`, the same way the local Newman commands above do — only the runner and the source of the collection/environment (cloud UID vs. local file) differ.

---

## Variables reference

| Variable | Description |
|---|---|
| `AuthAPI` | Auth service base URL (set in environment file) |
| `companyAdmin` | Company identifier for the admin user |
| `userNameAdmin` | Admin username |
| `passwordAdmin` | Admin password |
| `company` | Company identifier for the regular user |
| `userName` | Regular username |
| `password` | Regular password |

---

## Test coverage

| Folder | Tests |
|---|---|
| `Login / Admin` | Admin login returns a token |
| `Login / User` | Normal user login returns a token |
| `Login` | Invalid credentials return 401 |
| `Menu / Admin` | Admin user returns the admin menu |
| `Menu / User` | Normal user returns the user menu |
| `Menu` | Unauthenticated request returns 401 · Authenticated user with access returns the menu |

---

## Running in the Postman desktop app

If you prefer a visual interface over the command line, you can run the collection directly inside Postman:

1. **Import the collection** — click **Import** in the top left, then select `TestingDojo.postman_collection.json`.
2. **Import the environment** — click **Import** again and select `TestingDojoDemo.postman_environment.json`.
3. **Set credentials** — open the imported environment (top right dropdown → **Edit**) and fill in the `Current value` column for `companyAdmin`, `userNameAdmin`, `passwordAdmin`, `company`, `userName`, and `password`. Leave the `Initial value` column empty so credentials are never accidentally exported.
4. **Select the environment** — choose `TestingDojoDemo` from the environment dropdown in the top right.
5. **Run the collection** — open the collection, click **Run**, then **Run TestingDojo**.

> The `Current value` column is stored locally on your machine only. The `Initial value` column is what gets exported — keep it empty for credential variables.

---

## Data-Driven Testing (CSV)

You can run the same test suite multiple times using different sets of data (for example, to test the API with different languages) by using a CSV file. This is useful for verifying that the API correctly handles localization or different input scenarios without duplicating requests.

### 1. Create a CSV file
Create a file named `data.csv` (or any name) in the `postman/` directory. The first row must contain the variable names that match those used in your requests.

```csv
language,expectedMenuLabel
1,売掛金
2,Accounts Receivable
```

### 2. Use variables in Postman
In your Postman requests, use the double curly brace syntax `{{variableName}}`. Postman will automatically prioritize data from the CSV file over environment variables during a run.

- **Request Body:**
  ```json
  {
    "Language": "{{language}}"
  }
  ```
- **Test Scripts:**
  To access the data in a script, use `pm.iterationData.get("variableName")`:
  ```javascript
  const expectedLabel = pm.iterationData.get("expectedMenuLabel");
  pm.test("Menu label is " + expectedLabel, () => {
      pm.expect(pm.response.json()[0].label).to.eql(expectedLabel);
  });
  ```

### 3. Run with Newman (CLI)
Use the `-d` or `--iteration-data` flag to specify the CSV file:

```bash
newman run TestingDojo.postman_collection.json \
  -e TestingDojoDemo.postman_environment.json \
  -d data.csv
```

### 4. Run in Postman Desktop App
1. Open the collection in Postman.
2. Click the **Run** button in the top right of the collection tab.
3. In the **Runner** tab, look for the **Data** section.
4. Click **Select File** and choose your CSV file.
5. (Optional) Click **Preview** to verify the data is parsed correctly.
6. Click **Run TestingDojo**.

---

## Updating the collection

1. Make changes in the Postman desktop app.
2. Export the collection: **⋯ → Export → Collection v2.1**.
3. Replace `TestingDojo.postman_collection.json` with the exported file.
4. **Never export the environment file with real credentials** — clear sensitive values before exporting.

---

## Troubleshooting

**`newman: command not found`**
Newman is not installed. Run:
```bash
npm install -g newman newman-reporter-junitfull
```

**`Error: connect ECONNREFUSED` or all requests fail**
The `AuthAPI` variable in the environment file points to the wrong URL, or the service is down. Check the value in `TestingDojoDemo.postman_environment.json`.

**Tests fail with `401 Unauthorized` on the menu requests**
The login request before the menu folder is failing silently, so no token was saved. Run the `Login / Admin` folder alone first to see the actual login error.

**Credentials are showing up in exported environment files**
You set the credentials in the `Initial value` column instead of `Current value`. Clear the `Initial value` for all credential variables — it should always be empty.
