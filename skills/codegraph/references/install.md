# codegraph — Installation

Three environments, three protocols. Pick the row that matches the current session.

## Local workstation (long-lived)

```bash
npm install -g @colbymchenry/codegraph
cd <project-root>
codegraph init -i        # interactive; also indexes
```

Wire MCP server — add to `~/.claude.json`:

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

Restart Claude Code. Auto-allow tools by adding to `~/.claude/settings.json`:

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

Cold-start cost unverified for any target repo. Run `spike.md` against the repo before integrating.

If spike shows acceptable cold-start (rule of thumb: total < session length / 4):

```bash
# At session start, or in a postCreate hook if cloud runtime supports it
npx --yes @colbymchenry/codegraph init
npx @colbymchenry/codegraph index
```

MCP wiring in cloud: codegraph is stdio-only and Claude Code Cloud's MCP support for in-session stdio servers needs verification. Two fallbacks:

1. **CLI bypass** (works today): main session uses `npx codegraph query`, `codegraph context`, etc. directly via Bash. No MCP, no restart needed.
2. **In-session MCP** (verify): if cloud allows editing `.claude.json` per-session, wire codegraph there and check if restart is supported.

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
