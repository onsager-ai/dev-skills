---
name: pr-lifecycle
description: Manage a PR after it's been pushed on any repo that follows the spec-issue-driven (SDD) loop — spec-issue linking, CI triage, review-comment discipline, merge-conflict recovery on open PRs, webhook subscription + the post-push CI sweep, and manual Plan-item / tracker ticking on merge. Triggers include "CI is failing", "check is red", "link this issue", "Closes vs Part of", "respond to review", "subscribe to PR", "triage PR", "the PR is ready", "PR has conflicts", "branch has conflicts with main", "merge conflict on the PR", or when a github-webhook-activity event arrives. Repo-agnostic methodology; the consumer repo's CLAUDE.md and `<repo>-dev-process` overlay the repo-specific CI-failure patterns and any repo-local automation. Paired with `pre-push` (which owns the conflict walkthrough), `issue-spec`, and `ci-triage`.
---

# pr-lifecycle

Everything that happens after `git push` on a PR: spec-issue linking, CI triage, review-comment discipline, webhook subscription + the post-push sweep, and the manual ticking of Plan items / umbrella trackers on merge.

This is the **repo-agnostic** half. The consumer repo's CLAUDE.md / `<repo>-dev-process` overlays its CI-failure patterns, its scope (which repos this operates on), and any repo-local automation (a `pr-spec-sync` workflow, audit scripts) or the lack of it.

## Tool discipline

- **No `gh` CLI, no `hub`, no direct GitHub API.** Always use `mcp__github__*`.
- Scope to the repo you're working on (and any sibling the repo's CLAUDE.md sanctions). Don't query unrelated repos.
- Don't open PRs unless the user explicitly asks. Creating one is a one-way door in this workflow.

## Spec-issue linking (mandatory)

Every PR must either:

1. Link to a spec issue in its body via `Closes #N` / `Fixes #N` / `Resolves #N` (slice complete) or `Part of #N` / `Refs #N` (scaffolding), **OR**
2. Carry the `trivial` label (typo, doc-only, one-line obvious fix).

If neither, the PR is out of process. Comment asking the author to add a spec link — creating one via `issue-spec` if none exists — or apply the `trivial` label.

### Which keyword to use

GitHub closes issues on merge when the PR body contains one of: `close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved` — followed by `#N`. Pick the keyword based on **what this PR actually delivers**:

| PR delivers                                            | Use         |
| ------------------------------------------------------ | ----------- |
| The acceptance test / vertical slice the spec asks for | `Closes #N` |
| A bug fix for a specific defect                        | `Fixes #N`  |
| Scaffolding / one phase of a multi-phase spec          | `Part of #N`|
| Related work that shouldn't close the spec             | `Refs #N`   |

`Part of` / `Refs` are **not** auto-close keywords — they just cross-link in the UI. Use them for scaffolding so the spec stays open for the real slice. Edit the PR body via `mcp__github__update_pull_request` (don't open a new PR just to fix the link); put the linking line at the top of the body.

### Multi-issue PRs — enumerate every closure

If a single PR delivers acceptance for more than one issue, write **one `Closes` keyword per issue**:

```markdown
Closes #27, Closes #30, Closes #33
```

GitHub only honors auto-close on each `#N` individually; `Closes #27, #30, #33` closes #27 and leaves #30/#33 open. Auto-close also doesn't fire for issues merely *mentioned* in commit subjects — without an explicit `Closes` line they stay open after merge.

### The `## Delivers` subsection

For `Part of #N` PRs (and ideally all PRs), include a `## Delivers` subsection listing the exact Plan items this PR ticks. Copy the item text verbatim from the spec's `## Plan`, marking each `- [x]` (the PR delivers them, even though the spec's boxes stay `- [ ]` until you tick them after merge). Use this list to tick the parent spec's checkboxes after merge.

Example PR body:

