# Codex mechanics

Load this reference only in an observed Codex session.

- AGENTS.md is the portable repository contract. Codex selects a supported
  root-to-working-directory instruction chain; more-specific override selection,
  fallback names and context budgets are version/configuration dependent.
  Explicitly discover module instructions before editing outside the injected
  chain. CLAUDE.md and its settings/hooks are not Codex enforcement surfaces.
- Skills are discovered through `.agents/skills` at supported repository locations.
  Invoke a catalogued skill with `$skill-name` on surfaces supporting that syntax.
  Do not infer discovery from a file existing or from an ancestor's catalog.
- Use exposed file-edit/patch and execution tools under their actual schema and
  environment permissions. Working files can be inspected with shell tools;
  honor repository worktree rules and preserve unrelated edits.
- Connected GitHub tools may appear through the app/connector tool catalog. Match
  the required operation (issue create/update, PR mutation, tree/commit/ref,
  workflow/check metadata, logs or commit statuses) to the available schema.
  Reuse configured credentials; CLI publication and connector publication may
  have different authentication. Verify exact tree identity for API publication.
- Use subscriptions only if the catalog exposes them. A completed tool call or
  ended turn does not itself establish a background CI watcher.
- Codex CLI and Cloud need independent discovery evidence. Project configuration,
  agent networking, setup dependencies and cache reuse are separate axes. Checked-in
  workflows eliminate personal skill installation; they do not provision product
  build dependencies or prove Cloud instruction injection.

## Human decision requests

Use the exposed structured question capability (`request_user_input` or `request_user_input_async`) under its current schema and mode restrictions for pending human decisions. Prefer a permitted asynchronous tool when the synchronous tool is unavailable in the current mode. These are the Codex equivalents of Claude Code's `AskUserQuestion`; do not invent a Claude tool in Codex. A plain-text question or final-response checklist does not substitute for an available permitted tool. Keep dependent work blocked until an explicit answer arrives, including after an asynchronous call; continue independent authorized work. Do not re-ask settled decisions. If no permitted question tool exists, state that limitation and use the established handoff channel without treating silence or elapsed time as approval.
