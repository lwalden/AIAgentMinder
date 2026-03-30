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
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/scripts/correction-capture-hook.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/scripts/sprint-stop-guard.sh"
          }
        ]
      }
    ]
  }
}
