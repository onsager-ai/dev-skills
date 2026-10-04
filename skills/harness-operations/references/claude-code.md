# Claude Code mechanics

Load this reference only in an observed Claude Code session.

- Root CLAUDE.md imports AGENTS.md through native `@AGENTS.md`. The repository's
  adapter owns actual Claude-only constraints and mechanics; it does not change
  the common procedure or expand session scope.
- Skills are discovered through the generated `.claude/skills` directories.
  Invoke a catalogued skill with `/skill-name` when the installed surface supports
  it. Native AGENTS support does not imply `.agents/skills` discovery.
- Use exposed Read/Edit/Write or shell tools according to their actual schemas,
  current permissions and repository editing rules. Prefer narrow edits to
  existing files; follow a repository's explicit large-write workaround.
- GitHub MCP tools vary by installation and provider. Discover the available
  operation and schema instead of requiring a historical namespace or method.
  Use existing authenticated CLI capabilities only when available and permitted.
- Subscription/context/memory diagnostics are version/surface dependent. If a
  repo's cloud default requests a subscription but the capability is absent,
  perform the explicit status/check sweep and report the limitation.
- Keep native permission/model/tool-selection configuration in native adapters.
  Treat hook enforcement separately from prose guidance. Do not claim that a
  file's presence proves root/module injection or that one Claude surface proves
  another; verify current context and skill catalog on the actual target version.

## Human decision requests

Use `AskUserQuestion` for a pending human choice, clarification or required confirmation when the tool is exposed and permitted. Put the concrete decision and sufficient context in its question, with concise options and tradeoffs under the actual schema. A plain-text question or final-response checklist does not substitute for the tool call. Wait for the answer before dependent work; continue independent authorized work. Do not re-ask a decision already settled by the task. If an unattended surface has no answer channel, report the limitation and use its established durable handoff; never infer approval. Native permission dialogs remain native permission gates.
