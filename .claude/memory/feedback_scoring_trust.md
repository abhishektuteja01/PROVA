---
name: Never trust agent-reported scores
description: Always recalculate pillar scores from gaps — agents frequently report scores inconsistent with their own gap lists
type: feedback
originSessionId: 4ee2d105-082e-4f5b-acec-87990031da4e
---
Agent-reported scores must never be used directly. Always recalculate from the gap list using the canonical formula (100 - critical×20 - major×10 - minor×5).

**Why:** During Sprint 2 testing, agents consistently reported scores that didn't match their own gap counts. The discrepancy was sometimes 20+ points. This led to building `verifyPillarScore` in the scoring calculator.

**How to apply:** If the scoring calculator warns about a discrepancy, that's expected behavior — the override is working correctly. Only investigate if the *calculated* score seems wrong relative to the document quality.
