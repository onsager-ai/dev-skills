---
name: codegraph
description: Pre-indexed code knowledge graph (MCP, SQLite + tree-sitter) for faster, lower-token exploration of brownfield codebases. Use when starting work on a repo larger than ~500 files or when the task involves cross-file traversal — "where is X used", "what calls Y", "what breaks if I change Z", "trace flow from A to B", "explain this subsystem". Skip for single-file edits or sessions shorter than the cold-start cost. Triggers include "codegraph", "code graph", "index this repo", "where is X defined", "find callers of", "callees of", "blast radius of changing X", "explore this codebase". Cuts the grep + Read loops needed to orient, via O(1) SQLite lookups and FTS5 search over 8 MCP tools — but it's an unsound tree-sitter approximation, so grep stays the completeness backstop for renames/exhaustive callers.
---

# codegraph

Local code graph exposed as 8 MCP tools. Accelerates exploration with O(1) SQLite lookups and FTS5 search — slashing the grep + Read loops needed to *orient* in a codebase.

It does **not** replace grep. Codegraph is a tree-sitter *approximation* of the call graph, not a compiler-grade one: it is fast and low-token but **unsound** (it has false negatives). Treat it as the accelerator for orientation and traversal, and keep grep as the source of truth for completeness. See **Soundness & limits** below — this distinction is load-bearing, not a footnote.

## When to use

- Brownfield repo where structure is non-obvious
- Task involves: "where is X used", "what breaks if I change Y", "trace flow from A to B"
- Long-running session — cold-start cost amortizes over multiple queries

## When NOT to use

- Single-file edits or trivial lookups
- Session likely shorter than cold-start cost (see `references/spike.md` for per-repo numbers)
- Repo not initialized AND no cached `.codegraph/` AND short session

## Soundness & limits — read before trusting a result

Codegraph is built on tree-sitter, not the compiler, so its call/reference edges are an **approximation**. It fails in three confirmed ways. The governing rule falls out of them:

> **Grep is the source of truth for *completeness*. Codegraph is the accelerator for *orientation and traversal*. Never invert these.**

The asymmetry is the whole argument: for a refactor, a **false negative is dangerous** (you miss a caller, ship a break); a false positive is merely annoying (you glance and discard). Codegraph has false negatives; grep does not. So codegraph may *propose and rank*, but grep *confirms* whenever the answer must be exhaustive.

The three failure modes (measured on a ~580-file Rust+TS repo):

1. **Unsound edges → false negatives.** `callers`/`callees`/`impact` miss real call sites when the receiver type can't be resolved from syntax alone (calls on locals, generics, trait objects). Measured: a method with **8** real callers returned **2** — the 5 dropped were `local.method()` and generic-dispatch sites, with **no warning**. Exact on unique free-functions + direct calls (verified 1/1, 2/2); unreliable on method dispatch.
2. **Name resolution is fuzzy and overload-blind.** Bare-name queries prefix-match (`useWorkspace` answered for `useWorkspacesQuery` — a *different symbol*) and conflate overloads (`execute`, with 19 definitions, returned `sqlx`'s `.execute()` DB calls, not the trait method). For any name with multiple definitions, drop to `codegraph_node` on a specific symbol id; bare `callers`/`callees` are unattributable.
3. **The index lags the disk.** CLI sees nothing until `codegraph sync` (~0.3s); the MCP file-watcher closes the gap to ~1–2s. Right after an edit, the index is wrong — grep/Read is ground truth until it catches up.

### Decision matrix

| Task | Tool | Why |
|---|---|---|
| Orient / "explain subsystem X" / first survey | **codegraph `explore`** | One call, ranked, verbatim source — far less context than grep+Read |
| Callers of a **uniquely-named** free function | **codegraph `callers`** (trust it) | Exact on unique names + direct calls |
| Find **ALL** callers before a signature change / rename | **grep authoritative**; codegraph only to pre-rank | Codegraph is unsound here — completeness can't depend on it |
| Anything with an **overloaded name** (`execute`, `lookup`, `run`, `new`) | **grep**, or codegraph `node` on a specific id | Bare-name codegraph conflates / under-resolves unpredictably |
| Impact of a core type | **codegraph `impact --depth 1`** to pre-rank, then grep to confirm | Default depth-2 inflates (test fns + one `file` entry per file) and isn't depth-ranked |
| Just-edited code | **grep** (or `codegraph sync` first) | Index is stale until reindex |
| Trait-dispatch / generic call sites | **grep + reading** | Both weak; codegraph silently drops them, grep at least surfaces the text |

**Workflow:** start with `explore` for the map and `callers`/`impact` for direction — but the moment the answer must be *complete* (a rename, "did I get everyone?"), confirm with grep and treat any codegraph-vs-grep delta as "codegraph missed it," not "grep over-matched."

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
