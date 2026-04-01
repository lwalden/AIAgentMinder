#!/usr/bin/env bash
# correction-capture-hook.sh — PostToolUse hook that detects correction patterns.
#
# Tracks sequential tool calls. When a tool call fails and the next call to the
# same tool uses different arguments (a correction), logs it to .corrections.jsonl.
# When the same correction pattern recurs (2+ occurrences), outputs a notification
# via hookSpecificOutput.additionalContext so Claude can follow the flagging protocol
# in correction-capture.md.
#
# Configured in .claude/settings.json:
#   "hooks": {
#     "PostToolUse": [{
#       "matcher": "",
#       "hooks": [{
#         "type": "command",
#         "command": "bash .claude/scripts/correction-capture-hook.sh"
#       }]
#     }]
#   }
#
# Input: JSON on stdin with tool_name, tool_input, tool_response fields.
# Output: JSON with hookSpecificOutput.additionalContext when a recurring pattern is detected.

set -euo pipefail
# Fail open: any unexpected error silently exits rather than crashing into
# a hook error that disrupts the tool call flow.
trap 'exit 0' ERR

STATE_FILE=".correction-state"
LOG_FILE=".corrections.jsonl"

# Require jq — fail open without it.
if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

# Read hook input from stdin.
input=$(cat)

tool_name=$(echo "$input" | jq -r '.tool_name // "unknown"')
tool_input=$(echo "$input" | jq -c '.tool_input // {}')
tool_response=$(echo "$input" | jq -c '.tool_response // {}')

# --- Determine if this tool call failed. ---

is_failed=false

# Bash: check .success field or .exitCode
if [ "$tool_name" = "Bash" ]; then
  success=$(echo "$tool_response" | jq -r '.success // true')
  exit_code=$(echo "$tool_response" | jq -r '.exitCode // 0')
  if [ "$success" = "false" ] || [ "$exit_code" != "0" ]; then
    is_failed=true
  fi
else
  # Non-Bash: check for error indicators in response
  response_str=$(echo "$tool_response" | jq -r 'if type == "string" then . else (tostring) end')
  if echo "$response_str" | grep -qiE '"is_error"\s*:\s*true|"success"\s*:\s*false'; then
    is_failed=true
  fi
fi

# --- Check for transient errors (exclude from correction tracking). ---

is_transient=false
if [ "$is_failed" = "true" ]; then
  response_output=""
  if [ "$tool_name" = "Bash" ]; then
    response_output=$(echo "$tool_response" | jq -r '.output // ""')
  else
    response_output=$(echo "$tool_response" | jq -r 'if type == "string" then . else (tostring) end')
  fi

  if echo "$response_output" | grep -qiE 'ETIMEDOUT|ECONNREFUSED|ECONNRESET|rate limit|429 Too Many|503 Service Unavailable'; then
    is_transient=true
  fi
fi

# --- Extract a summary of the tool input for comparison. ---

get_input_summary() {
  local tn="$1"
  local ti="$2"
  if [ "$tn" = "Bash" ]; then
    echo "$ti" | jq -r '.command // ""'
  elif [ "$tn" = "Edit" ] || [ "$tn" = "Read" ] || [ "$tn" = "Write" ]; then
    echo "$ti" | jq -r '.file_path // ""'
  elif [ "$tn" = "Grep" ]; then
    echo "$ti" | jq -r '.pattern // ""'
  elif [ "$tn" = "Glob" ]; then
    echo "$ti" | jq -r '.pattern // ""'
  else
    echo "$ti" | jq -c '.'
  fi
}

# Extract pattern key (groups corrections by type).
get_pattern_key() {
  local tn="$1"
  local ti="$2"
  if [ "$tn" = "Bash" ]; then
    local cmd
    cmd=$(echo "$ti" | jq -r '.command // ""')
    local first_word
    first_word=$(echo "$cmd" | awk '{print $1}')
    echo "${tn}:${first_word}"
  else
    echo "$tn"
  fi
}

current_summary=$(get_input_summary "$tool_name" "$tool_input")

# --- Compare with previous call state. ---

if [ -f "$STATE_FILE" ]; then
  prev_tool=$(jq -r '.tool_name // ""' "$STATE_FILE" 2>/dev/null || echo "")
  prev_failed=$(jq -r '.failed // false' "$STATE_FILE" 2>/dev/null || echo "false")
  prev_summary=$(jq -r '.input_summary // ""' "$STATE_FILE" 2>/dev/null || echo "")
  prev_transient=$(jq -r '.transient // false' "$STATE_FILE" 2>/dev/null || echo "false")

  # Correction detected when:
  # 1. Same tool as previous call
  # 2. Previous call failed (and was not transient)
  # 3. Current call succeeded
  # 4. Input differs (different approach, not just a retry)
  if [ "$prev_tool" = "$tool_name" ] \
    && [ "$prev_failed" = "true" ] \
    && [ "$prev_transient" != "true" ] \
    && [ "$is_failed" = "false" ] \
    && [ "$prev_summary" != "$current_summary" ]; then

    # Log the correction.
    pattern_key=$(get_pattern_key "$tool_name" "$tool_input")
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%S")

    jq -nc \
      --arg ts "$ts" \
      --arg tool "$tool_name" \
      --arg failed "$prev_summary" \
      --arg succeeded "$current_summary" \
      --arg key "$pattern_key" \
      '{ts: $ts, tool: $tool, failed_input: $failed, succeeded_input: $succeeded, pattern_key: $key}' \
      >> "$LOG_FILE"

    # Check if this pattern has recurred (2+ entries with same key).
    if [ -f "$LOG_FILE" ]; then
      count=$(grep -cF "\"pattern_key\":\"${pattern_key}\"" "$LOG_FILE" 2>/dev/null || echo "0")

      if [ "$count" -ge 2 ]; then
        # Output notification via hookSpecificOutput.additionalContext.
        jq -n \
          --arg key "$pattern_key" \
          --argjson count "$count" \
          '{hookSpecificOutput: {additionalContext: ("Correction Pattern Detected — " + $key + "\n\nThe same type of correction (tool: " + $key + ") has occurred " + ($count | tostring) + " times this session.\nCheck .corrections.jsonl for details and follow the flagging protocol in .claude/rules/correction-capture.md.\nConsider creating a permanent rule to prevent this pattern.")}}'
      fi
    fi
  fi
fi

# --- Update state file with current call. ---

jq -n \
  --arg tn "$tool_name" \
  --argjson failed "$is_failed" \
  --arg summary "$current_summary" \
  --argjson transient "$is_transient" \
  '{tool_name: $tn, failed: $failed, input_summary: $summary, transient: $transient}' \
  > "$STATE_FILE"

exit 0
