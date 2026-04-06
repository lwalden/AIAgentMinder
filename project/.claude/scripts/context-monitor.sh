#!/bin/bash
# context-monitor.sh — Status line data bridge for context cycling.
# Receives status line JSON on stdin, writes .context-usage to project root.
# No stdout output (data bridge only).
# Requires: jq
#
# Configured in .claude/settings.json:
#   "statusLine": { "type": "command", "command": "bash .claude/scripts/context-monitor.sh" }

input=$(cat)

# Bail if jq not available
command -v jq >/dev/null 2>&1 || exit 0

model_id=$(echo "$input" | jq -r '.model.id // "unknown"')
total_input=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
total_output=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
window_size=$(echo "$input" | jq -r '.context_window.context_window_size // 0')
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // 0')
cwd=$(echo "$input" | jq -r '.cwd // "."')

# Skip if no context data yet (early in session)
if [ "$window_size" = "0" ] || [ "$window_size" = "null" ]; then
  exit 0
fi

# Model-specific absolute token thresholds (sized for 1M context windows).
# These are capped below if the actual window is smaller (e.g. 200k).
case "$model_id" in
  *opus*)   threshold=580000 ;;
  *sonnet*) threshold=500000 ;;
  *)        threshold=0 ;;  # unknown model — fall back to percentage
esac

# Calculate tokens currently in context window
used_tokens=$(echo "$used_pct $window_size" | awk '{printf "%d", ($1 / 100) * $2}')

# Cap threshold to 70% of actual window_size so cycling works on both
# 200k (standard) and 1M context windows. Without this cap the hardcoded
# thresholds above are unreachable on 200k contexts.
if [ "$threshold" -gt 0 ] && [ "$window_size" -gt 0 ]; then
  max_threshold=$(echo "$window_size" | awk '{printf "%d", $1 * 0.70}')
  if [ "$threshold" -gt "$max_threshold" ]; then
    threshold=$max_threshold
  fi
fi

# Determine if cycling is warranted
should_cycle=false
if [ "$threshold" -gt 0 ]; then
  if [ "$used_tokens" -ge "$threshold" ]; then
    should_cycle=true
  fi
else
  # Fallback: 35% for unrecognized models
  used_int=$(echo "$used_pct" | cut -d. -f1)
  if [ "$used_int" -ge 35 ]; then
    should_cycle=true
  fi
fi

# Secondary signal: exceeds 200k tokens (useful for status line consumers)
exceeds_200k=false
if [ "$used_tokens" -ge 200000 ]; then
  exceeds_200k=true
fi

# Write to project root (atomic via temp file)
tmpfile="$cwd/.context-usage.tmp"
outfile="$cwd/.context-usage"

cat > "$tmpfile" << EOF
{"should_cycle":$should_cycle,"model":"$model_id","used_tokens":$used_tokens,"threshold":$threshold,"used_pct":$used_pct,"window_size":$window_size,"total_input":$total_input,"total_output":$total_output,"exceeds_200k":$exceeds_200k}
EOF

mv "$tmpfile" "$outfile" 2>/dev/null || cp "$tmpfile" "$outfile" 2>/dev/null
rm -f "$tmpfile" 2>/dev/null
