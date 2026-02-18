#!/usr/bin/env node
// Hook: SessionStart — Re-inject PROGRESS.md and DECISIONS.md on every session
// start (startup, resume, compact, clear). Keeps Claude oriented automatically.
// Also outputs task suggestions for Claude's native Task system.
// Cross-platform (Node.js). No dependencies.

const fs = require("fs");
const path = require("path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const progressFile = path.join(projectDir, "PROGRESS.md");
const decisionsFile = path.join(projectDir, "DECISIONS.md");

// Always inject PROGRESS.md — this is Claude's session memory
if (fs.existsSync(progressFile)) {
  const content = fs.readFileSync(progressFile, "utf8");
  console.log("--- PROGRESS.md (session context) ---");
  console.log(content);

  // Extract tasks and priorities for Claude's native Task system
  const lines = content.split("\n");
  const tasks = [];
  let inTasks = false;
  let inPriorities = false;

  for (const line of lines) {
    if (/^## Active Tasks/i.test(line)) { inTasks = true; inPriorities = false; continue; }
    if (/^## Next Priorities/i.test(line)) { inPriorities = true; inTasks = false; continue; }
    if (/^## /.test(line)) { inTasks = false; inPriorities = false; continue; }

    const trimmed = line.replace(/^[-*\d.)\s]+/, "").trim();
    if (!trimmed) continue;

    if (inTasks) tasks.push({ text: trimmed, type: "active" });
    if (inPriorities) tasks.push({ text: trimmed, type: "priority" });
  }

  if (tasks.length > 0) {
    console.log("\n--- Tasks from PROGRESS.md (consider adding to your native task list) ---");
    for (const t of tasks) {
      console.log(`[${t.type}] ${t.text}`);
    }
  }
}

// Inject DECISIONS.md if it has any recorded decisions (more than just headers)
if (fs.existsSync(decisionsFile)) {
  const content = fs.readFileSync(decisionsFile, "utf8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  // Inject if there are actual decisions — threshold: any ### heading = a decision exists
  const hasDecisions = lines.some((l) => /^### /.test(l));
  if (hasDecisions) {
    console.log("\n--- DECISIONS.md (architectural decisions — do not re-debate) ---");
    console.log(content);
  }
}
