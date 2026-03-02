---
description: Scope governance — check new work against the roadmap before implementing
---

# Scope Guardian
# AIAgentMinder-managed. Delete this file to opt out of scope governance.

## Before Implementing Any New Feature

Before writing code for a feature, check `docs/strategy-roadmap.md`:

1. Is this feature listed in **MVP Features**? → Proceed.
2. Is this feature listed in **Out of Scope**? → Stop. Notify the user: "This appears to be out of scope per the roadmap: [quote the out-of-scope item]. Confirm you want to proceed before I implement it."
3. Is this feature absent from both lists? → Pause. Ask: "This feature isn't in the roadmap. Should I add it to the MVP list, defer it to a future phase, or mark it out of scope before proceeding?"

## During Sprint Execution

- If a PR or implementation would add functionality beyond the approved sprint issues, flag it before proceeding.
- Scope additions mid-sprint require explicit human confirmation. Do not silently expand scope.

## The Scope Conversation

When flagging scope, be specific — quote the roadmap, name the out-of-scope item, explain the conflict. Don't block silently; give the user a clear path to proceed (confirm in scope, add to roadmap, or defer).
