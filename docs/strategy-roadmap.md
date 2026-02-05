# [Project Name]: Strategy & Technical Roadmap

> **Purpose:** This document provides business context, goals, and technical architecture for the project.
> Claude should reference this document to understand the "why" behind development decisions.

---

## Executive Summary

**Project Vision:** 
[One-paragraph description of what this project aims to achieve]

**Key Differentiators:**
1. [What makes this unique vs alternatives]
2. [Second differentiator]
3. [Third differentiator]

**Target Outcomes:**
<!-- CUSTOMIZE: Define your success metrics -->
- [Metric 1]: [Target value] by [timeframe]
- [Metric 2]: [Target value] by [timeframe]
- [Exit/Success criteria if applicable]

---

## Part 1: Product/Project Strategy

### 1.1 Problem Statement

**The Problem:**
[What problem does this solve? Who has this problem?]

**Current Solutions & Their Gaps:**

| Current Approach | Limitation | How We're Better |
|------------------|------------|------------------|
| [Alternative 1] | [Gap] | [Our advantage] |
| [Alternative 2] | [Gap] | [Our advantage] |

### 1.2 Target Users

**Primary Users:**
- [User persona 1]: [Brief description]
- [User persona 2]: [Brief description]

**User Needs:**
1. [Need 1] - [How we address it]
2. [Need 2] - [How we address it]
3. [Need 3] - [How we address it]

### 1.3 Core Feature Set

**MVP Features (Phase 1):**
1. ✅ [Feature 1] - [Brief description]
2. ✅ [Feature 2] - [Brief description]
3. ✅ [Feature 3] - [Brief description]

**Phase 2 Features:**
1. 🔄 [Feature 1] - [Brief description]
2. 🔄 [Feature 2] - [Brief description]

**Phase 3 Features:**
1. 📊 [Feature 1] - [Brief description]
2. 📊 [Feature 2] - [Brief description]

**Future Considerations:**
- [Feature idea for later evaluation]
- [Feature idea for later evaluation]

### 1.4 Success Metrics

| Metric | Current | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|---------|----------------|----------------|----------------|
| [Metric 1] | [Baseline] | [Target] | [Target] | [Target] |
| [Metric 2] | [Baseline] | [Target] | [Target] | [Target] |

---

## Part 2: Technical Architecture

### 2.1 System Overview

<!-- CUSTOMIZE: Create an architecture diagram appropriate to your project -->

