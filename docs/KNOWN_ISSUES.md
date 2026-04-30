# Prova — Known Issues

## Re-assessment gap-list cross-run variation

Re-assessment gap lists may show minor variation across runs even with
identical inputs, due to non-zero LLM temperature. The `dispute_resolution`
field is the source of truth for the agent's reasoning on each disputed
gap; the `gap_diff` is informational.
