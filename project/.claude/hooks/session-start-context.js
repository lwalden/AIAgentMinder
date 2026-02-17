#!/usr/bin/env node
// Hook: SessionStart — Re-inject PROGRESS.md and DECISIONS.md after context
// compaction or resume. Keeps Claude oriented without user re-prompting.
// Cross-platform (Node.js). No dependencies.

const fs = require("fs");
const path = require("path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// Read hook input from stdin
let input = "";
try {
  input = fs.readFileSync(0, "utf8");
} catch {
  // No stdin available
}

// Only run on compact or resume events, not fresh startup
let event = "";
try {
  const parsed = JSON.parse(input);
  event = parsed.event || "";
} catch {
  // If no JSON input, check argv
  event = process.argv[2] || "";
}

if (event !== "compact" && event !== "resume") process.exit(0);

const progressFile = path.join(projectDir, "PROGRESS.md");
const decisionsFile = path.join(projectDir, "DECISIONS.md");

if (fs.existsSync(progressFile)) {
  const content = fs.readFileSync(progressFile, "utf8");
  console.log("--- PROGRESS.md (re-injected after context compaction) ---");
  console.log(content);
}

if (fs.existsSync(decisionsFile)) {
  const content = fs.readFileSync(decisionsFile, "utf8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  // Only inject if there are actual decisions (more than just the template header)
  if (lines.length > 10) {
    console.log("--- DECISIONS.md (re-injected after context compaction) ---");
    console.log(content);
  }
}
