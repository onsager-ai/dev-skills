---
name: docs-drift-guard
description: Reduce documentation drift by giving facts one authored home, generating mutable references, executing examples and checking local links through repository-owned tooling. Use for stale docs, broken references or documentation maintenance.
---

# Documentation drift guard

## Scope

This skill owns documentation method. The repo owns protected documents, generated
outputs, check entrypoints and review requirements. A working link establishes
path integrity, not that the surrounding claim is still true.

## Prerequisites

Read AGENTS.md and the relevant doc's source/ownership rules. Identify the facts
being described, their code/configuration source and existing tests/generators.
Use [harness-operations](../harness-operations/SKILL.md) only when tool mapping is
needed. Do not introduce a new dependency merely to run this skill.

## Procedure

1. Give each fact one authored home and link other consumers to it. Keep stable
   architecture intent in prose; derive API, CLI, configuration and mutable
   inventories from their owning source when possible.
2. Prefer generated output with freshness checks, then executed examples, then
   deterministic structural checks, then explicit review of remaining prose.
   A generated artifact still needs a check against its source; generation alone
   does not guarantee freshness. Keep model-based semantic review advisory.
3. Reuse the repo's existing link/path, doctest, snippet or architecture gate.
   If a new checker is needed, add it through the repo's dependency/CI process
   with a pinned version and prove it catches a broken reference or stale sample.
4. For JavaScript repos adopting the maintained
   [docs-drift-check](https://github.com/onsager-ai/docs-drift-check) tool, use its
   locked local binary via the owning package script or `npx --no-install
   docs-drift-check`. Do not rely on an unpinned runtime download. External-link
   checks are a separate opt-in network axis, not an offline requirement.
5. Match higher checks to the claim: doctests for runnable examples; deterministic
   transclusion/freshness checks for code snippets; dependency rules for layering;
   path-triggered owner review for prose that cannot be mechanically derived.
6. Edit the canonical source and regenerate outputs. Preserve ADR history through
   the repository's amendment convention. Do not make separate hand-edited copies
   of generated docs, common prompts or native skill projections.

## Completion

Report authored source, generated consumers, checks/negative controls and their
results. State which semantic claims still depend on review and which network
checks were unrun. A file that exists can still describe obsolete behavior.
