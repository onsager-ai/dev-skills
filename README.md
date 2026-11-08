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

## Skills

The selected pilot procedures are harness-neutral. Their [harness-operations](skills/harness-operations/SKILL.md) dependency maps actual capabilities and loads only the matching Claude/Codex reference. Other optional catalog skills below retain their declared prerequisites.

| Skill | One-liner |
| --- | --- |
| [`issue-spec`](skills/issue-spec/SKILL.md) | Create/revise a focused spec under the repo's contribution policy; use its local medium, labels and impact overlays. |
| [`pre-push`](skills/pre-push/SKILL.md) | Before committing or pushing — commit discipline, merge-preview sync, conflict recovery, the repo's check gate and contribution-process confirmation. |
| [`pr-lifecycle`](skills/pr-lifecycle/SKILL.md) | After a PR exists — delivery links, review comments, CI (delegates failures to `ci-triage`), conflicts and exact check state. |
| [`ci-triage`](skills/ci-triage/SKILL.md) | Failed GitHub Actions runs — regression vs flake vs infra vs insufficient evidence, reproduced with repository-owned gates. |
| [`docs-drift-guard`](skills/docs-drift-guard/SKILL.md) | One authored home per fact, generated references, executed examples and link checks. |
| [`ui-design`](skills/ui-design/SKILL.md) | Reconcile requirements and visual baselines, review actual diffs and implement within the existing frontend; Storybook as the review surface. |
| [`harness-operations`](skills/harness-operations/SKILL.md) | Capability adapter mapping common procedures onto Claude Code, Codex or ChatGPT Work tools. Pulled in automatically as a dependency. |
| [`railway`](skills/railway/SKILL.md) | Operate Railway deployments from the CLI — logs, metrics, variables, deploys, rollbacks, SSH, DB shell. |
| [`plan-dag`](skills/plan-dag/SKILL.md) | Render an issue / sub-issue / PR plan as a high-DPI PNG dependency DAG, color-coded by status. |
| [`parallel-worktrees`](skills/parallel-worktrees/SKILL.md) | Parallel agent sessions on `git worktree` branches, with optional commit guard hook and per-worktree dev proxy. |
| [`github-integration`](skills/github-integration/SKILL.md) | Generic `gh` CLI patterns and cloud-auth pitfalls not covered by the PR/CI procedures. |
| [`agent-browser`](skills/agent-browser/SKILL.md) | Generic browser automation CLI — navigate, click, fill, screenshot, scrape. |
| [`codegraph`](skills/codegraph/SKILL.md) | Pre-indexed code knowledge graph (MCP, SQLite + tree-sitter) for cross-file exploration of large brownfield repos. |

Each SKILL.md stays under 10 KB and each description under 400 characters (`npm run check:frontmatter`); detail lives in the skill's `references/`, loaded only when needed. Project-specific skills (for example the former `web-testing` and `rust-*` skills, available in git history) belong in the consuming repository as local skills.

## What lives here vs. what stays per-repo

| Class | Where it lives | Example |
| --- | --- | --- |
| Cross-repo methodology | **dev-skills** (this repo) | `issue-spec`, `pre-push`, `pr-lifecycle`, `ci-triage`, `plan-dag` |
| User-facing product loop | `onsager-ai/onsager-skills` | `onsager-design-workflow`, `onsager-run-workflow` |
| Repo-local dev process | the consumer repo's `.agents/skills/` (`local_skills`) | `onsager-dev-process`, `duhem-dev-process` |

A repo-local skill stays local when it carries the repo's specific area taxonomy, build-tool conventions, or product-specific seams — `<repo>-dev-process` is the canonical such skill. A skill belongs here when the procedure generalizes — Onsager, lean-spec, and Duhem all benefit from the same shape with at most a thin CLAUDE.md overlay. The pre-push and PR-lifecycle workflows used to be per-repo (`onsager-pre-push`, `duhem-pr-lifecycle`, …); they converged enough to consolidate into the global `pre-push` / `pr-lifecycle` skills, with each repo's gate command, collision patterns, and CI-failure table overlaid via its AGENTS.md / `<repo>-dev-process`.

## Contributing

This bundle is the consolidation target for engineering-methodology skills used across the listed repos. To change a skill:

1. Open a PR against this repo with the SKILL.md edit (and any accompanying `scripts/` / `references/` / `templates/` changes).
2. Get it reviewed and merged.
3. Checkout-local consumers receive reviewed update PRs from their generated workflow. Generated copies in consumers are read-only; change them here.

## Adopting in another repo

Use [checkout-local synchronization](agent-config/README.md). Select shared skills,
common rules and local skill names in the manifest, generate once, and commit the
result. Normal developers then clone and work; scheduled draft-update PRs maintain
the pinned source. Repository contracts and overlays retain local ownership.

## License

MIT. See [LICENSE](LICENSE).
