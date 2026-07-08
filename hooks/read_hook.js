const path = require("path");

process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (d) => (input += d));
function deny(reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

process.stdin.on("end", () => {
  let toolArgs;
  try {
    toolArgs = JSON.parse(input);
  } catch {
    deny("Could not parse hook input; denying read as a precaution.");
    return;
  }

  const readPath = toolArgs.tool_input?.file_path;
  if (typeof readPath !== "string") {
    process.exit(0);
    return;
  }

  const base = path.basename(readPath);
  // Blocks .env, .env.local, .env.production, ... but allows .env*.example templates.
  if (base.startsWith(".env") && !base.endsWith(".example")) {
    deny("Reading .env files is blocked. Use .env.example instead.");
    return;
  }
  process.exit(0);
});
