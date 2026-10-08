# dev-skills

Cross-repo **engineering-methodology skills** — the dev-process scaffolding that has converged across [`onsager-ai/onsager`](https://github.com/onsager-ai/onsager), [`onsager-ai/onsager-skills`](https://github.com/onsager-ai/onsager-skills), [`onsager-ai/duhem`](https://github.com/onsager-ai/duhem), and [`codervisor/lean-spec`](https://github.com/codervisor/lean-spec) and is worth maintaining once in one place. Each repo previously carried its own copy; this bundle owns the shared source used by generated checkout-local consumers.

## Agent configuration review

The [Agent Configuration Standard v1 draft](docs/agent-configuration-v1.md) proposes repository-owned contracts, native harness adapters and pinned checkout-local workflows. See the [decision register](docs/agent-architecture-decisions.md) and [pilot adoption status](docs/agent-architecture-adoption.md). The standard remains a review proposal. The revised pilots use [checkout-local synchronization](agent-config/README.md), so a normal clone needs no personal installation.

## ChatGPT Work

Work can reuse the same repository-owned contracts and pinned skills. Its native
capability mapping is [ChatGPT Work mechanics](skills/harness-operations/references/chatgpt-work.md).
A ChatGPT Project does not by itself establish that a repository's instructions
or skill catalog were loaded.

Add a short entrypoint in the Project's settings, adapting the repository names
and communication preferences. For example:

```text
This project covers onsager-ai/semon and onsager-ai/semon-hub.
Communicate in Chinese; write GitHub issues and pull requests in English.

For repository tasks, resolve the target repository, branch and commit.
Read AGENTS.md and .agents/manifest.json at that commit, then load only
the relevant .agents/skills/<name>/SKILL.md files and necessary dependencies.
Read applicable module instructions before editing.

Prefer the available local checkout; otherwise use connected GitHub
file reads at the same commit. Refresh these sources when the task ref changes.
Follow the target repository's pinned manifest and canonical skill copies.
Update shared behavior in dev-skills and regenerate managed projections.
```

Use the current Work catalog for installed skills. Reading a repository SKILL.md
through GitHub is explicit workflow loading, not plugin installation or proof of
automatic discovery. No personal installation is needed for that read path;
actual GitHub access and execution capabilities remain separate prerequisites.

Validate source changes with `npm run check`, then synchronize consumers using
their existing pinned-source process. Record a fresh Work session's actual
instruction and skill reads separately from static checks. Plugin packaging and
distribution are a separate opt-in step; this entrypoint does not install one.

## Legacy personal installation

```bash
# Install every skill, user-global, for Claude Code.
npx skills add -g onsager-ai/dev-skills --skill '*' -a claude-code
```

Installed under `~/.claude/skills/<skill-name>/`. The skills load automatically whenever Claude Code starts in any directory.

To install a single skill, drop the `'*'`:

```bash
npx skills add -g onsager-ai/dev-skills --skill plan-dag -a claude-code
```

Project-scope (drops symlinks into `./.claude/skills/`) is also supported, but the revised pilot distribution is checkout-local and checked in; personal installs are optional legacy usage.

## Skills

The selected pilot procedures are harness-neutral. Their [harness-operations](skills/harness-operations/SKILL.md) dependency maps actual capabilities and loads only the matching Claude/Codex reference. Other optional catalog skills below retain their declared prerequisites.

| Skill | One-liner |
| --- | --- |
| [`issue-spec`](skills/issue-spec/SKILL.md) | Create/revise a focused spec under the repo's contribution policy; use its local medium, labels and impact overlays. |
| [`ui-design`](skills/ui-design/SKILL.md) | Coordinate Stitch/pen.dev extraction, refinement and existing-stack implementation; optional shared user tooling, repository-owned design contracts and honest desktop/cloud validation. |
| [`pre-push`](skills/pre-push/SKILL.md) | Pre-push checklist for the SDD loop — sync the merge preview, walk merge-conflict patterns, run the repo's check gate, confirm a linked spec. Repo-agnostic; the gate command + collision patterns come from the consumer's AGENTS.md. |
| [`pr-lifecycle`](skills/pr-lifecycle/SKILL.md) | Post-push PR workflow — spec linking, Delivers, tracker refresh, CI triage (delegates to `ci-triage`), conflict recovery, webhook + post-push CI sweep. Repo-agnostic; CI-failure patterns come from the consumer's AGENTS.md. |
| [`plan-dag`](skills/plan-dag/SKILL.md) | Render an issue / sub-issue / PR plan as a high-DPI PNG dependency DAG, color-coded done / in-progress / available-next / blocked. |
| [`ci-triage`](skills/ci-triage/SKILL.md) | Triage failed CI runs on any GitHub-Actions–driven repo — regression vs flake vs infra, with a rolling `main-red` issue. |
| [`docs-drift-guard`](skills/docs-drift-guard/SKILL.md) | Keep prose docs in sync with code — the drift-resistance ladder + altitude/one-home discipline, plus the `@onsager/docs-drift-check` CI floor that fails on any dead repo-relative link a Markdown doc cites. |
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
| [`worktree-devproxy`](skills/worktree-devproxy/SKILL.md) | Per-worktree compose stacks behind one shared Traefik — `http://<worktree>.<repo>.localhost:8000`, Host-header routing, zero host ports / DNS / TLS. Bundles the `wt` manager script. |
| [`worktree-discipline`](skills/worktree-discipline/SKILL.md) | One machine-global pre-commit hook: no commits on main, agents must work in worktrees (`CLAUDECODE=1` detection), auto-scoped to devproxy-onboarded repos, delegates to repo-local hooks. |

## What lives here vs. what stays per-repo

| Class | Where it lives | Example |
| --- | --- | --- |
| Cross-repo methodology | **dev-skills** (this repo) | `issue-spec`, `pre-push`, `pr-lifecycle`, `ci-triage`, `plan-dag` |
| User-facing product loop | `onsager-ai/onsager-skills` | `onsager-design-workflow`, `onsager-run-workflow` |
| Repo-local dev process | the consumer repo's `.claude/skills/` | `onsager-dev-process`, `duhem-dev-process` |

A repo-local skill stays local when it carries the repo's specific area taxonomy, build-tool conventions, or product-specific seams — `<repo>-dev-process` is the canonical such skill. A skill belongs here when the procedure generalizes — Onsager, lean-spec, and Duhem all benefit from the same shape with at most a thin CLAUDE.md overlay. The pre-push and PR-lifecycle workflows used to be per-repo (`onsager-pre-push`, `duhem-pr-lifecycle`, …); they converged enough to consolidate into the global `pre-push` / `pr-lifecycle` skills, with each repo's gate command, collision patterns, and CI-failure table overlaid via its AGENTS.md / `<repo>-dev-process`.

## Contributing

This bundle is the consolidation target for engineering-methodology skills used across the listed repos. To change a skill:

1. Open a PR against this repo with the SKILL.md edit (and any accompanying `scripts/` / `references/` / `templates/` changes).
2. Get it reviewed and merged.
3. Checkout-local consumers receive reviewed update PRs from their generated workflow. Legacy personal installs can be refreshed manually.

The installed copies under `~/.claude/skills/` are **read-only**. Consumer repos that include the `check-skill-edit.sh` PreToolUse hook will block direct edits to any installed copy that carries a `.upstream-source` marker — the fix is to PR upstream and re-run `npx skills add`.

## Adopting in another repo

Use [checkout-local synchronization](agent-config/README.md). Select shared skills,
common rules and local skill names in the manifest, generate once, and commit the
result. Normal developers then clone and work; scheduled draft-update PRs maintain
the pinned source. Repository contracts and overlays retain local ownership.
Legacy personal installation above remains optional.

## License

MIT. See [LICENSE](LICENSE).
