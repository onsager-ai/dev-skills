---
name: pr-lifecycle
description: Create or update an authorized pull request, reconcile its delivery links, handle review and CI, and report exact check state. Use for PR preparation, review comments, red checks, conflicts or post-push verification.
---

# Pull-request lifecycle

## Scope

This skill owns PR method. The task and repository policy own publication,
review responses, issue/comment writes and merge authority. AGENTS.md and the
repo overlay own scope, labels, SDD linking and gates. Opening/updating authority
does not itself authorize merging. Keep repository-specific policy out of this
shared procedure.

## Prerequisites

Know the exact repo, base/head and delivery scope. Follow
[pre-push](../pre-push/SKILL.md) before publication. Use
[harness-operations](../harness-operations/SKILL.md) for capability mapping only
when needed; subscriptions and a specific GitHub tool are not prerequisites.

## Reviewable descriptions

Lead with the concrete problem and resulting behavior. Use a before/after example
when it explains the change. Describe the final diff for a reviewer who has not
seen the conversation; rewrite stale titles and bodies instead of appending a
work diary. Keep a small change to a short paragraph plus validation. Aim for
100–250 words for most bodies, expanding only for material review complexity.
Link detailed protocols, benchmark tables and historical command logs. Include
only evidence that helps assess the change or its readiness.

For a larger change, use this order:

- **Problem and outcome:** state the trigger, previous behavior and new behavior.
- **Changes:** explain the decisions that affect behavior or review. Keep distinct
  concerns in separate PRs when they can be reviewed and validated independently.
- **Review:** name the first two or three authored files or groups to read. Identify
  generated bundles, screenshots and evidence separately from authored logic.
- **Validation and remaining scope:** give actual commands/results, their exact
  revision, linked evidence and unrun gates. State stack and cross-repository
  dependencies, including an exact source pin when adoption requires one.

Use short active sentences and consistent terms. Expand an unfamiliar acronym
once. Keep identifiers exact. Separate numbers from words and state their units.
Avoid vague claims such as "improve robustness" without the observable behavior.
Plain technical English does not require a restricted dictionary or an STE
compliance claim.

For a visible UI change, show a small set of actual before/after screenshots from
the base and head under the same viewport, theme, route and fixture. Label each
comparison and link the larger evidence set. State when a baseline is unavailable;
never synthesize an image as validation. Use a compact diagram only when branches,
ownership or state transitions are clearer than prose. Omit empty template sections
and visuals that do not help review.

## Backlog cleanup

When cleanup is authorized, compare each PR with the current intended base. Check
ancestry, file identity and remaining behavior; a large merge-base diff or an old
date does not establish remaining scope. Preserve unique code, tests and historical
evidence in an identified replacement before closing an old integration PR.

Close incorporated or superseded PRs with the checked head/base and a link to the
landed implementation or replacement. Distinguish an open replacement from landed
work. Retain branches used as stack bases until their dependents are reconciled.
Do not merge an obsolete source pin merely to clear a queue. Keep a draft when
residual scope or required adoption evidence is unresolved.

## Procedure

1. Create or update the existing PR rather than duplicating it. Describe the final
   behavior and validation. Where the repo requires SDD, use `Closes #N` for the
   complete remaining spec slice, `Fixes #N` for a delivered defect, `Part of #N`
   for partial work or `Refs #N` for related context. Use one closure keyword per
   issue. Apply a trivial exception only under the repo's rule. Use
   [issue-spec](../issue-spec/SKILL.md) when the contribution gate requires a spec.
2. List exact delivered Plan items when the PR is a spec slice. Keep the spec's
   own Plan unchecked until the slice lands. Do not imply that passing checks or
   creating a draft completes adoption tests that remain unrun.
3. Read both commit-status and check/workflow surfaces for the exact head SHA.
   Subscriptions may help when supported, but do not replace this explicit sweep.
   Distinguish passed, failed, pending, cancelled, skipped and unavailable checks.
   A skipped required gate or an absent result is not a pass.
4. Use [ci-triage](../ci-triage/SKILL.md) to classify failures. Reproduce
   using repo-owned gates/fixtures. Fix defects within scope; report blocked logs,
   setup. Request pending human decisions through the structured question
   capability in [harness-operations](../harness-operations/SKILL.md), with context
   and options, and wait before dependent work; reporting them in the final reply
   alone is insufficient when that tool is available. If unavailable, state the
   limitation and use the established handoff channel. For conflicts use pre-push's local reconciliation
   and rerun checks on the resulting tree; do not use the web conflict editor as
   a substitute for local validation.
5. Address review findings in coherent commits. Reply where explaining a decision,
   answering a question or requesting necessary clarification is useful. Resolve
   a thread only after checking its concern. New design boundaries belong in the
   relevant spec/decision record; already authorized fixes can proceed.
6. After every head change repeat the status/check sweep. Do not promise background
   monitoring unless the current harness actually provides it. If checks remain
   running, report that state and the concrete next check needed.
7. Merge only under separate authority and the repo's required gates. After landing,
   verify native issue closure, update delivered Plan items on partial specs, and
   reconcile an existing umbrella tracker when authorized. Cite the landed PR and
   avoid marking abandoned or unmerged work complete.

## Completion

Report the PR URL, head, what changed, evidence from both check surfaces and
remaining gates. Keep draft status when its declared adoption evidence is missing.
CI success is not proof of native agent-instruction discovery or Cloud behavior.
