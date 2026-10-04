---
name: pre-push
description: Prepare an authorized branch for publication by inspecting the intended base, resolving conflicts, running repository-owned gates on the relevant tree, and checking the declared contribution process. Use before push, PR preparation or merge-conflict recovery.
---

# Pre-push

## Scope

This skill owns integration and publication readiness. AGENTS.md and the repo
workflow overlay own workspace isolation, the intended base, gate commands,
warning severity and whether a spec link or trivial exception is required.
Availability of this skill grants no push, PR or merge authority.

## Prerequisites

Inspect branch, worktree and working-tree state before edits. Preserve unrelated
changes and keep primary-checkout parking rules intact. Resolve the actual remote
and base branch, which may differ from main. Load
[harness-operations](../harness-operations/SKILL.md) if a tool mapping is needed.

## Procedure

1. Inspect the current diff and intended base. Refresh that base through the
   configured remote and record its SHA. If fetching is blocked, report that the
   base/merge gate could not be verified; do not claim offline integration success.
2. Follow the repo's integration route. If its gate builds a committed merge preview
   itself, satisfy its clean-tree prerequisite and run that gate without replacing
   it with a manual branch check. Otherwise merge the intended base in the task
   worktree when required; avoid rewriting published history or forcing a push.
3. Resolve conflicts locally. Inventory unresolved paths, reconcile all changed
   intents, stage resolutions and run relevant gates before completing the merge.
   Preserve changelog/registry entries from both sides. Regenerate lockfiles and
   generated assets with their owning tools; do not hand-edit them. For shared
   documents reconcile section intent. Abort an unsuccessful merge only when it
   preserves the pre-merge work; never discard unrelated changes.
4. Run exactly the repository's mandatory gates and diff-conditional checks on the
   required tree. Respect its distinction between advisory and blocking warnings.
   Missing tooling, origin access or environment setup is blocked validation, not
   a pass. Do not suppress failures, weaken assertions or bypass hooks.
5. Apply the declared contribution process. Where SDD is required, verify a spec
   exists, its blocking decisions are resolved, and the proposed PR links the right
   delivery slice. Use [issue-spec](../issue-spec/SKILL.md) for missing specs.
   Where a trivial exception is allowed, justify it using the repo's definition.
   Reconcile issue references in commits deliberately; incidental mentions do not
   imply closure. A repository without this gate acquires none from this skill.
6. When publication is authorized, publish the validated branch with the available
   Git transport or connected GitHub API. On transport failure use an available
   authenticated equivalent; when publishing trees through an API, preserve modes,
   deletions and parent lineage and verify exact tree identity. Do not force-update
   a protected/long-lived branch. Limited retries are appropriate for transient
   errors; authorization errors require capability diagnosis, not repeated retries.
7. Hand PR creation/update and its check sweep to
   [pr-lifecycle](../pr-lifecycle/SKILL.md).

Request any unresolved human decision through the structured question capability
in [harness-operations](../harness-operations/SKILL.md), with the affected scope
and options. Wait before dependent publication; continue independent authorized
checks. A final-response blocker list alone is insufficient when the tool is
available. If unavailable, state the limitation and use the established handoff.

## Completion

Record branch/base/head SHAs, actual gate results, missing prerequisites and
publication result. A docs-only change may need fewer checks, but still needs
base freshness and any declared contribution gate. State when a ready branch is
not published or its merge-preview gate is blocked.
