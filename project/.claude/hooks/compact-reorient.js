#!/usr/bin/env node
// Hook: SessionStart (compact matcher only) — Re-orient Claude after context compaction.
// Outputs active sprint summary (first 15 lines of SPRINT.md) if a sprint is in progress;
// otherwise outputs a brief status line.
//
// Fires ONLY post-compaction (via "matcher": "compact" in settings.json), not on every
// session start. Native .claude/rules/ loading, @import syntax, and Session Memory handle
// everything else automatically.
//
// Cross-platform (Node.js). No dependencies.

const fs = require("fs");
const path = require("path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const sprintFile = path.join(projectDir, "SPRINT.md");

if (fs.existsSync(sprintFile)) {
  const content = fs.readFileSync(sprintFile, "utf8");
  if (content.includes("**Status:** in-progress")) {
    const lines = content.split("\n").slice(0, 15);
    console.log("--- Sprint context (post-compaction reorientation) ---");
    console.log(lines.join("\n"));
    process.exit(0);
  }
}

console.log("No active sprint.");
