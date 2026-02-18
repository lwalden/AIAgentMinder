#!/usr/bin/env node
// Hook: PreCompact — Capture session state to PROGRESS.md before context
// compaction. Ensures no work-in-progress is lost when the context window
// is compressed. Cross-platform (Node.js). No dependencies.

const fs = require("fs");
const path = require("path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const progressFile = path.join(projectDir, "PROGRESS.md");

if (!fs.existsSync(progressFile)) process.exit(0);

// Update the timestamp so post-compaction context shows when state was saved
const now = new Date();
const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

let content = fs.readFileSync(progressFile, "utf8");

if (/\*\*Last Updated:\*\*/.test(content)) {
  content = content.replace(/\*\*Last Updated:\*\*.*/, `**Last Updated:** ${timestamp} (pre-compaction save)`);
} else {
  content = content.replace(/(\*\*Phase:\*\*.*)/, `$1\n**Last Updated:** ${timestamp} (pre-compaction save)`);
}

fs.writeFileSync(progressFile, content, "utf8");

// Stage the file so it's preserved even if session ends unexpectedly
const { execSync } = require("child_process");
try {
  execSync("git add PROGRESS.md", { cwd: projectDir, stdio: ["pipe", "pipe", "pipe"] });
} catch {
  // Not in a git repo or git not available — that's fine
}
