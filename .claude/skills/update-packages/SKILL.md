---
name: update-packages
description: Update all npm dependencies
---

Do the following:

1. From `e2e/playwright/`, run `npm outdated` to see which packages have newer versions available
2. Update the dependencies in the package.json file
3. Run `npm install` to install the updated dependencies
4. Run `npm audit` to check for security vulnerabilities in the updated dependencies. If high or critical vulnerabilities are found, run `npm audit fix` to resolve them automatically, then report any that could not be fixed automatically
5. Run `npx tsc --noEmit` to catch any TypeScript errors from breaking API changes in the updated packages
6. Run `npx playwright test --list` to validate test collection and config without executing tests
7. Report what was updated, any security issues found, and whether any errors were found
