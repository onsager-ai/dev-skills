# Repository hooks

These generated hooks are selected by `.agents/manifest.json`. Enable them once
per clone from the repository root:

```sh
git config core.hooksPath .githooks
```

A relative `core.hooksPath` resolves from the active worktree, so linked
worktrees use their own committed `.githooks` directory. The setting is shared
by the repository; verify it with `git config --get core.hooksPath`.

`pre-commit` runs the selected checks in manifest order. `rustfmt` runs only
when staged added, copied, modified, or renamed Rust files exist; it checks the
working tree, not the index, and reports when a staged Rust file has unstaged
changes. `prettier` checks staged files with the root dependency only. Missing
formatters fail with their remedy. Hooks never compile, typecheck, lint, or run
tests.

`post-checkout` keeps a clean primary checkout on `main`; linked worktrees are
unaffected. It warns instead of reverting a dirty primary checkout. It runs
`post-checkout.local` after the guard. Executable repo-owned
`pre-commit.local` runs after generated pre-commit checks. Local files are never
generated, changed, or removed.

Hooks can be bypassed with `git commit --no-verify`, and clones without the
configuration do not run them. CI remains authoritative; report formatter gate
commands and their actual exit codes.
