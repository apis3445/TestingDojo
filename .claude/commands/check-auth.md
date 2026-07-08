Verify that the Playwright admin auth token exists and is not expired.

## Steps

1. Check if `e2e/playwright/.auth/admin.json` exists. If it does not exist, stop and tell the user: "Auth files not found. Please run global setup first with: `cd e2e/playwright && npx playwright test tests/login.spec.ts --project=English` — then retry."

2. Use the Read tool to read `e2e/playwright/.auth/admin.json` and extract the `token` value from `localStorage`.

3. Run a Bash command to decode the JWT and check expiry:
   ```bash
   node -e "
     const token = '<token value>';
     const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
     const now = Math.floor(Date.now() / 1000);
     console.log(payload.exp < now ? 'expired' : 'ok');
   "
   ```
   If the output is `expired`, stop and tell the user: "Auth token is expired. Please re-run: `cd e2e/playwright && npx playwright test tests/login.spec.ts --project=English` — then retry."

4. Tell the user: "Auth is valid."