```markdown
Part of #42

## Delivers
- [x] Add `--filter` flag handling in `src/run.rs`
- [x] Update the CLI reference doc

## Summary
First slice. Backwards-compatible; the event-emission half lands next.
```

## Issue progress

Spec issues use only their open/closed state — no status labels. Lifecycle moves:

- PR merged with `Closes #N` → issue auto-closes (GitHub).
- PR merged with `Part of #N` → spec stays open; tick the delivered Plan items on the parent manually.
- PR closed unmerged → spec issue stays open as-is.

You are responsible for ticking Plan checkboxes on parent specs after merge: read the merged PR's `## Delivers`, find each matching `- [ ]` line in the parent spec's `## Plan`, flip it to `- [x]`, and edit the spec body via `mcp__github__issue_write`.

## Umbrella tracker refresh

Some issues are **umbrella trackers** that reference several sub-issues as a checklist — identified by a `[Tracking]` title prefix, a `tracking` label, or a `## Progress` section whose items are `- [ ] #N` lines. When a PR closes a sub-issue, the tracker does **not** update itself. After merge, for each auto-closed or explicitly-closed issue:

1. Search for umbrella trackers that reference it: `mcp__github__search_issues` with `repo:<owner>/<repo> #N in:body is:issue is:open`.
2. For each match, read the tracker body. If there's a matching `- [ ] ... #N ...` line in a Progress / Plan section, flip it to `- [x]`.
3. Post one tracker comment summarizing the delta, not one per issue: "PR #<pr> landed #N1, #N2, #N3; ticked in Progress."
4. If after the tick every sub-issue is closed, note the tracker is now a candidate for closure — don't close it unilaterally, just flag it.

## CI triage

