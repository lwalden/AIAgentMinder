# /aam-revise - Revise the Plan

You are helping the user revise their project plan (`docs/strategy-roadmap.md`) based on new information, research findings, or changed requirements. This is the "product owner feedback point" — the user brings updates, and you synthesize them directly into the planning documents.

Unlike `/aam-brief` (which creates the plan from scratch), `/aam-revise` modifies an existing plan. It is lightweight and conversational — not a multi-round interview.

---

## Before Starting

Read these files to understand the current plan:

1. `docs/strategy-roadmap.md` — the living plan
2. `DECISIONS.md` — architectural decisions and known debt
3. `SPRINT.md` (if it exists) — active sprint state

If `docs/strategy-roadmap.md` doesn't exist or is still placeholder, tell the user: "No roadmap found. Run `/aam-brief` first to create your project plan."

---

## Determine the Revision Type

The user's input will fall into one or more of these categories. Identify which apply and handle each:

### A) Research Findings

The user has done research (competitor analysis, technical spike, user feedback, a document with recommendations) and wants the results folded into the plan.

**How to handle:**
1. Read any document or input the user provides.
2. Identify which findings affect the roadmap: new features, changed features, dropped features, new technical constraints, new decisions.
3. For each actionable finding, apply the appropriate action below (B, C, D, or E).
4. Summarize what changed and what was left as-is (not every research finding requires a plan change).

### B) New Requirement

The user wants to add a feature or requirement that isn't in the plan.

**How to handle:**
1. Determine the right phase placement — ask if unclear: "This sounds like it belongs in Phase [N]. Does that match your thinking, or should it go elsewhere?"
2. Add the feature to the appropriate phase in `docs/strategy-roadmap.md` with acceptance criteria (match the existing format).
3. If the feature displaces something or changes scope significantly, note what shifted.
4. Log the addition in `DECISIONS.md`: what was added, why, and what phase it targets.

### C) Changed Requirement

The user wants to modify an existing feature or requirement.

**How to handle:**
1. Find the existing entry in `docs/strategy-roadmap.md`.
2. Update it with the new details. Preserve the acceptance criteria format — update criteria if the change affects them.
3. If the change is significant (not just a wording tweak), log it in `DECISIONS.md`: what changed, why, and what the old version was.

### D) Dropped Requirement

The user wants to remove a feature or mark it out of scope.

**How to handle:**
1. Remove the feature from its current phase in `docs/strategy-roadmap.md`.
2. Add it to the **Out of Scope** section with a brief rationale: `- [Feature] — Dropped: [reason]`
3. Log the removal in `DECISIONS.md`: what was dropped, why, and what alternatives were considered (if any).

### E) Reprioritization

The user wants to move features between phases or reorder priorities within a phase.

**How to handle:**
1. Move the feature(s) to the requested phase in `docs/strategy-roadmap.md`.
2. If a phase now has too many or too few features, flag it: "Phase [N] now has [count] features — [observation about scope]."
3. Log significant moves in `DECISIONS.md` (moving something from Phase 1 to Phase 3 is significant; reordering within a phase is not).

---

## Sprint Impact Check

After making changes, check whether the revision affects the active sprint:

1. Read `SPRINT.md`. If no active sprint (`**Status:** in-progress`), skip this section.
2. Compare the changes against the approved sprint issues:
   - **No impact:** The revision affects a different phase or deferred work. Say: "Active sprint is not affected."
   - **Indirect impact:** The revision changes context for a sprint issue but doesn't invalidate it. Say: "Sprint issue S[n]-[seq] ([title]) may be affected — [brief explanation]. No action needed now, but keep it in mind."
   - **Direct impact:** The revision adds, removes, or fundamentally changes a sprint issue. Say: "⚠ Sprint impact: [description]. Options: (1) continue the current sprint as-is and apply changes in the next sprint, (2) modify the active sprint to reflect the change. Which do you prefer?"

Do not modify `SPRINT.md` without explicit user confirmation.

---

## Update the Roadmap History

Append an entry to the `## Roadmap History` table in `docs/strategy-roadmap.md` for each significant change made this revision:

```
| [DATE] | [Added / Changed / Dropped / Moved]: [feature or requirement] | [brief reason] |
```

Only log changes that affect scope, phase placement, or acceptance criteria. Wording tweaks do not need an entry.

If the `## Roadmap History` section doesn't exist in the file (pre-v1.3 roadmap), add it before the footer line.

## Update the Roadmap Footer

Update the footer of `docs/strategy-roadmap.md`:

```
*Generated by /aam-brief | Last revised by /aam-revise [DATE]*
```

---

## Print the Summary

After all changes are applied:

```
Plan revised.

Changes:
- [Added / Changed / Dropped / Moved]: [feature or requirement] — [brief detail]
- [repeat for each change]

Decisions logged:
- [decision summary, or "None"]

Sprint impact:
- [impact summary, or "No active sprint" / "Active sprint not affected"]

Roadmap updated: docs/strategy-roadmap.md
```

Keep the summary concise. The user can read the diff for details.
