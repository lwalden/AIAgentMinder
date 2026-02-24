#!/usr/bin/env node
// Hook: SessionStart — Re-inject PROGRESS.md and DECISIONS.md on every session
// start (startup, resume, compact, clear). Keeps Claude oriented automatically.
// Also injects SPRINT.md when an active sprint exists, injects any .md files
// from .claude/guidance/, and outputs task suggestions for Claude's native Task system.
// Cross-platform (Node.js). No dependencies.

const fs = require("fs");
const path = require("path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const progressFile = path.join(projectDir, "PROGRESS.md");
const decisionsFile = path.join(projectDir, "DECISIONS.md");
const sprintFile = path.join(projectDir, "SPRINT.md");
const guidanceDir = path.join(projectDir, ".claude", "guidance");

// Always inject PROGRESS.md — this is Claude's session memory
if (fs.existsSync(progressFile)) {
  const content = fs.readFileSync(progressFile, "utf8");
  console.log("--- PROGRESS.md (session context) ---");
  console.log(content);

  // Extract tasks, priorities, and current state for Claude's native Task system
  const lines = content.split("\n");
  const tasks = [];
  let inTasks = false;
  let inPriorities = false;
  let inState = false;

  for (const line of lines) {
    if (/^## Active Tasks/i.test(line)) { inTasks = true; inPriorities = false; inState = false; continue; }
    if (/^## Next Priorities/i.test(line)) { inPriorities = true; inTasks = false; inState = false; continue; }
    if (/^## Current State/i.test(line)) { inState = true; inTasks = false; inPriorities = false; continue; }
    if (/^## /.test(line)) { inTasks = false; inPriorities = false; inState = false; continue; }

    const trimmed = line.replace(/^[-*\d.)\s]+/, "").trim();
    if (!trimmed) continue;

    if (inTasks) tasks.push({ text: trimmed, type: "active" });
    if (inPriorities) tasks.push({ text: trimmed, type: "priority" });
    if (inState) tasks.push({ text: trimmed, type: "state" });
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

// Inject SPRINT.md when an active sprint exists
if (fs.existsSync(sprintFile)) {
  const content = fs.readFileSync(sprintFile, "utf8");
  const hasActiveSprint = content.includes("**Status:** in-progress");
  if (hasActiveSprint) {
    console.log("\n--- SPRINT.md (active sprint) ---");
    console.log(content);

    // Extract sprint issues as task suggestions
    const sprintMatch = content.match(/\*\*Sprint:\*\*\s*(\d+)/);
    const sprintNum = sprintMatch ? sprintMatch[1] : "?";
    const issueLines = [];
    const issueRegex = /^### (S\d+-\d+): (.+)/;
    const statusRegex = /\*\*Status:\*\*\s*(todo|in-progress|done|blocked)/;
    const blockerRegex = /\*\*Blocker:\*\*\s*(.+)/;

    const lines = content.split("\n");
    let currentIssue = null;
    let currentStatus = null;
    let currentBlocker = null;

    for (const line of lines) {
      const issueMatch = line.match(issueRegex);
      if (issueMatch) {
        if (currentIssue && currentStatus !== "done") {
          let entry = `[${currentStatus}] ${currentIssue}`;
          if (currentStatus === "blocked" && currentBlocker) entry += ` — ${currentBlocker}`;
          issueLines.push(entry);
        }
        currentIssue = `${issueMatch[1]}: ${issueMatch[2]}`;
        currentStatus = null;
        currentBlocker = null;
        continue;
      }
      if (currentIssue) {
        const statusMatch = line.match(statusRegex);
        if (statusMatch) currentStatus = statusMatch[1];
        const blockerMatch = line.match(blockerRegex);
        if (blockerMatch) currentBlocker = blockerMatch[1];
      }
    }
    // Flush last issue
    if (currentIssue && currentStatus && currentStatus !== "done") {
      let entry = `[${currentStatus}] ${currentIssue}`;
      if (currentStatus === "blocked" && currentBlocker) entry += ` — ${currentBlocker}`;
      issueLines.push(entry);
    }

    if (issueLines.length > 0) {
      console.log(`\n--- Sprint issues (S${sprintNum}) ---`);
      for (const line of issueLines) {
        console.log(line);
      }
    }
  }
}

// Inject .md files from .claude/guidance/ (excluding README.md)
if (fs.existsSync(guidanceDir)) {
  let guidanceFiles;
  try {
    guidanceFiles = fs.readdirSync(guidanceDir)
      .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
      .sort();
  } catch (e) {
    guidanceFiles = [];
  }

  for (const file of guidanceFiles) {
    const filePath = path.join(guidanceDir, file);
    try {
      const content = fs.readFileSync(filePath, "utf8");
      console.log(`\n--- .claude/guidance/${file} (development guidance) ---`);
      console.log(content);
    } catch (e) {
      // Skip unreadable files silently
    }
  }
}