For the classification taxonomy (`regression` / `flake` / `infra` / `needs-human`), suspect-commit identification, the log-access facts (`WebFetch` can't read authenticated Actions logs — 403; use `mcp__github__pull_request_read` `method: get_check_runs`), and the rolling `main-red` issue convention, use the `ci-triage` skill (installed globally from `onsager-ai/dev-skills`). This section covers only the PR-side specifics that `ci-triage` delegates back.

**Reproduce locally.** Once you have the failing step from `get_check_runs`, sync main and re-run that step with the exact flags from the repo's workflow yaml against the merged tree — the repo's check gate (see `pre-push` step 2 / the repo's CLAUDE.md) is the same set of commands CI runs. The repo's CLAUDE.md / `<repo>-dev-process` carries the repo-specific failure-pattern table (the recurring "passes locally, fails on CI" causes).

### When CI is missing entirely

If the repo has no CI workflow that exercises the change, that's an infra spec to file — not a license to skip local verification. Run the gate locally and note the gap in the PR body so a reviewer can decide whether to merge ahead of the missing CI.

## Merge conflicts on an open PR

When GitHub shows "This branch has conflicts that must be resolved" or `mcp__github__pull_request_read` reports `mergeable: false`, resolve **locally** — the GitHub web editor bypasses any local validation and routinely lands broken merges.

1. **Don't** use `mcp__github__update_pull_request_branch` to auto-merge main in via GitHub. That surfaces the same conflicts without a resolution workspace, then commits a broken merge if you accept the default.
2. Check out the branch locally and run the full conflict walkthrough in `pre-push` (step 1, "Resolving conflicts") — inventory, pattern-match, resolve, verify with the repo gate, commit.
3. After the merge commit lands, continue with the rest of `pre-push` (check gate, spec-link) before pushing. CI's `pull_request` job tests the new merge preview — if you didn't rebuild locally, CI finds out first.
4. Push the merge commit to the same branch with `git push` (no `--force`). The existing PR updates in place; the conflict banner clears when GitHub re-evaluates.
5. If the PR is tied to a `Closes #N` / `Part of #N` line and the merge touched the spec's surface area, comment on the spec flagging what drifted, so the parent stays accurate.

If the branch is so far behind main that the conflict set is large (>10 files or crosses subsystem boundaries), close the PR, rebase the work into a fresh branch from `origin/main`, and open a new PR with the same linking line. Note the close reason on the old PR.

## Review comments

**Fix the code. Don't reply per comment.** Multiple reviewers (Copilot + human) often flag the same defect; a single commit that fixes it resolves all of them at once.

Reply *only* when: declining a suggestion (explain why, briefly); the comment is a question, not a bug report; or you're asking for clarification before acting. Use `mcp__github__add_reply_to_pull_request_comment` for threaded replies, never top-level comments unless summarizing multiple responses at once.

Automated reviewers (Copilot) sometimes flag idiomatic code as broken — verify locally before "fixing" a non-bug, but prefer the clearer form even when the lint was wrong. If a review comment raises a design concern the spec didn't address, pause and update the linked spec issue (add an open question under `## Alignment`, comment on the spec, let a human decide). Don't silently expand scope in the PR.

## Webhook subscription

Events from CI and reviewers arrive wrapped in `<github-webhook-activity>` tags; the harness forwards them as user messages.

- Subscribe once per PR with `mcp__github__subscribe_pr_activity` after the PR is created (or the user asks you to watch it).
- Unsubscribe with `mcp__github__unsubscribe_pr_activity` when done — not strictly necessary but cleaner.
- Treat each event as actionable; skip only if it's a duplicate of one you just addressed.

### What the subscription does NOT cover

The subscription is **not** an "all CI events" feed. It's filtered to issue comments and review activity plus a small set of well-known `check_run` state changes. Two silent-failure surfaces leak through, observed on real PRs:

- **Commit statuses.** GitHub's `status` API is a separate channel from `check_run`. Per-PR deploys (Railway, Vercel), secret scanners, and any GitHub App posting via the legacy statuses API fire here, not as check_runs. No `<github-webhook-activity>` event arrives — the failure is only visible if you call `pull_request_read get_status` directly.
- **`check_run` completion transitions.** The subscription fires on some state changes but is not reliable for "the build job just finished failure". An in-progress check that completes after you've ended your turn does not necessarily wake the session.

### Post-push CI sweep (mandatory)

Once the PR is open and you've subscribed, run this sweep **before declaring "all green" or ending the turn**:

1. Read both surfaces explicitly: `pull_request_read` `method: get_status` (every commit status for the head SHA — treat any `state=failure` as actionable even if no webhook fired) and `pull_request_read` `method: get_check_runs` (every check_run — treat any `conclusion=failure` as actionable).
2. Any check still `in_progress` or `queued` is **not** ground for "completed" — record a follow-up to re-poll ~5 min post-push and check it off only after a follow-up sweep shows the check finished. Don't sleep-poll inside the same turn; end the turn and let the user (or a subsequent webhook) bring you back.
3. If the sweep returns nothing actionable but checks are still running, say so explicitly in the end-of-turn summary so the user doesn't infer the PR is fully green.

The sweep is cheap (two MCP calls) and is the only mechanical defense against the silent-failure surfaces above.

## Reporting back to the user

After handling a webhook event, end with one or two sentences: what the failure was, what you changed, whether CI is re-running. Don't dump the full commit message in chat — the user can see it on the PR.

## Relationship to other skills

| Related surface | Role |
|-----------------|------|
| `<repo>-dev-process` | Top-level SDD loop; points here for the post-push stage, and overlays the repo's CI-failure patterns. |
| `issue-spec` | Creates the spec issue this PR links to. Installed globally from `onsager-ai/dev-skills`. |
| `pre-push` | Runs before `git push`; owns the conflict walkthrough and enforces the spec-link check locally. |
| `ci-triage` | Shared failure taxonomy + `main-red` issue convention + log-access facts; called from this skill's CI triage flow. Installed globally from `onsager-ai/dev-skills`. |
