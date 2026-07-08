import sys, json, re

d = json.load(sys.stdin)
cmd = d.get("tool_input", {}).get("command", "")

# Matches .env, .env.local, .env.production, e2e/playwright/.env, ... but not
# .env*.example templates. The leading (^|[\s"'/\\]) boundary keeps this from
# matching unrelated names like "prod.environment".
# Examples: ".env" -> block, ".env.local" -> block, ".env.production" -> block,
# ".env.example" -> allow, ".env.local.example" -> allow.
matches = re.finditer(r'(?:^|[\s"\'/\\])(\.env(?:\.[\w-]+)*)', cmd)
if any(not m.group(1).endswith(".example") for m in matches):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": "Bash commands targeting .env files are blocked. Use .env.example instead."
        }
    }))
