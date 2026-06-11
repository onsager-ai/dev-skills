---
name: pre-push
description: Run before pushing code on any repo that follows the spec-issue-driven (SDD) loop — catch what CI and reviewers will catch later, and confirm the branch has a linked spec issue in a valid state. Reproduces CI's merge-preview environment, walks the repo's merge-conflict patterns, runs the repo's check gate, and drafts the PR's spec-link line. Triggers include "before push", "ready to push", "pre-push check", "push readiness", "prep for PR", "resolve merge conflict", "merge conflict", "branch has conflicts", "sync with main", or proactively before any git push. Repo-agnostic methodology; the consumer repo's CLAUDE.md and `<repo>-dev-process` overlay the exact gate command and the repo-specific collision patterns.
---

# pre-push

Mechanical checklist that catches the reviewer / CI failures a repo has actually had, plus a spec-link check that enforces the SDD loop locally — before the PR is open, so the author sees the problem locally instead of hearing it from a reviewer or a `pr-spec-sync` bot.

This is the **repo-agnostic** half. Each consumer repo overlays its delta in its `CLAUDE.md` and its `<repo>-dev-process` sister skill:

- **The check gate** — the single command (or short sequence) that reproduces what CI runs: e.g. `just check` on one repo; `RUSTFLAGS="-D warnings" cargo build/test/clippy` + `cargo fmt --check` on another. Read the repo's CLAUDE.md or `<repo>-dev-process` for the exact gate and any diff-conditional extra gates (schema-drift, VD validation, seam lint, migration renumber, UI smoke).
- **Repo-specific collision patterns** — the high-churn files and the recurring logical conflicts (enum variants, event schema, migration numbering, generated fixtures). The generic patterns are below; the repo's CLAUDE.md / `<repo>-dev-process` names the rest.

When a new product surface lands, fold its gate into the repo's overlay — the checklist tracks the toolchain, it does not lag it.

## Why

CI on `pull_request` checks out a **merge of `origin/main` + the PR branch**, not the branch alone — and often with strict warnings (`-D warnings` or equivalent). A local build without that merge, with default flags, is insufficient. Reproducing the merge preview locally is the whole point of step 1.

The spec-link step enforces "no PR without a spec or a `trivial` label" at push time, before the PR is open.

## Steps

Run all of these from the repo root.

### 1. Sync main into the branch

```bash
git fetch origin main
git merge origin/main --no-edit
```

Resolve conflicts **locally**, before push — never on the PR "Resolve conflicts" web editor (it bypasses any local validation and routinely lands broken states). If the merge completes cleanly, skip to step 2.

#### Resolving conflicts

1. **Inventory** what conflicted:

   ```bash
   git status --short                   # U* lines = unresolved paths
   git diff --name-only --diff-filter=U
   ```

2. **Work by pattern, not by file.** A single logical conflict (e.g. an enum-variant change) usually spans several files. Match what you see against the patterns below before touching conflict markers — the right fix is often "take main's version and re-apply your change on top", not a line-by-line merge.

3. **Resolve**, then stage each resolved path with `git add <path>`. Re-run `git status` until no `U*` entries remain.

4. **Verify before committing the merge.** Run the repo's check gate (step 2) so a textually-clean merge that doesn't actually compile/pass is caught here, not in CI. Only then:

   ```bash
   git commit --no-edit                 # default "Merge branch 'main' ..." message
   ```

5. **If you get lost**, bail and retry:

   ```bash
   git merge --abort
   ```

   This restores pre-merge state. Never `git reset --hard` or `git checkout --` without confirming nothing is staged you care about — the merge carries uncommitted resolutions.

   Prefer `merge` over `rebase` for syncing main here: the branch is likely already pushed, rebase rewrites history, and force-push is a destructive action.

#### Common collision patterns

These generalize across repos; the consumer repo's CLAUDE.md / `<repo>-dev-process` adds its own (migrations, enum/event-schema variants, generated fixtures, etc.).

