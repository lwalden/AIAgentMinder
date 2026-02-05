# Strategy Roadmap Creation Prompt

**Copy everything below the line and paste it into your Claude conversation when you're ready to formalize your project idea into a strategy document.**

---

I'm ready to turn this project idea into a formal development plan. I've attached the project template files that will be used alongside the strategy document when building this with Claude Code in VS Code.

Please help me create a comprehensive `strategy-roadmap.md` file by:

1. **Asking me questions** to fill in any gaps in my description so far. Don't assume - ask. I'd rather answer questions now than have gaps later.

2. **Creating a document that Claude Code can use** to build this project semi-autonomously. The document needs to be detailed enough that Claude Code understands the "why" behind decisions, not just the "what."

3. **Marking unknowns as TODOs** using this format:
   ```markdown
   <!-- TODO: [What needs to be decided]
        WHEN: [When this needs resolution]
        BLOCKER: [What this blocks]
        OPTIONS: [Known options, if any]
   -->
   ```
   It's okay if we don't have all the answers - just mark them clearly so Claude Code can prompt me at the right time.

4. **Including testable acceptance criteria** for every feature. When Claude Code submits PRs, it will use these as test bullet points for me to verify the changes work.

5. **Listing all human actions required** (account signups, API keys, decisions, etc.) with timing so I know what I need to do and when.

Please start by asking your clarifying questions. Group them logically and I'll answer them. Once you have enough information, generate the complete `strategy-roadmap.md` document.

The attached files show:
- `CLAUDE.md` - How Claude Code will work on this project
- `PROGRESS.md` - How session continuity is tracked
- `DECISIONS.md` - How architectural decisions are logged
- `STRATEGY-GUIDE.md` - Your instructions for creating this document
- `strategy-roadmap.md` - The template structure to follow
