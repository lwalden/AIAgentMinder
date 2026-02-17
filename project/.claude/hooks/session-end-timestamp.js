#!/usr/bin/env node
// Hook: Stop — Update PROGRESS.md "Last Updated" timestamp when session ends.
// Cross-platform (Node.js). No dependencies.

const fs = require("fs");
const path = require("path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const progressFile = path.join(projectDir, "PROGRESS.md");

if (!fs.existsSync(progressFile)) process.exit(0);

const now = new Date();
const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

let content = fs.readFileSync(progressFile, "utf8");

if (/\*\*Last Updated:\*\*/.test(content)) {
  content = content.replace(/\*\*Last Updated:\*\*.*/, `**Last Updated:** ${timestamp}`);
} else {
  content = content.replace(/(\*\*Phase:\*\*.*)/, `$1\n**Last Updated:** ${timestamp}`);
}

fs.writeFileSync(progressFile, content, "utf8");
