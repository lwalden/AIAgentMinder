# PROGRESS.md - Development Progress Tracker

> **This file is the source of truth for session continuity.**
> Claude should read this file at the start of every session to understand current state.

---

## Current State

**Phase:** 1 - Foundation
**Week:** 1
**Last Updated:** [DATE]
**Last Session Focus:** [Brief description]

---

## Session Resume Checklist

When starting a new session, Claude should:
1. Read this PROGRESS.md file first
2. Check DECISIONS.md for any architectural decisions
3. Review any open PRs with `gh pr list`
4. Check git status for any uncommitted work
5. Resume from the "Next Session Should" section below

---

## Completed Tasks

| Task | Date | Notes |
|------|------|-------|
| Created repository | [DATE] | Initial setup |
| Added CLAUDE.md | [DATE] | Development orchestration instructions |
| Added docs/strategy-roadmap.md | [DATE] | Business context and technical roadmap |
| Session continuity setup | [DATE] | Added PROGRESS.md, DECISIONS.md |

---

## In Progress

| Task | Status | Notes |
|------|--------|-------|
| [Task description] | [Percentage or status] | [Notes] |

---

## Blocked / Awaiting Human Action

| Item | What's Needed | Date Added |
|------|---------------|------------|
| [Item description] | [What the human needs to do] | [DATE] |

---

## Next Session Should

1. **[Priority 1]** - [Description of what to do first]
2. **[Priority 2]** - [Description of what to do next]
3. **[Priority 3]** - [Description of lower priority item]
4. **Reminder:** [Any important reminders or deadlines]

---

## Phase Task Status

### Phase 1: Foundation

#### Week 1: Project Setup
- [ ] **Task 1.1:** [Task description]
- [ ] **Task 1.2:** [Task description]
- [ ] **Task 1.3:** [Task description]

#### Week 2: [Focus Area]
- [ ] **Task 2.1:** [Task description]
- [ ] **Task 2.2:** [Task description]

### Phase 2: Core Features
*To be detailed when Phase 1 completes*

### Phase 3: Polish & Launch
*To be detailed when Phase 2 completes*

---

## Environment & Resources

<!-- Document any resources created or configured -->

### Development Environment
| Resource | Name/Location | Status |
|----------|---------------|--------|
| Repository | [URL] | Active |
| [Resource type] | [Name] | [Status] |

### External Services
| Service | Account/Status | Notes |
|---------|----------------|-------|
| [Service name] | [Configured/Pending] | [Notes] |

**Credentials stored in `.env` (gitignored)**

---

## Recurring Tasks

| Task | Frequency | Owner | Notes |
|------|-----------|-------|-------|
| Dependency security scan | Monthly | Claude | Run vulnerability check |
| Review progress | Weekly | Human | Sync on priorities |
| Backup verification | Monthly | Human | Verify backups working |

---

## Notes for Future Sessions

*Add any context that would be helpful for future sessions:*

- [Note about human developer preferences]
- [Note about project constraints]
- [Note about workflow preferences]
- [Note about technical decisions pending]

---

## Recent Session Summaries

### Session: [DATE] (Session N)
**Focus:** [What was worked on]
**What happened:**
- [Bullet point summary of actions taken]
- [What was created/modified]
- [Any issues encountered]

**Outcome:** [Brief summary of result]

---

### Session: [DATE] (Session N-1)
**Focus:** [What was worked on]
**What happened:**
- [Bullet point summary]

**Outcome:** [Brief summary of result]

---

### Session Template (Copy for new sessions)
```markdown
### Session: [DATE] (Session N)
**Focus:** [What was worked on]
**What happened:**
- 

**Outcome:** 
```

---

*This file should be updated at the end of every development session.*
