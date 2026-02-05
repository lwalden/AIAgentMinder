# DECISIONS.md - Architectural Decision Record

> **Purpose:** Track architectural and design decisions to avoid re-debating across sessions.
> **Format:** Each decision has context, options considered, decision made, and rationale.

---

## How to Use This File

When a significant decision is made during development, add it here with:
1. **Context** - What problem/question arose
2. **Options** - What alternatives were considered
3. **Decision** - What was chosen
4. **Rationale** - Why this choice was made
5. **Date** - When the decision was made

**When to create an ADR:**
- Technology/framework choices
- Database schema design decisions
- API design patterns
- Authentication/authorization approaches
- Deployment strategies
- Third-party service selections
- Significant refactoring decisions

---

## Decisions

### ADR-001: [Decision Title]
**Date:** [DATE]
**Status:** Decided | Pending | Superseded by ADR-XXX

**Context:** 
[What problem or question arose that required a decision]

**Options Considered:**
1. [Option 1] - [Brief description]
2. [Option 2] - [Brief description]
3. [Option 3] - [Brief description]

**Decision:** 
[What was chosen]

**Rationale:**
- [Reason 1]
- [Reason 2]
- [Reason 3]

**Consequences:**
- [What this decision enables]
- [What this decision constrains]
- [Any follow-up actions needed]

**Implementation Notes:**
[Any specific implementation details or gotchas]

---

### ADR-002: Git Workflow
**Date:** [DATE]
**Status:** Decided

**Context:** 
Establishing how code changes flow from development to production.

**Decision:**
- **Branch Strategy:** Feature branches off main
- **Branch Naming:** `feature/short-description`, `fix/short-description`, `chore/short-description`
- **PR Policy:** All changes via PR, human merges after review
- **Commit Style:** [Conventional commits / Descriptive / Other]

**Rationale:**
- Feature branches isolate work in progress
- PR reviews ensure code quality
- Human merge control prevents accidental deployments

---

### ADR-003: [Your Next Decision]
**Date:** [DATE]
**Status:** [Status]

**Context:** 
[Description]

**Decision:**
[What was decided]

**Rationale:**
[Why]

---

## Pending Decisions

*Decisions that need to be made but haven't been finalized yet:*

### PDR-001: [Pending Decision Title]
**Date Added:** [DATE]
**Context:** [What needs to be decided]

**Options to Consider:**
1. [Option 1]
2. [Option 2]

**Considerations:**
- [Factor 1]
- [Factor 2]

**Blocking:** [What is blocked by this decision, if anything]

**Action Required:** [Who needs to decide / what information is needed]

---

### PDR-002: [Another Pending Decision]
**Date Added:** [DATE]
**Context:** [What needs to be decided]

**Status:** Awaiting [information / user input / research]

---

## Decision Templates

### Quick Decision (ADR)
```markdown
### ADR-XXX: [Title]
**Date:** [DATE]
**Status:** Decided

**Context:** [Problem/question]

**Decision:** [What was chosen]

**Rationale:** [Why]
```

### Detailed Decision (ADR)
```markdown
### ADR-XXX: [Title]
**Date:** [DATE]
**Status:** Decided | Pending | Superseded by ADR-XXX

**Context:** 
[Detailed problem description]

**Options Considered:**
1. **[Option 1]** - [Description]
   - Pros: [...]
   - Cons: [...]
2. **[Option 2]** - [Description]
   - Pros: [...]
   - Cons: [...]

**Decision:** 
[What was chosen and any specifics]

**Rationale:**
- [Reason 1]
- [Reason 2]

**Consequences:**
- Positive: [...]
- Negative: [...]
- Neutral: [...]

**Implementation Notes:**
[Specifics, gotchas, references]
```

### Pending Decision (PDR)
```markdown
### PDR-XXX: [Title]
**Date Added:** [DATE]
**Context:** [What needs to be decided]

**Options to Consider:**
1. [Option]
2. [Option]

**Considerations:**
- [Factor]

**Blocking:** [What this blocks]
**Action Required:** [What's needed to decide]
```

---

## Superseded Decisions

*When a decision is changed, move the old ADR here and link to the new one:*

<!-- Example:
### ADR-001: Original Database Choice (Superseded by ADR-010)
**Original Date:** 2024-01-01
**Superseded Date:** 2024-06-01

[Original decision content preserved for history]

**Why Superseded:** [Brief explanation of what changed]
-->

---

*This file should be updated whenever significant architectural or design decisions are made.*
