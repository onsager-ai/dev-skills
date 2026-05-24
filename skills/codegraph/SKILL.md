---
name: codegraph
description: Pre-indexed code knowledge graph (MCP, SQLite + tree-sitter) for faster, lower-token exploration of brownfield codebases. Use when starting work on a repo larger than ~500 files or when the task involves cross-file traversal — "where is X used", "what calls Y", "what breaks if I change Z", "trace flow from A to B", "explain this subsystem". Skip for single-file edits or sessions shorter than the cold-start cost. Triggers include "codegraph", "code graph", "index this repo", "where is X defined", "find callers of", "callees of", "blast radius of changing X", "explore this codebase". Replaces grep + Read loops with O(1) SQLite lookups and FTS5 search via 8 MCP tools.
---

# codegraph

Local code graph exposed as 8 MCP tools. Replaces grep + Read loops for exploration with O(1) SQLite lookups and FTS5 search.

## When to use

- Brownfield repo where structure is non-obvious
- Task involves: "where is X used", "what breaks if I change Y", "trace flow from A to B"
- Long-running session — cold-start cost amortizes over multiple queries

## When NOT to use

- Single-file edits or trivial lookups
- Session likely shorter than cold-start cost (see `references/spike.md` for per-repo numbers)
- Repo not initialized AND no cached `.codegraph/` AND short session

## Prerequisites

- Node 18+ on PATH
- Project has `.codegraph/` (run `codegraph init` if not)
- For cloud sessions: cold-start cost verified via `references/spike.md` for the target repo

## Files

- `references/install.md` — installation for local / Claude Code Cloud / devcontainer
- `references/usage.md` — which of the 8 MCP tools to use when, with main-session vs subagent rules
- `references/spike.md` — cold-start measurement protocol; run once per new target repo before relying on codegraph in cloud sessions

## Known integration targets

Cold-start measured locally (Node 22, 4 cores). Cloud cold-start still pending — re-run `references/spike.md` in a cloud session before relying on these numbers there.

| Repo | Indexed files | Nodes / edges | DB size | Cold init+index | Query wall |
|---|---|---|---|---|---|
| onsager-ai/onsager | 578 (rust + tsx/ts) | 8.6k / 20k | 24 MB | 12s | ~0.9s |
| crawlab-team/crawlab | 644 (go) | 6.8k / 15k | 11 MB | 6s | ~0.9s |
| codervisor/leanspec | 695 (tsx/rust/ts) | 8.9k / 21k | 23 MB | 10s | ~0.9s |

Per-query wall is dominated by Node startup — the SQLite work itself is milliseconds. End-to-end cold-start including one-shot `npx install` is ~13–19s for repos in this size class.
