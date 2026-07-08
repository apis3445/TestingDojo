import sys, json, re

d = json.load(sys.stdin)
cmd = d.get("tool_input", {}).get("command", "")

if re.search(r"\.env(?!\w|\.)", cmd):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": "Bash commands targeting .env are blocked. Use .env.example instead."
        }
    }))
