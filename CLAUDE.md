# CLAUDE.md - Project Development Orchestration

> **Purpose:** This file instructs Claude Code on how to work on this project.
> Claude should read this file first when starting work on the repository.

## Reference Documents

- **Strategy & Roadmap:** See `/docs/strategy-roadmap.md` for full business context, goals, and technical architecture decisions.
- **Progress Tracking:** See `/PROGRESS.md` for current development state and session continuity
- **Decision Log:** See `/DECISIONS.md` for architectural decisions made

---

## Session Resume Protocol

**IMPORTANT: At the start of EVERY new session, follow these steps:**

1. **Read `/PROGRESS.md` first** - This tells you current phase, completed tasks, blockers, and what to do next
2. **Check `/DECISIONS.md`** - Review any architectural decisions so you don't re-ask resolved questions
3. **Run `git status`** - Check for any uncommitted work from previous sessions
4. **Run `gh pr list`** - Check for any open PRs awaiting review
5. **Check the "Blocked / Awaiting Human Action" section** - Ask the user about any items pending their input
6. **Resume from "Next Session Should" in PROGRESS.md**

**At the END of every session:**
1. Update `/PROGRESS.md` with:
   - Any completed tasks (add to Completed Tasks table)
   - Any new blockers (add to Blocked section)
   - What the next session should focus on
   - A brief session summary
2. Update `/DECISIONS.md` if any architectural decisions were made
3. Commit progress tracking changes if meaningful work was done

**When resuming and the user says "continue where we left off":**
- Read PROGRESS.md
- Summarize the current state briefly
- Ask about any blocked items
- Propose next steps based on "Next Session Should"

**Mid-Session Token Cap Handling:**

Sessions may end unexpectedly when Claude Pro token limits are reached. To minimize lost work:

1. **Write code to files immediately** - Don't accumulate large changes in memory; write each file as it's completed
2. **Commit at natural checkpoints:**
   - After solution/project compiles successfully
   - After tests pass
   - After completing a logical unit of work (one task/feature)
3. **Update PROGRESS.md before multi-step operations** - If starting a complex task, note what you're about to do
4. **Prefer smaller, frequent commits** over one large commit at the end

**If session ends mid-task:**
- Files already written to disk are preserved
- Uncommitted changes in staged files are preserved
- Conversation context is NOT preserved (but can be scrolled back in the UI)
- Next session: run `git status` and `git diff` to see partial work, then continue

---

## Project Overview

<!-- CUSTOMIZE: Update this section for your specific project -->

**Project Name:** [Your Project Name]
**Description:** [Brief description of what the project does]

**Human Developer Profile:**
<!-- CUSTOMIZE: Adjust these to match your own profile -->
- [Your experience level and tech expertise]
- [Your availability constraints]
- [Your collaboration preferences]
- [Any specific tools or workflows you prefer]

**Communication Preferences:**
- Provide TL;DR summary first, then detailed explanation
- Assume always available when working (no need to batch questions)
- [Risk tolerance: conservative / medium / aggressive]

---

## Your Capabilities & Boundaries

### You CAN:
- Create files and directory structures
- Search the internet for documentation, APIs, tutorials
- Install packages (npm, NuGet, pip, cargo, etc.)
- Run global installs for tools needed on the development machine
- Use CLI and bash commands
- Create branches and pull requests in GitHub
- Create sub-agents to parallelize work
- Scaffold code, write implementations, create tests
- Run tests and fix failing tests
- Manage dependencies and package versions

### You SHOULD ASK the human to:
- Create new GitHub repositories
- Merge pull requests
- Sign up for external services (cloud providers, APIs, etc.)
- Provide API keys and credentials
- Make billing/payment decisions
- Approve major architectural changes
- Review and approve PRs before merge
- Make decisions about licensing or legal matters

### Credential Handling:
- NEVER store credentials in code files
- Use environment variables, .env files, or secret managers
- When you need a credential, ask: "Please provide your [SERVICE] API key. I'll store it in .env (gitignored) for local development."
- Create `.env.example` files showing required variables WITHOUT values

### Git Workflow:
- **NEVER commit directly to main** - Always use feature branches
- Branch naming: `feature/short-description` or `fix/short-description`
- Claude CAN: create branches, commit, push to remote, open PRs via `gh pr create`
- Claude CANNOT: merge PRs to main (user does this manually)
- After user merges PR: switch back to main, pull, then start next feature branch

**Typical flow:**
```bash
git checkout -b feature/my-feature
# ... make changes, commit frequently ...
git push -u origin feature/my-feature
gh pr create --title "Add my feature" --body "..."
# Wait for user to review and merge
# User says "merged" → git checkout main && git pull
```

### Pull Request Format:
- PRs should include:
  - Clear title describing the change
  - Summary of what was changed and why
  - Test plan (manual testing steps or automated test references)
  - Any follow-up items or known limitations
- Keep PRs reasonably sized - prefer multiple smaller PRs over one massive PR
- After PR is merged, update PROGRESS.md with completed task

### Test Plan Format:
```markdown
## Test Plan
- [ ] Step 1: Description of what to test
- [ ] Step 2: Expected outcome
- [ ] Verify: Specific verification steps

**Prerequisites:** What needs to be set up before testing
**Environment:** Local / Staging / Production
```

