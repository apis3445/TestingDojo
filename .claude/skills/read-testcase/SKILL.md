---
name: read-testcase
description: Read Azure DevOps Test Case
allowed-tools: mcp__azure-devops__wit_get_work_item
---

Fetch a test case by ID from Azure DevOps and display its manual steps.

## Usage
```
/read-testcase <id> [project]
```

- `id` — required. The work item ID.
- `project` — optional. ADO project name. Defaults to the project configured in `.mcp.json`. Use when the test case belongs to a different project (e.g. `/read-testcase 123 Microsip`).

## Steps

### 1. Verify MCP is available

Before doing anything, check that the Azure DevOps MCP is connected by attempting to call `mcp__azure-devops__wit_get_work_item`. If it fails or is not available, stop and show this message:

```
Azure DevOps MCP is not set up. Add an `azure-devops` entry to `.mcp.json` using the `@modelcontextprotocol/server-azure-devops` package, e.g.:

  {
    "mcpServers": {
      "azure-devops": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-azure-devops", "--remote", "YourOrgName", "--project", "YourProject", "--authentication", "azcli"]
      }
    }
  }

Then restart Claude Code and try again.
```

### 2. Fetch the work item

Parse the arguments: the first token is `id`, the second token (if present) is `project`.

Call `mcp__azure-devops__wit_get_work_item` with:
- `id`: the ID provided by the user
- `expand`: `"all"` (to include all fields including test steps)
- `project`: the project argument if provided; omit the field entirely if not provided (let the MCP use its default)

If the work item is not found or is not a Test Case (check `System.WorkItemType`), show:
```
Work item <id> not found or is not a Test Case (type: <actual type>).
```

### 3. Parse and display the steps

Extract these fields from the response:
- `System.Title` — the test case name
- `Microsoft.VSTS.TCM.Steps` — XML containing the manual steps

The steps XML looks like this:
```xml
<steps id="0" last="N">
  <step id="N" type="ValidateStep">
    <parameterizedString isformatted="true"><P>Action text</P></parameterizedString>
    <parameterizedString isformatted="true"><P>Expected result</P></parameterizedString>
  </step>
  <step id="N" type="ActionStep">
    <parameterizedString isformatted="true"><P>Action only</P></parameterizedString>
    <parameterizedString isformatted="true"></parameterizedString>
  </step>
</steps>
```

Parse each `<step>` element:
- Strip HTML tags from both `<parameterizedString>` values
- First string = action, second string = expected result
- `ValidateStep` = has expected result, `ActionStep` = action only

### 4. Output format

Print in this format — compact, no extra blank lines between steps:

```
Test Case #<id>: <title>

Steps:
1. <action>
   → <expected result>

2. <action>
   (no expected result)

3. <action>
   → <expected result>
```

Only show the `→ <expected result>` line when the expected result is not empty.
