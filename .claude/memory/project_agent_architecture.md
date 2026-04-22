---
name: Agent architecture — why three pillars + judge
description: Core architecture decision for compliance agents — three parallel pillar agents plus a judge, not a single monolithic agent
type: project
originSessionId: 4ee2d105-082e-4f5b-acec-87990031da4e
---
Early in Sprint 1, tried a single-agent approach for compliance checking. It produced inconsistent scores and couldn't separate SR 11-7 pillars cleanly.

**Why:** Switched to three parallel pillar agents (Conceptual Soundness, Outcomes Analysis, Ongoing Monitoring) + a judge agent. Each pillar agent focuses on its SR 11-7 elements only. Judge validates consistency and flags anomalies. This mirrors how real model validation teams divide work.

**How to apply:** Never collapse back to a single agent. Agent prompts, scoring weights, and element codes are tightly coupled to this three-pillar split. Changes to one pillar agent should not affect the others.
