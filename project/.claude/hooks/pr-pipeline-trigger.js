#!/usr/bin/env node
// Hook: PostToolUse (Bash matcher) — Detect gh pr create and spawn background PR pipeline.
// Reads the Claude Code hook payload from stdin. If the Bash tool output contains a
// GitHub PR URL (indicating a newly created PR), spawns claude -p in a git worktree
// to run /aam-pr-pipeline autonomously.
//
// Fires only on Bash tool uses (via "matcher": "Bash" in settings.json).
// Exits immediately for non-PR-creation bash outputs with no output.
//
// Cross-platform (Node.js). No external dependencies.

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const PR_URL_PATTERN = /https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)/;

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', () => resolve(''));
  });
}

async function main() {
  // Read hook payload from stdin (cross-platform — no /dev/stdin)
  let input = '';
  try {
    input = await readStdin();
  } catch {
    process.exit(0);
  }

  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  // Only handle Bash tool results
  if (payload.tool_name !== 'Bash') process.exit(0);

  const stdout = (payload.tool_response?.stdout || payload.output?.stdout || '');
  const match = stdout.match(PR_URL_PATTERN);
  if (!match) process.exit(0);

  const [, owner, repo, prNumber] = match;
  const prUrl = match[0];

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  // Prune stale worktrees before creating a new one
  try {
    execSync('git worktree prune', { cwd: projectDir, stdio: 'ignore' });
  } catch { /* non-fatal */ }

  // Check if a pipeline is already running for this PR
  const worktreeBase = path.join(projectDir, '..', '.pr-pipeline-worktrees');
  const worktreeName = `${repo}-pr-${prNumber}`;
  const worktreePath = path.join(worktreeBase, worktreeName);

  if (fs.existsSync(worktreePath)) {
    console.log(`PR pipeline already running for #${prNumber} (worktree exists: ${worktreePath})`);
    process.exit(0);
  }

  // Get the branch for this PR
  let branch;
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectDir,
      encoding: 'utf8'
    }).trim();
  } catch {
    console.error('pr-pipeline-trigger: could not determine current branch');
    process.exit(0);
  }

  // Create worktree
  try {
    fs.mkdirSync(worktreeBase, { recursive: true });
    execSync(`git worktree add "${worktreePath}" "${branch}"`, {
      cwd: projectDir,
      stdio: 'ignore'
    });
  } catch (err) {
    console.error(`pr-pipeline-trigger: failed to create worktree: ${err.message}`);
    process.exit(0);
  }

  // Set up log file
  const logFile = path.join(worktreePath, 'pipeline.log');
  const logFd = fs.openSync(logFile, 'a');

  // Build prompt — explicitly instruct the agent to read the command file.
  // In -p mode, .claude/commands/ files are NOT auto-loaded like rules are.
  // The agent must read the spec with the Read tool to get the full 9-step pipeline.
  const prompt =
    `You are an autonomous PR pipeline agent. Your FIRST action must be to read ` +
    `the file .claude/commands/aam-pr-pipeline.md — it contains the complete ` +
    `9-step pipeline specification you must follow exactly. ` +
    `Execute every step for PR #${prNumber} (${prUrl}) on branch ${branch} ` +
    `in repo ${owner}/${repo}. The pipeline is running in a git worktree — ` +
    `clean up the worktree when done. ` +
    `IMPORTANT: Do NOT stop after posting a review comment. The pipeline ` +
    `continues through fix, test, and merge steps.`;

  // Spawn background claude -p process (detached, unref'd so it outlives this hook)
  const child = spawn(
    'claude',
    [
      '-p',
      '--model', 'claude-sonnet-4-6',
      '--max-turns', '100',
      '--allowedTools', 'Read,Write,Edit,Bash(*),Grep,Glob,WebFetch',
      prompt
    ],
    {
      cwd: worktreePath,
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env: { ...process.env }
    }
  );

  child.unref();
  fs.closeSync(logFd);

  console.log(
    `PR pipeline started in background for #${prNumber}.\n` +
    `  Worktree: ${worktreePath}\n` +
    `  Log:      ${logFile}`
  );
}

main().catch(() => process.exit(0));
