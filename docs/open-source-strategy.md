# Open Source Strategy: Visibility, Protection & Adoption

**Date:** 2026-03-31
**Context:** First public open source project. MIT license. No existing community. 9 known installations.

---

## Competitive Protection (Honest Assessment)

### What Can Be Copied

Individual artifacts are trivially copyable: rules files, fitness function defaults, skill prompts, even the sprint state machine as a markdown document. MIT license means anyone can take anything.

### What's Genuinely Hard to Copy

The **integrated system** — 14 skills + 10 agents + 11 scripts + 5 hooks + migration registry + deterministic sync + fingerprinting, all tested together across 9+ real projects over months of iteration. DECISIONS.md alone contains battle-tested architectural reasoning that took real production failures to learn (LLM amnesia, smoke test illusion, happy-path bias). Someone copying `sprint-workflow.md` without understanding *why* the stop guard exists, or *why* context cycling thresholds are set where they are, will ship a worse version.

### The Real Dynamics

1. **A bigger project absorbs your best ideas without credit.** Cursor could add a sprint state machine tomorrow. Claude Code itself could ship governance features natively. This can't be prevented — but being the known originator has career value even if the repo doesn't become huge. Being the person Anthropic hires or consults when they decide to build it is a viable outcome.

2. **Someone forks and out-markets you.** The actual risk with MIT. But forks that outgrow the original are extremely rare — they require the forker to be better at maintaining it, which means maintenance wasn't happening well enough anyway.

3. **Nobody copies it because nobody notices.** This is the *much more likely* scenario and the one to actually plan for.

### License Decision

MIT is correct. The governance framework space is too early and too niche for licensing to matter. Going proprietary would mean zero adoption instead of some adoption. The value of *any* users providing feedback and validating the approach far outweighs the risk of copying. Every successful open source project in this space (Aider, Cline, Backstage) is MIT or Apache 2.0.

---

## Visibility Playbook

### Tier 1: Do This Week (Zero Code)

- [ ] **Submit to buildwithclaude** — PR to [davepoon/buildwithclaude](https://github.com/davepoon/buildwithclaude) (2,663 stars, 95+ marketplaces). The primary Claude Code discovery hub.
- [ ] **Submit to awesome-claude-code-toolkit** — PR to [rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) (961 stars, #1 trending Feb 2026).
- [ ] **Rewrite README opening to sell the problem, not the tool.** Current README describes what AAM does. Rewrite the opening to describe the *pain*: "Claude Code ignores your instructions mid-sprint. Tests pass but the product is broken. Context degrades after 3 items and quality tanks." Developers click on problems they recognize, not feature lists.
- [ ] **Add a demo GIF or video** — 30-second recording of a governed sprint in action. Single highest-impact README change for any CLI tool.

### Tier 2: Do This Month (Content)

Write 2-3 posts on dev.to or Medium. Not "I built a tool" posts — those get ignored. Instead:

- [ ] **"Why AI coding agents ignore your instructions (and what to do about it)"** — The LLM amnesia insight from spike-v4-research.md. This is genuinely original thinking. Lead with the insight, mention AAM as the solution at the end.
- [ ] **"I ran 50+ autonomous coding sprints. Here's what breaks after item 3."** — The context degradation story. Data-driven, real experience.
- [ ] **"The case for mechanical enforcement over better prompts"** — The core architectural thesis. Publishable and nobody else is saying it.

Additional channels:
- [ ] **Post in Claude Code Discord/community.** Be helpful first, mention AAM when relevant.
- [ ] **Comment thoughtfully on Hacker News threads about AI coding tools.** Don't spam links. Add genuine insight from experience, with a "I built a governance framework that addresses this" mention. HN is where developer tool adoption starts.

### Tier 3: Do Over Time (Network Effects)

- [ ] **Make the first 5 minutes frictionless.** `npx aiagentminder init` is good, but what happens next? If a new user has to read 10 files to understand the system, they'll bounce. Consider a `--quickstart` mode that installs core governance + runs a mini guided sprint on their existing project. Time-to-value is everything.
- [ ] **Collect and publish results.** "Projects using AAM governance had X% fewer post-merge defects" is the kind of claim that gets shared. Even anecdotal data from existing installations helps.
- [ ] **Contribute to AGENTS.md spec discussions.** Real experience governing AI agents is valuable. The Linux Foundation AAIF is actively shaping standards. Being a known voice in that conversation raises both personal profile and AAM's.
- [ ] **Find 3-5 early adopters who aren't you.** Reach out to solo developers who blog about Claude Code workflows. Offer to set them up personally. Their testimonials and blog posts are worth more than any self-marketing.

---

## Monetization Assessment

### Not Viable Now

- Charging for the framework itself — nobody pays for governance templates
- SaaS wrapping — adds complexity without clear value over local

### Potentially Viable Later (If Adoption Grows)

| Model | Description | Precedent |
|---|---|---|
| **Managed sprint dashboards** | Web UI that visualizes sprint metrics, context cycling data, defect escape rates, review findings across projects. Free tool generates data, paid dashboard visualizes it. | Grafana model |
| **Team/org governance policies** | Enterprise features: centralized rule management, compliance reporting, audit trails across repos. | Backstage model |
| **Consulting/implementation** | "I'll set up AI agent governance for your team." Expertise is the product, AAM is the credibility. | Viable today if wanted |
| **Anthropic partnership** | If AAM gains adoption, Anthropic might want to feature, integrate, or acquire. | Aider / Continue.dev path |

### Recommendation

Keep MIT. Don't think about monetization yet. The valuable thing right now is *being known as the person who figured out AI agent governance*. That has career value regardless of what happens to the repo. Write the blog posts, build the reputation, let the monetization question answer itself once there are users.

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Nobody notices | **High** | High | Content marketing, directory listings, community participation |
| Someone copies features | Medium | Low | Stay ahead on iteration speed, publish insights first |
| Big player absorbs ideas | Medium | Medium | Be the known originator, build relationship with Anthropic |
| Claude Code ships governance natively | Low-Medium | High | Position as reference implementation, contribute to their design |
| Fork outgrows original | Very Low | High | Maintain well, be responsive to users |

The biggest risk by far is #1. Everything else is a good problem to have — it means people care about what was built.

---

## Key Insight

The moat isn't the code — it's the *accumulated knowledge* of what breaks when AI agents run autonomous sprints and how to fix it mechanically. Publishing that knowledge (blog posts, conference talks, spec contributions) builds a reputation moat that's harder to copy than any MIT-licensed codebase.
