# codegraph — Tool Usage Rules

Adapted from upstream's global instructions, with main-session vs subagent split made explicit.

## The 8 MCP tools

| Tool | Use for | Caller scope | Output weight |
|---|---|---|---|
| codegraph_search | Find symbol by name | main + subagent | light |
| codegraph_callers | What calls X | main + subagent | light |
| codegraph_callees | What X calls | main + subagent | light |
| codegraph_impact | Blast radius before editing | main | light |
| codegraph_node | One symbol's details | main + subagent | light–medium |
| codegraph_files | Indexed file structure | main + subagent | light |
| codegraph_status | Index health | main | light |
| codegraph_context | Build task context (returns source blocks) | subagent only | heavy |

Note: newer versions (verified on the npm CLI `v0.9.9`) expose a 9th tool, `codegraph_explore`, and the MCP server's own instructions name it the **PRIMARY** tool: one capped call returns the verbatim source of the relevant symbols grouped by file (Read-equivalent), so for "how does X work" / architecture / "where is X" questions it is usually the *only* call needed — prefer it over a `context`-using subagent on versions that have it.

## Do

- Main session: use the light tools (`search`, `callers`, `callees`, `impact`, `node`, `files`, `status`) for targeted lookups before editing
- Any "how does X work" / "explain the Y subsystem" / "where is Z implemented" → spawn an Explore subagent and let it use `codegraph_context` (heavy) freely
- Trust subagent results: do not re-read files that the subagent's context already returned source for
- Check `codegraph_status` once per session to confirm index freshness; sync if stale (`codegraph sync`)

## Don't

- Call `codegraph_context` directly in main session — its source blocks pollute main context
- Re-index manually if status shows fresh — the file watcher handles it on local; in cloud sessions the index is bounded to session lifetime anyway
- Trust the index for files modified within the last few seconds — auto-sync has a ~1–2s debounce window
- **Trust `callers`/`callees`/`impact` for *completeness*** (every caller before a rename, exhaustive blast radius). They're unsound — they silently drop unresolved method/generic/trait-dispatch edges. Confirm with grep; see SKILL.md → *Soundness & limits*.
- **Query an overloaded name with bare `callers`/`callees`.** Results conflate or under-resolve across same-named definitions. Use `codegraph_node` on a specific symbol id, or grep.

## Grep is the completeness backstop (not a fallback)

Earlier guidance said "don't fall back to grep — that defeats the point." That was wrong, and is corrected here. Grep is not a fallback for codegraph; it is the **authoritative source for completeness** where codegraph is only an accelerator. Use codegraph to *orient and pre-rank*; use grep to *confirm* whenever missing a result is costly (renames, signature changes, security audits). A codegraph-vs-grep delta means "codegraph missed it," not "grep over-matched." Full rationale + the decision matrix live in SKILL.md.

## Subagent prompt template

When delegating exploration, include this in the subagent prompt:

> This project has CodeGraph initialized (`.codegraph/` exists). Use `codegraph_context` as your primary tool — it returns full source sections from all relevant files in one call.
>
> Rules:
> 1. Follow the explore call budget in the tool description; it scales with project size.
> 2. Do not re-read files that `codegraph_context` already returned source code for. The returned sections are complete and authoritative.
> 3. Only fall back to grep/glob/read for files listed under "Additional relevant files" if you need more detail, or if codegraph returned no results.

## CLI equivalents (when MCP is not wired, e.g. cloud sessions)

| MCP tool | CLI command |
|---|---|
| codegraph_search | `codegraph query <name> --json` |
| codegraph_context | `codegraph context "<task>" --format markdown --max-nodes <N>` (absent on some versions, e.g. CLI `v0.9.9` — use `query` + `callers`/`callees` instead) |
| codegraph_files | `codegraph files --json` |
| codegraph_status | `codegraph status` |
| codegraph_callers / callees / impact | `codegraph callers <name>` / `callees <name>` / `impact <name> [--depth N] [--json]` — confirmed present in CLI `v0.9.9` |
| (no `node` subcommand) | use `codegraph query <name>` for a symbol's location |

Use CLI bypass when in cloud session without MCP wiring; the heavy/light distinction still applies.
