---
name: plan-dag
description: Render a GitHub plan as a high-DPI PNG dependency DAG showing status, blockers, available work and critical path. Use for "plan as dag", "dependency graph", "what's blocking what", "what can be parallelized", or sequencing an umbrella issue or a recent what's-next survey.
allowed-tools: Read, Bash(git log:*), Bash(git status:*), Bash(git branch:*), Bash(.claude/skills/plan-dag/scripts/plan-dag-render.py:*), Bash(~/.claude/skills/plan-dag/scripts/plan-dag-render.py:*), Bash(.claude/skills/plan-dag/scripts/plan-dag-render.test.sh:*), Bash(~/.claude/skills/plan-dag/scripts/plan-dag-render.test.sh:*), mcp__github__issue_read, mcp__github__list_issues, mcp__github__search_issues, mcp__github__list_pull_requests, mcp__github__pull_request_read, mcp__github__search_pull_requests, mcp__github__list_commits
---

# plan-dag

Render a GitHub-backed plan as a high-DPI PNG dependency DAG to show sequencing, the critical path and parallel work. The repo-agnostic workflow uses issue/sub-issue links, dependency prose and PR/commit references; it does not assume repo-specific labels or process skills. Send the PNG via `SendUserFile` with a prose recommendation.

Use after a `what's next` survey, for an umbrella's remaining work, before choosing a branch, or when a spec fans out with non-linear dependencies. Skip a single-PR spec, an unanswered design question, or a linear chain of at most three nodes.

Scope defaults to the current branch's spec, the named umbrella or the issues just surveyed. Use spec-level granularity, dropping to sub-issue/PR level for a fanned-out umbrella. PNG is the only output; `--out <path>` is required. Emoji are on by default; use `--emoji=off` if the rendering system lacks a color emoji font.

## Workflow

1. **Discover.** Resolve scope from the conversation. Walk an umbrella's sub-issues with `mcp__github__issue_read` (`get_sub_issues`), or reuse the surveyed node IDs. For every node read current issue state, `state_reason`, priority and relevant sub-issues; issue comments; all linked PRs and their state, draft, mergeability, comments and reviews; and recent default-branch commits referencing it. Reconcile signals rather than relying on one. A merged closing PR means done even if the issue remains open; an open follow-up PR can make a closed-but-not-completed issue in progress.
2. **Refresh on every render.** Re-fetch all node states, PR states and review status, and recent comments on previously ambiguous nodes, even for a requested re-render. Never reuse prior classifications.
3. **Classify.** `done` means closed with `state_reason: completed` or a merged PR; `in_progress` means an open linking PR; `open` means open with no PR. The renderer derives blocked and available-next from predecessors; do not supply separate statuses.
4. **Build cited edges.** Use formal sub-issue links (child → parent), explicit issue body or comment prose (`Depends on`, `Blocks`, `Part of`, `Closes`), and PR/commit references or documented ordering. Never invent an uncited edge. Place uncited context in a label or prose, not an edge.
5. **Render and explain.** Emit JSON IR using the schema in the reference; every edge needs a documented source and valid endpoints. Use the bundled renderer, not hand-drawn boxes. Send the PNG via `SendUserFile`, then explain the critical path, next pickable node and sequencing rationale. Keep editorial comments out of node labels. For dense tracks, summarize more than about three done nodes in prose. Render one framing per response; for wide graphs over 10 nodes with cross-edges, split into per-track DAGs and list cross-edges in prose.

```bash
SCRIPT=.claude/skills/plan-dag/scripts/plan-dag-render.py
# User-global install: SCRIPT=~/.claude/skills/plan-dag/scripts/plan-dag-render.py
"$SCRIPT" /tmp/plan.json --out /tmp/plan-dag.png
# Add --emoji=off if needed.
```

Choose whichever installed script exists. The renderer requires Graphviz `dot`, Node ≥18 and Playwright Chromium; it fails with installation guidance when missing. Fix `IR validation failed` in the IR rather than drawing a workaround.

## References

- [Full workflow and renderer reference](references/full-procedure.md) — read when gathering detailed evidence, preparing the JSON schema, interpreting visual encodings, troubleshooting prerequisites, running renderer tests, or applying edge and response conventions.
