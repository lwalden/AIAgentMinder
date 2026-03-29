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
    ],
    "PostToolUse": [
      {
        "type": "command",
        "command": "bash .claude/scripts/correction-capture-hook.sh"
      }
    ],
    "Stop": [
      {
        "type": "command",
        "command": "bash .claude/scripts/sprint-stop-guard.sh"
      }
    ]
  }
}
