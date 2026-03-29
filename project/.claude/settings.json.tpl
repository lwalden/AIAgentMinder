{
  "statusLine": {
    "type": "command",
    "command": "bash .claude/scripts/context-monitor.sh"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/scripts/context-cycle-hook.sh"
          }
        ]
      }
    ]
  }
}
