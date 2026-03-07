# Harbor Agent Development Strategy
### Version 1.0

---

## Model: Concern-Based Agents + Orchestrator

```
┌─────────────────────────────────────────────────┐
│              ORCHESTRATOR (Opus)                │
│  All 6 docs · Full system context               │
│  Decomposes tasks · Reviews output              │
│  Enforces cross-cutting constraints             │
└────────┬──────────┬──────────┬──────────┬───────┘
         │          │          │          │
    ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌───▼──────┐
    │Surface │ │Algorithm│ │API/Data│ │Compliance│
    │ Agent  │ │  Agent  │ │ Agent  │ │  Agent   │
    └────────┘ └─────────┘ └────────┘ └──────────┘
```

---

## Agent Definitions

**Orchestrator** — Claude Opus. Initialized with all 6 project documents. Decomposes tasks into scoped work packages, routes to the right agent, reviews output, resolves cross-agent conflicts. Does not write implementation code.

**Surface Agent** — Design Bible + Implementation Plan (frontend sections). Owns React Native, Next.js, design tokens, components, screen architecture. Boundaries: no database, no ranking logic.

**Algorithm Agent** — Ranking Spec + Implementation Plan (ML sections) + Metrics Standard Tier 1/2. Owns deck engine, satisfaction model, arousal classifier, serendipity budget. Boundaries: no UI, no API shape.

**API/Data Agent** — Implementation Plan (schema + API design + phase roadmap) + Metrics Standard event taxonomy. Owns Fastify, PostgreSQL, Redis, BullMQ. Defines contracts consumed by Surface and Algorithm agents. Boundaries: no UI, no ML internals.

**Compliance Agent** — Anti-Drift Constitution + Metrics Standard + Ranking Spec (red lines section only). Reviews every PR against the Constitution's 9 sections, Tier 0 guardrails, red-line assertions, and Definition of Done checklist. Does not write code. Runs on every PR without exception.

---

## Coordination

- **Coordination layer:** git + the document set
- **Agents** read from the repo, write to branches
- **Orchestrator** reviews before merge
- **Parallel work:** tasks with no dependencies run concurrently (e.g., UI component + schema migration)
- **Sequenced work:** API contracts are finalized before Surface and Algorithm agents implement against them
- **Architecture decisions** route to the Orchestrator. Unresolved calls route to the human. Agents do not debate with each other.

---

## Phase Rollout

**Phase 1 (Foundation)**
- Orchestrator
- Surface Agent
- Backend Agent (API/Data + heuristic algorithm combined — no dedicated ML agent needed until Phase 2)
- Compliance Agent (day one, every PR)

**Phase 2 (Satisfaction Engine)**
- Split Backend Agent into API/Data Agent and Algorithm Agent
- Full four-agent model active

**Phase 3 (Scale)**
- Add Infrastructure Agent if Kubernetes migration, observability, and audit tooling scope warrants dedicated context
- Add agents only when a domain needs isolated context, not for organizational reasons

---

## Agent Context Map

| Agent | Initialized With | Owns | Boundary |
|---|---|---|---|
| Orchestrator | All 6 documents | Task decomposition, integration, conflict resolution | No direct implementation |
| Surface | Design Bible, Impl Plan (frontend) | React Native, Next.js, tokens, components | No database, no ranking |
| Algorithm | Ranking Spec, Impl Plan (ML), Metrics Standard | Deck engine, models, serendipity, arousal | No UI, no API shape |
| API/Data | Impl Plan (schema, API), Metrics Standard | Fastify, PostgreSQL, Redis, event taxonomy | No UI, no ML internals |
| Compliance | Constitution, Metrics Standard, Ranking Spec (red lines) | PR review, DoD checklist | No code authoring |

---

## Compliance Agent Checklist (runs every PR)

- [ ] No infinite scroll introduced (Constitution §1)
- [ ] Deck size assertion `<= 20` present (Ranking Spec red lines)
- [ ] No cross-intent ranking (Ranking Spec red lines)
- [ ] No red notification badges (Design Bible §7)
- [ ] No new optimization target banned by the Ranking Charter (Constitution §2)
- [ ] Baseline view switcher preserved (Constitution §1, Design Bible §3.10)
- [ ] Civic content gated by opt-in (Ranking Spec red lines)
- [ ] Every ranked item has explanation reason codes (Ranking Spec Stage E)
- [ ] If material ranking change: RFC submitted (Constitution §6)
- [ ] If enforcement-adjacent: notice + appeal path present (Constitution §5)
- [ ] A/B test plan names SSR as primary metric, RR as constraint (Impl Plan §11)
- [ ] Rollback config versioned if material change (Impl Plan §12)
