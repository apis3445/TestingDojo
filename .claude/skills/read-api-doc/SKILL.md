---
name: read-api-doc
description: Fetch and parse the demo API's OpenAPI spec (served via Scalar) for an endpoint, tag, or resource. Use to look up a route's method, auth requirement, request/response schema, and status codes before writing an API test, e.g. "look up POST /api/Server in the docs" or "what does the docs say Server returns".
allowed-tools: Bash, Read, Grep
---

Read the demo API's real contract straight from its published OpenAPI spec — never guess a route, field name, or status code. Used standalone, or as a source by `api-tester`, `api-restassured`, `api-restsharp`, and `api-postman`.

## Usage

```
/read-api-doc <method + path | tag | resource name> [host]
/read-api-doc            # lists every path, grouped by tag
```

- `host` — optional: `auth` (auth demo) or `api` (business demo). Omit to search both.

## Step 1: Resolve the host(s)

Never hardcode the URLs — read them fresh from `APINet/appsettings.json` (`Api:AuthUrl`, `Api:BaseUrl`). Both are the same kind of ASP.NET Core app, so both may publish docs; don't assume only one does.

- `Api:AuthUrl` → login/user endpoints
- `Api:BaseUrl` → business endpoints (Server, dashboard/collection, menu)

If the request names a resource, guess the more likely host from the naming (Login/Users → AuthUrl, everything else → BaseUrl) but fetch both if unsure.

## Step 2: Fetch the spec

```bash
curl -sf {host}/openapi/v1.json
```

If this 404s or fails, do **not** fall back to scraping the Scalar HTML UI (`/scalar/v1`) with a browser — the JSON is the actual source of truth and browser automation isn't warranted here. Report that no spec is published at that host and stop.

## Step 3: Locate the operation(s)

Parse the JSON (`python3 -c "import json,sys; ..."` or `jq` if available) and match against `paths`:

- Exact `method + path` → that operation only.
- A tag name → every operation whose `tags` array contains it.
- A resource name with no method → every path containing that segment.
- No argument → every path, grouped by tag, path + methods only (no schema detail) — a menu, not a full dump.

Dereference any `$ref` against `components.schemas` — don't leave `#/components/schemas/X` unresolved in the output.

## Step 4: Cross-check against the real model

When `APINet/Models/<SchemaName>.cs` exists, `Grep` it and compare field names/types against the spec's schema. Backends can serialize different casing or omit fields the spec still lists (or vice versa) — flag any mismatch instead of silently trusting one source; don't pick a winner for the caller.

## Step 5: Output

One block per operation, compact — mirrors `read-testcase`'s style:

```
POST /api/Server                              [tags: Server]
Auth: Bearer JWT required
Request body (Server):
  Key      integer  required
  Name     string   required, maxLength 150
  Url      string   required
  Active   boolean
Responses:
  201 → Server (Id, Key, Name, Url, Active)
  400 → ValidationProblemDetails (errors: Key, Name, Url)
  401 → (no body)

Model check: APINet/Models/Server.cs matches — no mismatch.
```

If a critical piece is missing from the spec itself (no documented error schema, no auth requirement listed), say so rather than inventing one — the caller (a human, or `api-tester`) decides how to proceed.
