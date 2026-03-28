import fs from 'node:fs';
import path from 'node:path';

/**
 * Check if a file exists in the project directory.
 */
function exists(dir, ...segments) {
  return fs.existsSync(path.join(dir, ...segments));
}

/**
 * Read a file if it exists, return null otherwise.
 */
function readIfExists(dir, ...segments) {
  const filePath = path.join(dir, ...segments);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Parse package.json if it exists. Returns null if missing or unparseable.
 */
function readPackageJson(dir) {
  const content = readIfExists(dir, 'package.json');
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Check if a directory contains any files matching an extension.
 */
function hasFileWithExtension(dir, ext) {
  if (!fs.existsSync(dir)) return false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.some(e => e.isFile() && e.name.endsWith(ext));
}

/**
 * Safely extract dependencies from a parsed package.json.
 * Guards against non-object values in dependencies/devDependencies.
 */
function getDeps(pkg) {
  const safePick = (obj) =>
    (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
  return { ...safePick(pkg.dependencies), ...safePick(pkg.devDependencies) };
}

/**
 * Detect the primary programming language.
 *
 * @param {string} dir - Project root directory
 * @returns {string|null}
 */
export function detectLanguage(dir) {
  // TypeScript (check before JS since TS projects also have package.json)
  if (exists(dir, 'package.json') && exists(dir, 'tsconfig.json')) {
    return 'TypeScript';
  }

  // JavaScript/Node.js
  if (exists(dir, 'package.json')) {
    return 'JavaScript';
  }

  // Python
  if (exists(dir, 'requirements.txt') || exists(dir, 'pyproject.toml') || exists(dir, 'setup.py')) {
    return 'Python';
  }

  // Go
  if (exists(dir, 'go.mod')) {
    return 'Go';
  }

  // Rust
  if (exists(dir, 'Cargo.toml')) {
    return 'Rust';
  }

  // C# (.csproj files)
  if (hasFileWithExtension(dir, '.csproj') || exists(dir, 'Directory.Build.props')) {
    return 'C#';
  }

  // Java
  if (exists(dir, 'pom.xml') || exists(dir, 'build.gradle') || exists(dir, 'build.gradle.kts')) {
    return 'Java';
  }

  return null;
}

// Framework detection entries: [package/marker name, framework label]
const JS_FRAMEWORKS = [
  ['next', 'Next.js'],
  ['nuxt', 'Nuxt'],
  ['svelte', 'Svelte'],
  ['@angular/core', 'Angular'],
  ['vue', 'Vue'],
  ['react', 'React'],
  ['express', 'Express'],
  ['fastify', 'Fastify'],
  ['hono', 'Hono'],
  ['koa', 'Koa'],
  ['@nestjs/core', 'NestJS'],
];

const PYTHON_FRAMEWORKS = [
  ['fastapi', 'FastAPI'],
  ['django', 'Django'],
  ['flask', 'Flask'],
  ['starlette', 'Starlette'],
];

/**
 * Detect the primary framework.
 *
 * @param {string} dir
 * @returns {string|null}
 */
export function detectFramework(dir) {
  // Check JS/TS frameworks from package.json
  const pkg = readPackageJson(dir);
  if (pkg) {
    const allDeps = getDeps(pkg);

    for (const [dep, framework] of JS_FRAMEWORKS) {
      if (dep in allDeps) {
        return framework;
      }
    }
  }

  // Check Python frameworks from requirements.txt
  const requirements = readIfExists(dir, 'requirements.txt');
  if (requirements) {
    const lower = requirements.toLowerCase();
    for (const [depName, framework] of PYTHON_FRAMEWORKS) {
      const re = new RegExp(`(^|[^a-z])${depName}([^a-z]|$)`, 'm');
      if (re.test(lower)) {
        return framework;
      }
    }
  }

  // Check Python frameworks from pyproject.toml dependencies
  const pyproject = readIfExists(dir, 'pyproject.toml');
  if (pyproject) {
    const lower = pyproject.toLowerCase();
    for (const [depName, framework] of PYTHON_FRAMEWORKS) {
      const re = new RegExp(`(^|[^a-z])${depName}([^a-z]|$)`, 'm');
      if (re.test(lower)) {
        return framework;
      }
    }
  }

  return null;
}

// Test runner detection entries for JS
const JS_TEST_RUNNERS = [
  ['vitest', 'Vitest'],
  ['jest', 'Jest'],
  ['mocha', 'Mocha'],
  ['ava', 'AVA'],
  ['playwright', 'Playwright'],
  ['cypress', 'Cypress'],
];

/**
 * Detect the test runner.
 *
 * @param {string} dir
 * @returns {string|null}
 */
export function detectTestRunner(dir) {
  // JS/TS test runners from package.json
  const pkg = readPackageJson(dir);
  if (pkg) {
    const allDeps = getDeps(pkg);

    for (const [dep, runner] of JS_TEST_RUNNERS) {
      if (dep in allDeps) {
        return runner;
      }
    }
  }

  // Python: pytest
  const requirements = readIfExists(dir, 'requirements.txt');
  if (requirements && /(?:^|[^a-z])pytest(?:[^a-z]|$)/m.test(requirements.toLowerCase())) {
    return 'pytest';
  }

  const pyproject = readIfExists(dir, 'pyproject.toml');
  if (pyproject && pyproject.includes('[tool.pytest')) {
    return 'pytest';
  }

  // Go: go test is built-in
  if (exists(dir, 'go.mod')) {
    return 'go test';
  }

  // Rust: cargo test is built-in
  if (exists(dir, 'Cargo.toml')) {
    return 'cargo test';
  }

  return null;
}

/**
 * Detect CI/CD provider.
 *
 * @param {string} dir
 * @returns {string|null}
 */
export function detectCI(dir) {
  const workflowsDir = path.join(dir, '.github', 'workflows');
  if (fs.existsSync(workflowsDir) &&
      (hasFileWithExtension(workflowsDir, '.yml') || hasFileWithExtension(workflowsDir, '.yaml'))) {
    return 'GitHub Actions';
  }

  if (exists(dir, '.gitlab-ci.yml')) {
    return 'GitLab CI';
  }

  if (exists(dir, '.circleci')) {
    return 'CircleCI';
  }

  if (exists(dir, 'Jenkinsfile')) {
    return 'Jenkins';
  }

  if (exists(dir, 'azure-pipelines.yml')) {
    return 'Azure Pipelines';
  }

  return null;
}

// Lint/format tool detection: [file marker, tool name]
const LINT_MARKERS = [
  ['.eslintrc.json', 'ESLint'],
  ['.eslintrc.js', 'ESLint'],
  ['.eslintrc.cjs', 'ESLint'],
  ['.eslintrc.yml', 'ESLint'],
  ['.eslintrc.yaml', 'ESLint'],
  ['eslint.config.js', 'ESLint'],
  ['eslint.config.mjs', 'ESLint'],
  ['eslint.config.ts', 'ESLint'],
  ['.prettierrc', 'Prettier'],
  ['.prettierrc.json', 'Prettier'],
  ['.prettierrc.js', 'Prettier'],
  ['prettier.config.js', 'Prettier'],
  ['biome.json', 'Biome'],
  ['biome.jsonc', 'Biome'],
  ['ruff.toml', 'Ruff'],
  ['.flake8', 'Flake8'],
  ['.pylintrc', 'Pylint'],
  ['mypy.ini', 'mypy'],
  ['.golangci.yml', 'golangci-lint'],
  ['.golangci.yaml', 'golangci-lint'],
  ['clippy.toml', 'Clippy'],
];

/**
 * Detect lint/format configuration files.
 *
 * @param {string} dir
 * @returns {string[]} - Array of detected tool names (deduplicated)
 */
export function detectLintConfig(dir) {
  const found = new Set();

  for (const [marker, tool] of LINT_MARKERS) {
    if (exists(dir, marker)) {
      found.add(tool);
    }
  }

  // Also check pyproject.toml for [tool.ruff] section
  const pyproject = readIfExists(dir, 'pyproject.toml');
  if (pyproject) {
    if (pyproject.includes('[tool.ruff')) found.add('Ruff');
    if (pyproject.includes('[tool.mypy')) found.add('mypy');
    if (pyproject.includes('[tool.pylint')) found.add('Pylint');
  }

  return [...found].sort();
}

// Frameworks that suggest web-app type
const WEB_FRAMEWORKS = new Set([
  'React', 'Next.js', 'Vue', 'Nuxt', 'Angular', 'Svelte',
]);

// Frameworks that suggest api type
const API_FRAMEWORKS = new Set([
  'Express', 'Fastify', 'Hono', 'Koa', 'NestJS',
  'FastAPI', 'Django', 'Flask', 'Starlette',
]);

/**
 * Run all detections and return a combined fingerprint.
 *
 * @param {string} dir
 * @returns {{
 *   language: string|null,
 *   framework: string|null,
 *   testRunner: string|null,
 *   ci: string|null,
 *   lintTools: string[],
 *   stack: string|null,
 *   type: string|null,
 * }}
 */
export function fingerprint(dir) {
  const language = detectLanguage(dir);
  const framework = detectFramework(dir);
  const testRunner = detectTestRunner(dir);
  const ci = detectCI(dir);
  const lintTools = detectLintConfig(dir);

  // Build stack string from components
  const stackParts = [language, framework].filter(Boolean);
  const stack = stackParts.length > 0 ? stackParts.join(' / ') : null;

  // Infer project type from framework
  let type = null;
  if (framework) {
    if (WEB_FRAMEWORKS.has(framework)) {
      type = 'web-app';
    } else if (API_FRAMEWORKS.has(framework)) {
      type = 'api';
    }
  } else if (language && !framework) {
    // Language but no framework — likely a library or CLI tool
    type = 'library';
  }

  return { language, framework, testRunner, ci, lintTools, stack, type };
}
