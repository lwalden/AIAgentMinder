/**
 * Deterministic settings.json merge.
 *
 * Adds/updates AIAgentMinder-managed entries (statusLine, hooks).
 * Preserves user-added hooks and other config (env, custom keys).
 * Removes known obsolete hook entries.
 */

/**
 * Patterns that identify obsolete hook commands to remove during merge.
 */
const OBSOLETE_HOOK_PATTERNS = [
  'compact-reorient',
  'pr-pipeline-trigger',
];

/**
 * Check if a hook command matches a known AAM-managed script.
 * @param {string} command
 * @returns {boolean}
 */
function isAamHook(command) {
  return command.includes('.claude/scripts/');
}

/**
 * Check if a hook command matches a known obsolete pattern.
 * @param {string} command
 * @returns {boolean}
 */
function isObsoleteHook(command) {
  return OBSOLETE_HOOK_PATTERNS.some(p => command.includes(p));
}

/**
 * Find the AAM-managed hook command in a template hook array.
 * @param {Array<{matcher: string, hooks: Array}>} templateEntries
 * @returns {string|null} The command string of the AAM hook
 */
function getAamCommand(templateEntries) {
  for (const entry of templateEntries) {
    for (const hook of entry.hooks) {
      if (isAamHook(hook.command)) return hook.command;
    }
  }
  return null;
}

/**
 * Merge a single hook type (e.g., PreToolUse) from template into target.
 *
 * Strategy:
 * 1. Remove obsolete entries from target
 * 2. If target has an existing AAM hook, update it
 * 3. If not, add the template's AAM hook entry
 * 4. Preserve all user-added entries
 *
 * @param {Array} templateEntries - Hook entries from template
 * @param {Array} targetEntries - Existing hook entries from target (may be undefined)
 * @returns {Array} Merged hook entries
 */
function mergeHookType(templateEntries, targetEntries) {
  if (!targetEntries || targetEntries.length === 0) {
    return [...templateEntries];
  }

  const aamCommand = getAamCommand(templateEntries);
  const aamTemplateEntry = templateEntries.find(e =>
    e.hooks.some(h => h.command === aamCommand));

  // Filter out obsolete entries
  let filtered = targetEntries.filter(entry =>
    !entry.hooks.some(h => isObsoleteHook(h.command))
  );

  // Check if target already has this AAM hook
  const existingIndex = filtered.findIndex(entry =>
    entry.hooks.some(h => isAamHook(h.command))
  );

  if (existingIndex >= 0) {
    // Update in place
    filtered[existingIndex] = aamTemplateEntry;
  } else {
    // Add the AAM entry
    filtered = [aamTemplateEntry, ...filtered];
  }

  return filtered;
}

/**
 * Perform an additive merge of template settings into target settings.
 *
 * @param {object} template - Parsed settings.json.tpl content
 * @param {object} target - Parsed target settings.json content (or empty object)
 * @returns {object} Merged settings object
 */
export function mergeSettings(template, target) {
  const result = { ...target };

  // Always set statusLine from template
  result.statusLine = template.statusLine;

  // Merge hooks
  if (template.hooks) {
    if (!result.hooks) result.hooks = {};

    for (const [hookType, templateEntries] of Object.entries(template.hooks)) {
      result.hooks[hookType] = mergeHookType(templateEntries, result.hooks[hookType]);
    }
  }

  return result;
}
