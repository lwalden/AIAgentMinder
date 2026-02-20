#!/usr/bin/env node
// Hook: Stop — Auto git checkpoint commit on session end.
// Cross-platform (Node.js). No dependencies.
//
// Safety: skips if not in a git repo, on main/master, or nothing to commit.
// Only stages tracked files with changes (no git add -A).
// Does not use --no-verify so git hooks still run.

const { execSync } = require("child_process");
const path = require("path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function run(cmd) {
  try {
    return execSync(cmd, { cwd: projectDir, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

// Check if in a git repo
if (!run("git rev-parse --is-inside-work-tree")) process.exit(0);

// Check branch — never auto-commit to main or master
const branch = run("git branch --show-current");
if (!branch || branch === "main" || branch === "master") process.exit(0);

// Check for changes (tracked files only)
const status = run("git status --porcelain");
if (!status) process.exit(0);

// Stage only tracked modified files (not untracked)
run("git add -u");

// Check if anything is actually staged after add -u
const staged = run("git diff --cached --name-only");
if (!staged) process.exit(0);

// Skip if only PROGRESS.md is staged — that's just a timestamp bump, not real work
const stagedFiles = staged.split("\n").map(f => f.trim()).filter(Boolean);
if (stagedFiles.length === 1 && stagedFiles[0] === "PROGRESS.md") process.exit(0);

const now = new Date();
const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

run(`git commit -m "auto: session checkpoint (${timestamp}) [${branch}]"`);