---

## Technology Stack

<!-- CUSTOMIZE: Replace with your actual technology stack -->

```
Backend:        [Language / Framework]
Database:       [Database technology]
Cache:          [Cache solution if any]
Frontend:       [Frontend framework if any]
Infrastructure: [Cloud provider / deployment]
Testing:        [Test framework]
CI/CD:          [CI/CD solution]
```

---

## Project Structure

<!-- CUSTOMIZE: Replace with your actual project structure -->

```
/project-root
├── /src                    # Source code
│   ├── /main              # Main application code
│   └── /lib               # Shared libraries
├── /tests                  # Test files
├── /docs                   # Documentation
│   └── strategy-roadmap.md
├── /infrastructure         # IaC templates (if applicable)
├── .env.example           # Environment variable template
├── .gitignore
├── CLAUDE.md              # This file
├── PROGRESS.md            # Session continuity tracking
├── DECISIONS.md           # Architectural decisions
└── README.md
```

---

## Development Phases

<!-- CUSTOMIZE: Define your project phases -->

### PHASE 1: Foundation
**Goal:** [What this phase accomplishes]
**Duration:** [Estimated time]

### PHASE 2: Core Features
**Goal:** [What this phase accomplishes]
**Duration:** [Estimated time]

### PHASE 3: Polish & Launch
**Goal:** [What this phase accomplishes]
**Duration:** [Estimated time]

---

## Phase 1 Detailed Tasks

<!-- CUSTOMIZE: Replace with your actual Phase 1 tasks -->

### Week 1: Project Setup

#### Task 1.1: Repository Initialization
```
STATUS: NOT STARTED
REQUIRES HUMAN: No

Execute:
- Initialize project with appropriate tooling
- Set up directory structure
- Configure linting and formatting
```

#### Task 1.2: Development Environment
```
STATUS: NOT STARTED
REQUIRES HUMAN: Maybe - for external service signups

Steps:
- Set up local development environment
- Create .env.example with required variables
- Document setup steps in README
```

#### Task 1.3: External Services Setup
```
STATUS: NOT STARTED
REQUIRES HUMAN: Yes - account creation and credentials

PROMPT TO HUMAN:
"Please set up [SERVICE] account:
1. Go to [URL]
2. Sign up for an account
3. [Additional steps]
4. Provide me with [specific credentials needed]"
```

---

## Sub-Agent Delegation

When appropriate, you may spawn sub-agents to parallelize work. Use this format:

```
SPAWN SUB-AGENT: [Name]
TASK: [Specific task description]
CONSTRAINTS: [Any limitations]
REPORT BACK: [What information to return]
```

**Appropriate sub-agent tasks:**
- Research specific API documentation
- Generate test data/mock responses
- Create unit tests for completed code
- Generate types from schemas
- Research competitor implementations
- Refactor or optimize specific modules

**NOT appropriate for sub-agents:**
- Decisions requiring human approval
- Tasks involving credentials
- Major architectural changes

---

## Checkpoint Protocol

After completing each major task, create a checkpoint:

```
CHECKPOINT: [Task Name]
STATUS: COMPLETE | IN_PROGRESS | BLOCKED
FILES CREATED/MODIFIED: [List]
NEXT STEPS: [What comes next]
BLOCKERS: [Any issues requiring human input]
```

---

## Communication Style

When working with the human:

1. **Be proactive about dependencies:**
   - "Before I can implement X, we need Y. Would you like me to proceed with Y first?"

2. **Explain decisions:**
   - "I'm using [technology] because [reason that benefits the project]."

3. **Offer alternatives:**
   - "I can implement this with either approach A or B. A is simpler but B scales better. Which would you prefer?"

4. **Flag risks early:**
   - "Note: This approach has [limitation]. We should monitor this and adjust when [condition]."

5. **Celebrate progress:**
   - "✅ [Feature] is now working! Try it out: [how to verify]"

---

## Quick Reference: External Services Needed

<!-- CUSTOMIZE: List services your project needs -->

| Service | Purpose | Free Tier | When Needed |
|---------|---------|-----------|-------------|
| [Service 1] | [Purpose] | [Yes/No] | [Phase/Week] |
| [Service 2] | [Purpose] | [Yes/No] | [Phase/Week] |

---

## Error Recovery

If you encounter errors:

1. **Build errors:** Check package versions, ensure all dependencies installed
2. **Runtime errors:** Check environment variables and configuration
3. **API errors:** Verify API keys, check rate limits
4. **Test failures:** Read error messages carefully, check test data

If stuck, ask the human for help with:
- "I'm encountering [error]. I've tried [solutions]. Could you check [specific thing]?"

---

## Success Criteria

<!-- CUSTOMIZE: Define success criteria for each phase -->

**Phase 1 Complete When:**
- [ ] Project builds without errors
- [ ] Development environment documented
- [ ] Core structure in place
- [ ] Basic tests passing

**Phase 2 Complete When:**
- [ ] Core features implemented
- [ ] Integration tests passing
- [ ] Documentation updated

**Phase 3 Complete When:**
- [ ] All features complete
- [ ] Performance acceptable
- [ ] Ready for deployment/release

---

*This document should be updated as the project progresses.*
*Last updated: [Date]*
