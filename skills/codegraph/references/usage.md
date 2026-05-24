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

Note: upstream README mentions a `codegraph_explore` tool in some places. As of this skill's drafting it is not in the listed MCP tools table — confirm against the version installed.

## Do

- Main session: use the light tools (`search`, `callers`, `callees`, `impact`, `node`, `files`, `status`) for targeted lookups before editing
- Any "how does X work" / "explain the Y subsystem" / "where is Z implemented" → spawn an Explore subagent and let it use `codegraph_context` (heavy) freely
- Trust subagent results: do not re-read files that the subagent's context already returned source for
- Check `codegraph_status` once per session to confirm index freshness; sync if stale (`codegraph sync`)

## Don't

- Call `codegraph_context` directly in main session — its source blocks pollute main context
- Fall back to grep/glob before trying `codegraph_search` — that defeats the point
- Re-index manually if status shows fresh — the file watcher handles it on local; in cloud sessions the index is bounded to session lifetime anyway
- Trust the index for files modified within the last few seconds — auto-sync has a 2s debounce window

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
| codegraph_context | `codegraph context "<task>" --format markdown --max-nodes <N>` |
| codegraph_files | `codegraph files --json` |
| codegraph_status | `codegraph status` |
| codegraph_callers / callees / impact / node | not exposed as standalone CLI in upstream as of writing — verify |

Use CLI bypass when in cloud session without MCP wiring; the heavy/light distinction still applies.
