# dev-skills

Cross-repo **engineering-methodology skills** — the dev-process scaffolding
that has converged across [`onsager-ai/onsager`](https://github.com/onsager-ai/onsager),
[`onsager-ai/onsager-skills`](https://github.com/onsager-ai/onsager-skills),
[`onsager-ai/duhem`](https://github.com/onsager-ai/duhem), and
[`codervisor/lean-spec`](https://github.com/codervisor/lean-spec) and is
worth maintaining once in one place. Each repo previously carried its
own copy; this bundle consolidates them so a single `npx skills add`
installs the lot.

## Install

```bash
# Install every skill, user-global, for Claude Code.
npx skills add -g onsager-ai/dev-skills --skill '*' -a claude-code
```

Installed under `~/.claude/skills/<skill-name>/`. The skills load
automatically whenever Claude Code starts in any directory.

To install a single skill, drop the `'*'`:

```bash
npx skills add -g onsager-ai/dev-skills --skill plan-dag -a claude-code
```

Project-scope (drops symlinks into `./.claude/skills/`) is also
supported, but for cross-repo dev skills the global install is the
intended shape — one machine, one canonical copy.

## Skills

| Skill | One-liner |
| --- | --- |
| [`issue-spec`](skills/issue-spec/SKILL.md) | Create lean-spec-style GitHub issues as specs for human-AI aligned implementation. Repo-agnostic methodology; consumer repos overlay their area taxonomy via CLAUDE.md. |
| [`plan-dag`](skills/plan-dag/SKILL.md) | Render an issue / sub-issue / PR plan as a high-DPI PNG dependency DAG, color-coded done / in-progress / available-next / blocked. |
| [`ci-triage`](skills/ci-triage/SKILL.md) | Triage failed CI runs on any GitHub-Actions–driven repo — regression vs flake vs infra, with a rolling `main-red` issue. |
| [`web-testing`](skills/web-testing/SKILL.md) | L2 AI-driven web UI testing for React/Vite dashboards. Procedure is repo-agnostic; example routes are Onsager-shaped, forkable. |
| [`railway`](skills/railway/SKILL.md) | Operate Railway deployments from the CLI — logs, metrics, variables, deploys, SSH, DB shell. Optional bundled scripts are Onsager-specific wrappers. |
| [`agent-browser`](skills/agent-browser/SKILL.md) | Browser automation CLI for AI agents — navigate, click, fill, screenshot, scrape. |
| [`git-commit`](skills/git-commit/SKILL.md) | Disciplined git commit workflow — stage, write a clear message, commit. |
| [`github-integration`](skills/github-integration/SKILL.md) | GitHub CLI patterns (`gh`) for issues, PRs, and cloud-auth pitfalls. |
| [`parallel-worktrees`](skills/parallel-worktrees/SKILL.md) | Coordinate multiple agent sessions on parallel `git worktree` branches. |
| [`rust-node-bootstrap`](skills/rust-node-bootstrap/SKILL.md) | Scaffold a new Rust + Node.js hybrid project (Cargo + pnpm + Turbo). |
| [`rust-node-ci`](skills/rust-node-ci/SKILL.md) | GitHub Actions workflows for Rust + Node.js hybrid repos. |
| [`rust-npm-publish`](skills/rust-npm-publish/SKILL.md) | Publish a Rust+Node hybrid as platform-specific npm packages with version sync. |
| [`codegraph`](skills/codegraph/SKILL.md) | Pre-indexed code knowledge graph (MCP, SQLite + tree-sitter) for cross-file exploration of brownfield repos. Cloud cold-start spike protocol included. |

## What lives here vs. what stays per-repo

| Class | Where it lives | Example |
| --- | --- | --- |
| Cross-repo methodology | **dev-skills** (this repo) | `issue-spec`, `plan-dag`, `ci-triage` |
| User-facing product loop | `onsager-ai/onsager-skills` | `onsager-design-workflow`, `onsager-run-workflow` |
| Repo-local dev process | the consumer repo's `.claude/skills/` | `onsager-dev-process`, `lean-spec-pre-push`, `duhem-pr-lifecycle` |

A repo-local skill stays local when it carries the repo's specific
area taxonomy, build-tool conventions, or product-specific seams. A
skill belongs here when the procedure generalizes — Onsager, lean-spec,
and Duhem all benefit from the same shape with at most a thin CLAUDE.md
overlay.

## Contributing

This bundle is the consolidation target for engineering-methodology
skills used across the listed repos. To change a skill:

1. Open a PR against this repo with the SKILL.md edit (and any
   accompanying `scripts/` / `references/` / `templates/` changes).
2. Get it reviewed and merged.
3. Re-run `npx skills add -g onsager-ai/dev-skills --skill '*' -a claude-code`
   in every consumer repo's working directory (or globally on each
   developer machine) to pick up the new version.

The installed copies under `~/.claude/skills/` are **read-only**.
Consumer repos that include the `check-skill-edit.sh` PreToolUse hook
will block direct edits to any installed copy that carries a
`.upstream-source` marker — the fix is to PR upstream and re-run
`npx skills add`.

## Adopting a skill in another repo

If you're adding a new consumer repo that wants every skill here,
just run the install one-liner. If your repo only needs one or two,
install them individually with `--skill <name>`. Skills with
`<repo>-pr-lifecycle`-shaped pointers (like `ci-triage`) expect the
consumer repo to provide its own sister skill; the consumer's
CLAUDE.md should name it and reference the dev-skills counterpart.

## License

MIT. See [LICENSE](LICENSE).
