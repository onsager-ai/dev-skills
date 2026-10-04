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
4. Delegate failure classification to [ci-triage](../ci-triage/SKILL.md). Reproduce
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
