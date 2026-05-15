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
  // correction-capture-hook.sh retired in the v5.0.0 migration —
  // Claude Code's native Auto Memory supersedes it.
  'correction-capture-hook',
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
 * Merge a single hook type (e.g., PreToolUse) from template into target.
 *
 * Strategy:
 * 1. Drop obsolete entries from target
 * 2. Drop any target entries that contain AAM-managed hook commands
 *    (they'll be replaced by the template's authoritative versions)
 * 3. Prepend all template entries (which are authoritative for AAM hooks)
 * 4. Preserve all user-added entries (those that don't reference .claude/scripts/)
 *
 * This handles templates with multiple AAM hooks per hook type.
 *
 * @param {Array} templateEntries - Hook entries from template
 * @param {Array} targetEntries - Existing hook entries from target (may be undefined)
 * @returns {Array} Merged hook entries
 */
function mergeHookType(templateEntries, targetEntries) {
  if (!targetEntries || targetEntries.length === 0) {
    return [...templateEntries];
  }

  // Keep only user entries: not obsolete, not AAM-managed
  const userEntries = targetEntries.filter(entry => {
    if (entry.hooks.some(h => isObsoleteHook(h.command))) return false;
    if (entry.hooks.some(h => isAamHook(h.command))) return false;
    return true;
  });

  // Template AAM entries come first, then preserved user entries
  return [...templateEntries, ...userEntries];
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

    // Scrub obsolete AAM entries from hook types the template no longer ships.
    // Without this, retired hooks (e.g., correction-capture in PostToolUse)
    // would survive forever in targets that installed them previously.
    for (const hookType of Object.keys(result.hooks)) {
      if (template.hooks[hookType]) continue;
      const cleaned = (result.hooks[hookType] || []).filter(entry =>
        !entry.hooks.some(h => isObsoleteHook(h.command))
      );
      if (cleaned.length === 0) {
        delete result.hooks[hookType];
      } else {
        result.hooks[hookType] = cleaned;
      }
    }
  }

  return result;
}
