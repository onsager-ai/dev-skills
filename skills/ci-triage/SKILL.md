---
name: ci-triage
description: Triage failed CI runs on the Onsager repo — classify regression vs flake vs infra, maintain a single rolling `main-red` issue when main is broken, and point humans at the suspect commit. Use when a workflow fails on `main`, or when a human asks "is main red?", "why did CI fail on main?", "triage this workflow run", "classify this failure". Paired with `onsager-pr-lifecycle` (PR-side CI triage) and the `web-testing` skill (invoked for `e2e` failures).
---

# ci-triage

Shared logic for classifying a failed CI workflow run and recording the
outcome. Used by humans (or Claude in an interactive session) when
triaging a red `main` workflow or a red check on an open PR — the latter
via `onsager-pr-lifecycle`.

This skill owns the taxonomy, the de-dup rules for the `main-red` issue, and
the issue template. Workflow-specific reproduction steps live in other skills
(`onsager-pr-lifecycle` for rust/frontend detail, `web-testing` for e2e).

## Taxonomy

Every failure lands in exactly one bucket. Be explicit — "unclear" is not a
bucket, `needs-human` is.

| Bucket         | Signal                                                               | Default action                                   |
|----------------|----------------------------------------------------------------------|--------------------------------------------------|
| `regression`   | Reproduces deterministically on `main` at HEAD                       | File/update `main-red`, @-mention suspect author |
| `flake`        | Same workflow passed on the previous main commit without code change | Comment on the existing `main-red` issue if one is open; otherwise skip |
| `infra`        | Postgres service didn't come up, rustup 403, pnpm registry down      | File/update `main-red` labelled `infra`; do not @-mention authors |
| `needs-human`  | Logs truncated, auth failed, classification genuinely ambiguous      | Open a `main-red` issue with raw log excerpt, label `needs-human` |

Do **not** invent a fifth bucket. If the signal you see fits nothing above,
it's `needs-human`.

## Suspect commit identification

The GitHub `workflow_run` payload includes `head_sha`. That's the commit that
*triggered* this run — on a `push: main` event, it is the merge commit.

1. Fetch the commit via `mcp__github__get_commit`.
2. If the commit message matches `Merge pull request #N`, the suspect PR is
   `#N`; its author is the suspect author.
3. Otherwise (direct push to main, squash-merge), use the commit author
   directly.

Never blame more than one commit per failure. If the previous main commit's
CI was also red, link that issue rather than opening a new one.

## The rolling `main-red` issue

**One open `main-red` issue at a time.** If main is broken for three days,
that's one issue accumulating comments — not twelve.

Before filing:

1. `mcp__github__list_issues` with `labels: main-red, state: open`.
2. If one exists, append a comment:
   > Run #<run-id> also failed. Workflow `<name>`, bucket `<bucket>`,
   > suspect <sha-short> (#<pr-or-none>, @<author>). <one-line-cause>.
3. Only open a new issue if none is open. Title:
   `main is red: <workflow> (<bucket>)`. Labels: `main-red`, plus
   `infra` or `needs-human` if applicable.

When main goes green again (the next successful run on the same workflow),
close the issue with a comment naming the green run id. This close step
is manual.

## Issue body template

```markdown
**Workflow**: <workflow-name>
**Run**: <run-url>
**First failed step**: <step-name>
**Bucket**: <regression|flake|infra|needs-human>
**Suspect**: <sha-short> — <commit-subject> (PR #<n>, @<author>)

### Failure excerpt

<last 30 lines of the failing step, or the ripgrep-extracted error block>

### Reproduction

<one of:>
- Deterministic: `<exact command from the workflow yaml>`
- Flake: passed on <prev-sha-short>; rerun button: <run-url>/attempts/2
- Infra: <service name> — <symptom>
- Needs human: <why the logs are ambiguous>

### Next action

<one line — "revert #N and reland", "rerun", "fix <specific thing>", "human eyes">
```

Keep the excerpt tight. Dumping the full log helps nobody.

## Reproducing locally

A human invoking this skill via `onsager-pr-lifecycle` should reproduce
before filing, using the commands in
[`onsager-pr-lifecycle`'s CI triage section](../onsager-pr-lifecycle/SKILL.md).
For a `main` failure caught from outside a PR, check out `main` at the
suspect SHA and run the same commands locally before filing.

For `e2e` failures specifically, delegate classification to
[`web-testing`'s triage mode](../web-testing/SKILL.md) — it handles
regression-vs-flake for browser-driven tests (the ambiguous case).

## Log access

`WebFetch` **cannot read authenticated GitHub Actions logs** (403). The
GitHub MCP gives you:

- `mcp__github__pull_request_read` with `method: get_check_runs` — step
  names, status, timings (no log body).
- The workflow run's `jobs_url` via `mcp__github__get_commit` +
  `check_suite` traversal — same metadata.

Log bodies are not reliably accessible from the GitHub MCP. When the log
body is unavailable, classify from step names + exit codes + the workflow
yaml, and bias toward `needs-human` rather than guessing.

## Flake-detection heuristic

A failure is `flake` only if **both** hold:

1. The same workflow on the previous main commit passed (check via
   `mcp__github__list_commits` + check runs on the prior sha).
2. The failing step's logs do not contain a symbol name, file path, or
   assertion message that appears in the suspect commit's diff.

One of those alone is not enough. A deterministic regression can pass on the
prior commit; a real flake can mention a touched file by coincidence.

## Constraints

- Never open a PR from this skill. Triage is read-only on the codebase.
- Never @-mention for `infra` or `flake` buckets — alert fatigue kills the
  signal.
- Never close a `main-red` issue without a green run id to cite.
- Scope is `onsager-ai/onsager` only.

## Relationship to other surfaces

| Surface | Role |
|---------|------|
| [`onsager-pr-lifecycle`](../onsager-pr-lifecycle/SKILL.md) | Interactive caller; humans use this when triaging a red PR check. |
| [`web-testing`](../web-testing/SKILL.md) | Delegated to for `e2e` workflow classification. |
