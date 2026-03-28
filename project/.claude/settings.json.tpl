{
  "statusLine": {
    "type": "command",
    "command": "bash .claude/scripts/context-monitor.sh"
  },
  "hooks": {
    "PreToolUse": [
      {
        "type": "command",
        "command": "bash .claude/scripts/context-cycle-hook.sh"
      }
    ]
  }
}
