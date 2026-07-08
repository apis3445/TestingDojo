# API test case template

A manual API test case walks a tester through issuing one request and validating the response and any side effects. Keep each case focused on a single endpoint + scenario (happy path, one validation/error path per case).

## Step structure

Cover these in order, omitting any that don't apply. Collapse trivial ones. All response assertions ride on the Send step's expected result as bullets — never as separate "Observe the status" / "Inspect the body" steps — and a failed bullet still points at exactly one assertion.

1. **Precondition / setup** — auth token obtained, required data seeded, base URL known. Action only (expected result may be empty), unless setup itself returns something worth asserting.
2. **Send the request and assert the response** — state the method, path, and notable headers/body. The expected result lists, as bullets: the concrete status code, then the specific body fields/values or schema (not "body is correct"), e.g. `Status code is 200 OK` and `Body contains a non-empty "token" field and "expiresIn" > 0`.
3. **Assert side effects** (when relevant) — a follow-up GET, a DB/state check, an audit entry is a real action, so it gets its own step, with its own bulleted assertions: e.g. `Send GET /api/profile with the returned token` → `Status 200` / `Profile matches the logged-in user`.

## What the expected results must be

- A concrete status code (`200 OK`, `401 Unauthorized`, `422`).
- A named field and its expected value/shape, or the exact error message/`code` string.
- For error cases, assert both the status **and** the error payload.

## Example

Title: `POST /api/login with invalid password returns 401 and error message`

```
1. Obtain the base URL and a valid existing username →
2. Send POST /api/login with body containing the valid username and a wrong password →
     - Status code is 401 Unauthorized
     - Body contains error code "INVALID_CREDENTIALS" and no token field
```

Step 2's bulleted expected result is produced by the steps-XML rewrite described in SKILL.md Step 4 — the plain `steps` create-string cannot hold bullets.

When deriving from a .NET TUnit test in `APINet/`, map each RestAssured/RestSharp call to a Send step and each assertion to an expected result.
