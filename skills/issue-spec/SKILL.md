---
name: issue-spec
description: Create or revise a focused specification issue when explicitly requested or required by the repository contribution policy. Discover existing work, capture intent and acceptance criteria, and reconcile decisions before implementation.
---

# Issue specification

## Scope

This skill owns specification method, not which changes require a spec. Read
AGENTS.md and the relevant repo workflow overlay for the target repository,
always-spec surfaces, labels, required sections and exceptions. An explicit
request to write a spec is sufficient to start; do not re-ask whether to do it.
Use the repository's declared spec medium. Use GitHub issues when it adopts the
issue-based SDD loop; do not migrate another repository's spec format by inference.

## Prerequisites

Know the intended change, target repo and applicable contract. For GitHub work,
use [harness-operations](../harness-operations/SKILL.md) only if capability mapping
is needed. No personal installation or particular GitHub tool is required.
Read the [format reference](references/spec-format.md) when drafting and use the
[template](templates/issue-spec-template.md) as a starting point, not extra policy.

## Procedure

1. Discover relevant code, recent changes and existing issues/specs. Reuse or amend
   related work instead of creating a duplicate. Resolve the target repo from its
   checkout/remote and contract; do not infer it from the skill's source repo.
2. Capture intent with Overview, Design, independently verifiable Plan items,
   matching Test items, Alignment and optional Notes. Include the repo's required
   impact/example sections. Keep the spec near 2000 tokens or less; split a larger
   feature into a parent and independently scoped children.
3. State boundaries in Alignment. Proceed with already authorized implementation
   decisions. Ask only about a concrete unresolved boundary needed for the work;
   name its source and affected Plan items. Reconcile an answer into the spec in
   the same sitting. Do not leave answered questions marked as blockers.
4. Validate scope, invariants, test coverage, dependencies and required labels.
   In GitHub bodies keep each prose paragraph or list item on one source line;
   blank lines separate blocks. Do not mark Plan items complete before delivery.
5. Publish or update the spec through an available authorized tool. Apply existing
   repo labels, priority and area conventions; do not create a new taxonomy merely
   because this procedure uses one in an example. Establish child relationships
   with native sub-issues where supported, otherwise record explicit links.
6. Hand ready work to [pre-push](../pre-push/SKILL.md) and
   [pr-lifecycle](../pr-lifecycle/SKILL.md). Use the repository's worktree/branch
   rules. The common procedure does not choose a harness branch prefix.

## Completion

Report the spec path/URL, scope, decisions and any blocked publication capability.
A local draft is not a published issue. Under issue-based SDD, link final delivery
with `Closes #N`, partial delivery with `Part of #N`, and reconcile Plan progress
only after landing. If the repository has no spec gate, do not impose one.

## Optional helpers

The [list helper](scripts/spec-list.sh) and [show helper](scripts/spec-show.sh)
are optional CLI conveniences requiring authenticated GitHub CLI and jq. Use
connected GitHub tools instead when those prerequisites are unavailable.
