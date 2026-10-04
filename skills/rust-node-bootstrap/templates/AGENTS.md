# AI Agent Instructions

## Project: {{PROJECT_NAME}}

<!-- CUSTOMIZE: Add a one-line project description -->

## Skills

This project uses [forge](https://github.com/codervisor/forge) skills:

| Skill | Description |
|-------|-------------|
| `leanspec-sdd` | Spec-Driven Development — plan before you code (from [codervisor/lean-spec](https://github.com/codervisor/lean-spec)) |
| `codervisor-forge` | Bootstrap, CI/CD, publishing, and versioning for Rust+Node.js |

### Installing Skills

If skills are not already available, install them:

```bash
npx skills add codervisor/forge@codervisor-forge -g -y
npx skills add codervisor/lean-spec@leanspec-sdd -g -y
```

## Conventions

- **Version source of truth**: Root `package.json` — never edit versions elsewhere directly
- **Workspace protocol**: Use `workspace:*` for internal deps during development
- **Specs first**: Create a spec before starting non-trivial work
- **CI must pass**: All PRs require passing CI (Node + Rust checks)

## Build & Test

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm typecheck        # Type check
pnpm lint             # Lint
cargo test --workspace  # Rust tests
cargo clippy --workspace  # Rust lints
```

## Publishing

Publishing is handled by CI via `.github/workflows/publish.yml`.
See `publish.config.ts` for configuration.

Manual version bump:
```bash
npm version patch     # Bump version in root package.json
pnpm tsx scripts/sync-versions.ts  # Propagate to all packages
```

## Human decisions

When a concrete decision remains for a human, use the available structured question tool: `AskUserQuestion` in Claude Code, or `request_user_input` / `request_user_input_async` in Codex where exposed and permitted. Do not leave the decision only in a plain-text question, final response, or "Human decides" checklist. State the decision, relevant context, options and tradeoffs in the tool call; wait for an explicit answer before dependent work and reconcile it into the spec or decision record. Continue independent authorized work and do not re-ask settled decisions. If no permitted question tool is available, state that limitation and the unresolved decision, keep dependent work blocked, and use the repository's established human handoff channel. Silence, elapsed time and a recommended option are not approval.
