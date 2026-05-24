# codegraph — Installation

Three environments, three protocols. Pick the row that matches the current session.

## Local workstation (long-lived)

```bash
npm install -g @colbymchenry/codegraph
cd <project-root>
codegraph init -i        # interactive; also indexes
```

Wire MCP server — easiest path uses the built-in installer (writes `~/.claude.json` and the auto-allow list in one shot):

```bash
codegraph install --target=claude --yes
```

Valid agent IDs are `claude / cursor / codex / opencode / hermes` (not `claude-code`). `--yes` defaults to `--location=global --target=auto`.

To see the snippet without writing anything (useful in environments where editing `~/.claude.json` is gated):

```bash
codegraph install --print-config claude
```

Manual equivalent — add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    }
  }
}
```

Restart Claude Code. If you used the manual path, also add auto-allow to `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__codegraph__codegraph_search",
      "mcp__codegraph__codegraph_context",
      "mcp__codegraph__codegraph_callers",
      "mcp__codegraph__codegraph_callees",
      "mcp__codegraph__codegraph_impact",
      "mcp__codegraph__codegraph_node",
      "mcp__codegraph__codegraph_status",
      "mcp__codegraph__codegraph_files"
    ]
  }
}
```

## Claude Code Cloud session (ephemeral container)

Local spike against onsager / crawlab / leanspec on Node 22 measured **6–12s** for cold init+index (~13–19s including the one-shot `npx install`). Cloud cold-start has not been measured — npx cache state, IO speed, and CPU may differ. Run `spike.md` in a cloud session before integrating.

If the cloud spike confirms a similar range (rule of thumb: cold-start < session length / 4, which is trivially true at 15s):

```bash
# At session start, or in a postCreate hook if cloud runtime supports it
npx --yes @colbymchenry/codegraph init
npx @colbymchenry/codegraph index
```

MCP wiring in cloud: codegraph is stdio-only and Claude Code Cloud's MCP support for in-session stdio servers needs verification. Two fallbacks:

1. **CLI bypass** (works today): main session uses `npx codegraph query`, `codegraph context`, `codegraph files`, etc. directly via Bash. No MCP, no restart needed.
2. **In-session MCP** (verify): if cloud allows editing `~/.claude.json` per-session, run `codegraph install --target=claude --yes` (or paste the snippet from `codegraph install --print-config claude`) and check if restart is supported.

Until verified, default to CLI bypass.

## Devcontainer / Codespaces (best repeat-session cost)

`.codegraph/` survives across container restarts if persisted in the devcontainer volume. Add to `postCreateCommand`:

```bash
npm install -g @colbymchenry/codegraph
codegraph init . && codegraph index .
```

For prebuilt devcontainer images: bake codegraph + indexed `.codegraph/` into the image. Tradeoff: image rebuild required when index is stale.

## Verification

After any install path, confirm health:

```bash
codegraph status
```

Expect: indexed file count > 0, no errors, last sync timestamp recent.

## What `init` creates

`codegraph init` writes `.codegraph/` at the repo root containing:

- `codegraph.db` — the SQLite knowledge graph
- `.gitignore` — auto-generated, excludes `*.db`, `*.db-wal`, `*.db-shm`, `cache/`, `*.log`, `.dirty`

Consumers do **not** need to add `.codegraph/` to the repo's own `.gitignore`. The directory itself is harmless to commit (it carries only the inner `.gitignore`); the DB stays out of version control automatically.