- **Lockfiles** (`Cargo.lock`, `pnpm-lock.yaml`, `package-lock.json`): always resolve by re-running the install / build, never hand-edit. If both branches bumped the same dep differently, prefer main's version and let your change re-request the update.
- **`CHANGELOG.md` / changelog files**: both branches added entries under the same next-version heading. Both entries should land — concatenate, don't pick one.
- **Generated / fixture files** (schema fixtures, snapshot tests): key-order or whitespace conflicts are usually false alarms; regenerate or re-run the owning test rather than hand-merging, and verify the artifact still parses.
- **Append-only registries** (action-type catalogs, event manifests, route tables): both branches appended a new entry. Both arms should land; check for name/ID collisions explicitly.
- **Shared doc files** edited by both branches: merge by section / by intent, figuring out which section each branch changed — not line-by-line.

### 2. Run the repo's check gate

Run the gate your CLAUDE.md / `<repo>-dev-process` names — the exact command CI and reviewers run (e.g. `just check`). Run it on the **merged tree from step 1**, not the branch alone.

Then add the diff-conditional gates the repo defines (schema-drift / changelog, verification-definition validation, seam / API-contract lint, migration renumber, UI smoke — whichever the diff touches). The repo's overlay is authoritative for which extra gate maps to which path.

Treat **any** warning as a blocker. Do not `#[allow(dead_code)]` / `@ts-ignore` / `--no-verify` your way past it; fix the root cause.

### 3. Spec-issue link check

Before pushing, confirm this branch corresponds to a known spec issue (or is explicitly trivial). This is the local enforcement of the SDD loop's spec-link rule.

1. **Find the spec issue.** Search open `spec`-labelled issues on the repo:

   ```
   mcp__github__list_issues  labels=[spec]  state=open
   ```

   Or read your commit messages (`git log origin/main..HEAD`) for a `#N` reference. If you can't find one, stop and create one via `issue-spec` (or triage whether this is truly `trivial`).

2. **Confirm any open questions on the spec are resolved.** If the spec's `### Open questions` subsection still has unanswered items, stop and resolve them in the issue thread first — the design isn't pinned yet.

3. **Draft the PR body linking line** so you can paste it in: `Closes #N` (full spec), `Part of #N` (one slice of a multi-PR spec), or `Fixes #N` (a defect referenced by a bug spec). Also draft a `## Delivers` subsection listing the exact Plan items you tick with this PR.

4. **Scan the branch's commits for implicit issue references** (advisory, not blocking):

   ```bash
   git log --format='%s%n%b' origin/main..HEAD | grep -oE '#[0-9]+' | sort -u
   ```

   For each `#N`, decide deliberately: **delivers it** → add `Closes #N` (one `Closes` keyword per issue — `Closes #27, Closes #30` works; `Closes #27, #30` leaves #30 open); **only touches it** → `Refs #N`; **false positive** (number inside an identifier/hash) → ignore.

5. **If this is genuinely trivial** (typo, doc-only, one-line obvious fix), skip the spec-link substeps and plan to apply the `trivial` label immediately after `mcp__github__create_pull_request`. Use the label sparingly.

### 4. Push

```bash
git push -u origin <branch>
```

Retry up to 4 times with exponential backoff on transient network errors. **Never** use `--force` on `main` or long-lived branches without explicit ask.

After push, open the PR with the spec-link line in its body (or apply the `trivial` label), then run the post-push CI sweep in `pr-lifecycle` — webhook subscriptions don't fire on every CI surface, so an explicit sweep is the only reliable "is it actually green" check.

## Fast path

If nothing under tracked source paths changed (e.g. docs-only edits), step 2 can be near-trivial. Step 1 is **not** — main may have moved. Step 3 is **not** — the spec-link requirement applies to all non-trivial PRs.

## What this skill does NOT cover

- Writing the spec issue — see `issue-spec`.
- Opening or managing the PR after push — see `pr-lifecycle`.
- The end-to-end dev loop, the area taxonomy, and the repo's check gate — see the repo's `<repo>-dev-process` and CLAUDE.md.