```
┌─────────────────────────────────────────────────────────────────┐
│                      [TOP LAYER NAME]                           │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   [Component 1] │  [Component 2]  │      [Component 3]          │
└────────┬────────┴────────┬────────┴────────────┬────────────────┘
         │                 │                     │
         ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    [MIDDLE LAYER NAME]                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ [Service 1]     │ [Service 2]     │ [Service 3]                 │
└────────┬────────┴────────┬────────┴────────────┬────────────────┘
         │                 │                     │
         ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      [DATA LAYER NAME]                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   [Storage 1]   │   [Storage 2]   │   [External APIs]           │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 2.2 Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| [Layer/Component] | [Technology] | [Why this choice] |
| Backend | [Language/Framework] | [Rationale] |
| Database | [Database] | [Rationale] |
| Caching | [Cache solution] | [Rationale] |
| Frontend | [Framework] | [Rationale] |
| Hosting | [Platform] | [Rationale] |

### 2.3 Data Models

<!-- CUSTOMIZE: Define your core data models -->

**Entity: [Primary Entity]**
```json
{
  "id": "unique-identifier",
  "field1": "value",
  "field2": 123,
  "relatedEntities": [],
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Entity: [Secondary Entity]**
```json
{
  "id": "unique-identifier",
  "parentId": "reference-to-parent",
  "data": {}
}
```

### 2.4 API Design

<!-- CUSTOMIZE: Define your API structure -->

**API Endpoints (REST/GraphQL):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/[resource] | List all [resources] |
| GET | /api/v1/[resource]/:id | Get single [resource] |
| POST | /api/v1/[resource] | Create [resource] |
| PUT | /api/v1/[resource]/:id | Update [resource] |
| DELETE | /api/v1/[resource]/:id | Delete [resource] |

### 2.5 Security Considerations

**Authentication:**
- [Method: JWT / OAuth / API Keys / etc.]
- [Storage approach]

**Authorization:**
- [Role-based / Attribute-based / etc.]
- [Permission model]

**Data Protection:**
- [Encryption at rest]
- [Encryption in transit]
- [PII handling]

---

## Part 3: Risk Management

### 3.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | Low/Med/High | Low/Med/High/Critical | [Mitigation strategy] |
| [Risk 2] | [L/M/H] | [L/M/H/C] | [Strategy] |
| [Risk 3] | [L/M/H] | [L/M/H/C] | [Strategy] |

### 3.2 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Service downtime | Medium | High | Monitoring, alerting, redundancy |
| Data loss | Low | Critical | Backups, replication, recovery procedures |
| [Custom risk] | [L/M/H] | [L/M/H/C] | [Strategy] |

### 3.3 Business/External Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Dependency on external service] | [L/M/H] | [L/M/H/C] | [Strategy] |
| [Competitive risk] | [L/M/H] | [L/M/H/C] | [Strategy] |
| [Regulatory risk] | [L/M/H] | [L/M/H/C] | [Strategy] |

### 3.4 Technical Debt Checkpoints

- **End of Phase 1:** Review shortcuts, refactor critical paths
- **End of Phase 2:** Performance testing, security review
- **Quarterly:** Dependency updates, vulnerability scanning

---

## Part 4: Development Timeline & Costs

### 4.1 Phase 1: Foundation

**Duration:** [X weeks/months]

| Week/Sprint | Focus | Deliverables |
|-------------|-------|--------------|
| 1 | Setup | Project structure, environment config |
| 2 | Core | [Core functionality] |
| 3 | [Focus] | [Deliverables] |
| 4 | [Focus] | [Deliverables] |

**Estimated Costs - Phase 1:**
| Item | Cost |
|------|------|
| [Service 1] | $X/month |
| [Service 2] | $X/month |
| **Total** | **$X/month** |

### 4.2 Phase 2: Core Features

**Duration:** [X weeks/months]

| Week/Sprint | Focus | Deliverables |
|-------------|-------|--------------|
| [N] | [Focus] | [Deliverables] |

**Estimated Costs - Phase 2:**
| Item | Cost |
|------|------|
| [Service costs] | $X/month |
| **Total** | **$X/month** |

### 4.3 Phase 3: Polish & Launch

**Duration:** [X weeks/months]

| Week/Sprint | Focus | Deliverables |
|-------------|-------|--------------|
| [N] | [Focus] | [Deliverables] |

**Estimated Costs - Phase 3:**
| Item | Cost |
|------|------|
| [Service costs] | $X/month |
| **Total** | **$X/month** |

### 4.4 Cost Summary

| Period | Avg Monthly Cost | Cumulative |
|--------|------------------|------------|
| Phase 1 | $X | $X |
| Phase 2 | $X | $X |
| Phase 3 | $X | $X |

**One-Time Costs:**
- [Item 1]: $X
- [Item 2]: $X

---

## Part 5: Launch Strategy

### 5.1 Pre-Launch Checklist

- [ ] All MVP features complete and tested
- [ ] Security review completed
- [ ] Documentation complete
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery tested
- [ ] [Legal/compliance items if applicable]

### 5.2 Launch Plan

**Soft Launch:**
- Date: [Target date]
- Audience: [Limited group]
- Success criteria: [Metrics]

**Public Launch:**
- Date: [Target date]
- Marketing: [Channels]
- Success criteria: [Metrics]

### 5.3 Post-Launch

- [ ] Monitor key metrics
- [ ] Gather user feedback
- [ ] Triage and prioritize issues
- [ ] Begin Phase 2 planning

---

## Part 6: Resources & References

### Documentation
- [Link to relevant docs]
- [Link to API references]

### Tools & Services
- [Tool 1]: [URL]
- [Tool 2]: [URL]

### Learning Resources
- [Tutorial/Guide 1]
- [Tutorial/Guide 2]

---

*Document Version: 1.0*  
*Last Updated: [DATE]*  
*Authors: [Names/Contributors]*
