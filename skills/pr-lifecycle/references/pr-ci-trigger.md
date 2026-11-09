# Missing pull request CI trigger

Use this procedure after opening a PR or pushing its head, and when a no-checks
notification arrives. A "no checks reported" alert is actionable: diagnose the
trigger or recover it; do not wait while treating it as harmless.

## Establish the PR check gate

Within a short bound (about three minutes), verify that the expected workflows
have runs with event `pull_request` for the exact current PR head SHA. Read the
PR's head, base, open/closed state and draft state from the available GitHub tools.
Inspect run metadata to confirm the matching PR, head and expected workflows.
A PR rollup is usable only when event provenance is verified; commit check-runs
alone do not establish that PR-triggered workflows ran. A `workflow_dispatch`
run is diagnostic only and never satisfies PR checks or merge gates. Run existence
is separate from completion: required checks must still finish successfully.

If runs are absent, inspect the PR base against workflow `branches` filters
(which match the base branch), then other event and path filters. For stacked
PRs, retarget to `main` only when scope, stack semantics and authority permit it.
Otherwise record explicitly that CI waits for the parent PR to merge; do not
report green.

## Recover a missing trigger

When authorized and appropriate, close then promptly reopen the PR to cause a
`reopened` event. Preserve its head SHA and draft state, then verify that it is
open with the same head and draft state and that the expected `pull_request`
runs start. Describe this as a CI-only reopen; it is not a decision to close the
PR. The procedure does not grant close/reopen authority.

Only if close/reopen fails to start the expected runs, use an empty commit as
the fallback within existing commit/push authority. Push once per review round;
the empty commit counts as that round's one push. The original push may already
have consumed the allowance. In that case, report the conflict and defer the
fallback to an authorized next round or obtain an explicit exception. Manual
dispatch is not a substitute.

Do not use polling loops, sleeps or blocking watch commands. Use supported
check notifications for waits. If the watcher supports a bounded no-check timer,
use it; otherwise report that capability gap and keep the missing-trigger
diagnosis open rather than claiming a guaranteed deadline. Merge still requires
separate authority and successful required gates.
