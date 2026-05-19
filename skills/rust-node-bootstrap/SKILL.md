---
name: rust-node-bootstrap
description: >
  Scaffold a new Rust+Node.js hybrid monorepo with pnpm workspaces, Cargo workspace,
  CI workflows, and publish infrastructure. Use when: (1) starting a new project from
  scratch, (2) adding missing infrastructure to an existing repo, (3) figuring out the
  canonical project structure for a Rust+Node.js tool. Triggers on "bootstrap",
  "scaffold", "new project", "set up project", or "init" in a Rust+Node.js context.
metadata:
  author: Codervisor
  version: 0.1.0
  homepage: https://github.com/codervisor/forge
---

# Rust+Node.js Bootstrap

Scaffold a Rust+Node.js hybrid project with all infrastructure in one pass.

## When to Use This Skill

Activate when any of the following are true:
- User says "bootstrap", "scaffold", "new project", "set up from scratch"
- Repo has `Cargo.toml` or `package.json` but is missing the other
- Missing `.github/workflows/`, `scripts/`, or `publish.config.ts`
- Incrementally adding forge infrastructure to an existing project

## Decision Tree

```
Starting from scratch?
  YES → Full scaffold (all steps in order below)
  NO  → Incremental setup ↓

Has package.json?       → NO: Create root package.json + pnpm-workspace.yaml
Has Cargo.toml?         → NO: Create Cargo workspace
Has .github/workflows/? → NO: Generate from rust-node-ci skill templates
Has scripts/?           → NO: Generate from rust-npm-publish skill templates
Has publish.config.ts?  → NO: Create from rust-npm-publish skill examples
Has specs/?             → NO: Initialize LeanSpec
```

## Gather Project Info

| Field | Example | Required |
|-------|---------|----------|
| Project name | `my-tool` | Yes |
| npm scope | `@myorg` | Yes |
| Rust binary name(s) | `my-cli` | Yes |
| Cargo package name(s) | `my-cli-rs` | Yes |
| Main npm packages | `packages/cli` | Yes |
| Repository URL | `github.com/myorg/my-tool` | Yes |
| Platforms | `darwin-x64, darwin-arm64, linux-x64, windows-x64` | No (default: all 4) |

## Scaffold Structure

See [references/project-structure.md](./references/project-structure.md) for the full annotated tree.

```
my-tool/
├── .github/workflows/       ← CI + publish workflows
├── .lean-spec/config.json   ← LeanSpec configuration
├── specs/                   ← Spec-driven development
├── packages/cli/            ← Main npm package (thin JS wrapper)
│   ├── package.json         ← bin + optionalDependencies
│   └── bin.js               ← Resolves platform binary, spawns it
├── rust/                    ← Rust workspace
├── scripts/                 ← Publish & version scripts
├── publish.config.ts        ← Publish pipeline configuration
├── package.json             ← Root (version source of truth)
├── pnpm-workspace.yaml      ← pnpm workspace definition
└── Cargo.toml               ← Rust workspace manifest
```

## File Generation Order

Order matters — later files depend on earlier ones:

1. **Root configs** — `package.json`, `pnpm-workspace.yaml`, `Cargo.toml`, `turbo.json`
   Use [templates/bootstrap/](./templates/bootstrap/).
2. **Publish config** — `publish.config.ts` (drives script + workflow generation)
3. **Main package wrapper** — `bin.js` + `package.json` from rust-npm-publish skill templates,
   fill in scope/binary name/platforms
4. **Scripts** — Copy from rust-npm-publish skill templates
5. **Workflows** — Copy from rust-node-ci skill templates, customize matrix
6. **LeanSpec** — Initialize `.lean-spec/config.json` and `specs/`
7. **AGENTS.md** — Project-level agent instructions listing installed skills

## Verify

```bash
pnpm install && pnpm build && cargo check --workspace && pnpm tsx scripts/sync-versions.ts
```

See [references/checklist.md](./references/checklist.md) for the full post-bootstrap checklist.

## Install Companion Skills

After scaffolding, install skills for ongoing development:

```bash
# CI/CD workflows and composite actions
npx skills add codervisor/forge@rust-node-ci -g -y

# npm publishing pipeline and versioning
npx skills add codervisor/forge@rust-npm-publish -g -y

# Spec-driven development
npx skills add codervisor/lean-spec@leanspec-sdd -g -y
```

## Templates

| Directory | Contents |
|-----------|----------|
| [templates/bootstrap/](./templates/bootstrap/) | Root configs: `package.json`, `Cargo.toml`, `pnpm-workspace.yaml`, `turbo.json`, `publish.config.ts` |

## Setup & Activation

```bash
npx skills add codervisor/forge@rust-node-bootstrap -g -y
```

Auto-activates when: user says "bootstrap", "scaffold", "new project", or "init" in a Rust+Node.js context.
