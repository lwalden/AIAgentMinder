---
description: Scope governance — check new work against the roadmap before implementing
---

# Scope Guardian
# AIAgentMinder-managed. Delete this file to opt out of scope governance.

## Before Implementing Any New Feature

Before writing code for a feature, check `ROADMAP.md` (this repo uses ROADMAP.md directly rather than docs/strategy-roadmap.md):

1. Is this feature listed in the current version milestone or backlog? → Proceed.
2. Is this feature absent from the roadmap? → Pause. Ask: "This feature isn't in the roadmap or backlog. Should I add it to the backlog, defer it, or mark it out of scope before proceeding?"

## During Development

- If an implementation would add functionality beyond what was requested, flag it before proceeding.
- Scope additions require explicit human confirmation. Do not silently expand scope.

## The Scope Conversation

When flagging scope, be specific — quote the roadmap, name the item, explain the conflict. Give the user a clear path to proceed (confirm in scope, add to backlog, or defer).
