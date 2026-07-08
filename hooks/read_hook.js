const path = require("path");

process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  const toolArgs = JSON.parse(input);
  const readPath = toolArgs.tool_input?.file_path || "";
  const base = path.basename(readPath);
  // Blocks .env, .env.local, .env.production, ... but allows .env*.example templates.
  if (base.startsWith(".env") && !base.endsWith(".example")) {
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Reading .env files is blocked. Use .env.example instead.",
      },
    }));
    process.exit(0);
  }
  process.exit(0);
});
