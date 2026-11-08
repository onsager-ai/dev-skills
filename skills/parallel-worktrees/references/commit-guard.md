
# Commit guard

One global hook, every repo on the machine, no duplication. The optional dev proxy provides the `wt new <branch>` remedy the hook points at; see [dev proxy](devproxy.md).

## The policy

| Who | Where | Result |
| --- | --- | --- |
| anyone | `main` / `master` | **blocked** |
| agent (`CLAUDECODE=1`) | any branch in the **main checkout** | **blocked** — work in a worktree |
| agent | linked worktree, feature branch | allowed |
| human | feature branch in the main checkout | allowed |
| human | `ALLOW_MAIN_COMMIT=1 git commit` or `--no-verify` | escape hatch |

Scope is automatic: the guard only fires in repos carrying a committed `.envrc` with `export DEV_HOST=` — the marker every dev proxy onboarded repo already has. Other repos on the machine are untouched (the hook silently delegates), and every future onboarded repo is covered with no extra step.

## Install (once per machine)

```sh
mkdir -p ~/.githooks
cp ~/.claude/skills/parallel-worktrees/scripts/pre-commit ~/.githooks/pre-commit
chmod +x ~/.githooks/pre-commit
git config --global core.hooksPath ~/.githooks
```

## Design notes (why it's shaped this way)

- **Global `core.hooksPath`, not per-repo hooks.** One copy of the policy; updating it is editing one file. Per-repo `.githooks` copies drift and need a commit in every repo for every policy change.
- **Delegation keeps repo-specific hooks alive.** Global `hooksPath` *replaces* `.git/hooks` resolution, so the global hook ends by `exec`-ing the repo's committed `.githooks/pre-commit` if present (e.g. onsager's migration-sequence check). Repos must NOT set a local `core.hooksPath` — local config overrides global and would silently drop the guard (watch for repo setup recipes that do this, e.g. a `just setup` running `git config core.hooksPath .githooks`).
- **Agent detection is `CLAUDECODE=1`** — set in every Claude Code Bash session. Other agent runtimes can be added to the same test.
- **Main-checkout detection**: `git rev-parse --git-dir` equals `--git-common-dir` only in the primary checkout; in a linked worktree they differ.
- **The remedy is in the error message** (`use: wt new <branch>`), so an agent hitting the wall self-corrects without reading docs.

## Verify after install

```sh
# in an onboarded repo, on main:        expect "blocked"
git commit --allow-empty -m test
# as an agent in the main checkout on a feature branch: expect "blocked"
# in a `wt new` worktree:               expect commit succeeds
# in a repo without .envrc/DEV_HOST:    expect commit succeeds (guard skipped)
```

## Limits

Local-only: nothing stops a `git push` of an already-existing main commit or a force-push — pair with GitHub branch protection (squash-only PRs) for the remote half. The escape hatch is honor-system by design; the goal is to keep agents on rails, not to be tamper-proof.
