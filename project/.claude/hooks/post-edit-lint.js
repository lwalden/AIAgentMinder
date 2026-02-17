#!/usr/bin/env node
// Hook: PostToolUse — Auto-format files after Write or Edit operations.
// Runs the appropriate formatter for the file's language.
// Cross-platform (Node.js). No dependencies. Silent failure if tools not found.

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// Read hook input from stdin
let filePath = "";
try {
  const input = fs.readFileSync(0, "utf8");
  const parsed = JSON.parse(input);
  filePath = parsed.tool_input?.file_path || parsed.tool_input?.path || "";
} catch {
  process.exit(0);
}

if (!filePath || !fs.existsSync(filePath)) process.exit(0);

const ext = path.extname(filePath).toLowerCase();

function tryRun(cmd) {
  try {
    execSync(cmd, { cwd: projectDir, stdio: ["pipe", "pipe", "pipe"], timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

function hasCommand(cmd) {
  try {
    execSync(process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

function hasLocalCommand(cmd) {
  const localPath = path.join(projectDir, "node_modules", ".bin", cmd);
  return fs.existsSync(localPath) || fs.existsSync(localPath + ".cmd");
}

function localOrGlobal(cmd) {
  if (hasLocalCommand(cmd)) {
    const localPath = path.join(projectDir, "node_modules", ".bin", cmd);
    return `"${localPath}"`;
  }
  if (hasCommand(cmd)) return cmd;
  return null;
}

const quoted = `"${filePath}"`;

switch (ext) {
  case ".js":
  case ".jsx":
  case ".ts":
  case ".tsx":
  case ".css":
  case ".json":
  case ".md":
  case ".html":
  case ".yaml":
  case ".yml": {
    const prettier = localOrGlobal("prettier");
    if (prettier) { tryRun(`${prettier} --write ${quoted}`); break; }
    const eslint = localOrGlobal("eslint");
    if (eslint) tryRun(`${eslint} --fix ${quoted}`);
    break;
  }
  case ".py": {
    if (hasCommand("black")) { tryRun(`black --quiet ${quoted}`); break; }
    if (hasCommand("ruff")) tryRun(`ruff format ${quoted}`);
    break;
  }
  case ".rs": {
    if (hasCommand("rustfmt")) tryRun(`rustfmt ${quoted}`);
    break;
  }
  case ".go": {
    if (hasCommand("gofmt")) tryRun(`gofmt -w ${quoted}`);
    break;
  }
  case ".cs":
  case ".fs":
  case ".vb": {
    if (hasCommand("dotnet")) tryRun(`dotnet format --include ${quoted}`);
    break;
  }
}
