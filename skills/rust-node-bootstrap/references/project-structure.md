# Project Structure Reference

Full directory tree for a bootstrapped Rust+Node.js hybrid project with all
forge skills configured.

## Complete Tree

```
my-tool/
├── .github/
│   └── workflows/
│       ├── ci.yml                          ← CI: lint, test, build (Node + Rust)
│       ├── publish.yml                     ← Publish: cross-build → npm publish
│       └── copilot-setup-steps.yml         ← Copilot agent onboarding
│
├── .lean-spec/
│   └── config.json                         ← LeanSpec project configuration
│
├── specs/
│   └── README.md                           ← Spec-driven development entry point
│
├── packages/
│   └── cli/                                ← Main npm package (thin JS wrapper)
│       ├── package.json                    ← bin + optionalDependencies
│       └── bin.js                          ← Resolves platform binary, spawns it
│
├── rust/                                   ← Rust workspace root (or root-level)
│   ├── Cargo.toml                          ← Workspace manifest
│   └── crates/
│       └── my-cli-rs/                      ← Rust CLI crate
│           ├── Cargo.toml
│           └── src/
│               └── main.rs
│
├── scripts/
│   ├── sync-versions.ts                    ← Propagate version to all packages
│   ├── generate-platform-manifests.ts      ← Create platform package.json files
│   ├── add-platform-deps.ts               ← Add optionalDependencies to main pkg
│   ├── copy-platform-binaries.sh           ← Copy compiled binaries to pkg dirs
│   ├── validate-platform-binaries.ts       ← Validate binary headers (ELF/Mach-O/PE)
│   ├── prepare-publish.ts                  ← Replace workspace:* with real versions
│   ├── validate-no-workspace-protocol.ts   ← Ensure no workspace:* remains
│   ├── publish-platform-packages.ts        ← Publish platform packages to npm
│   ├── publish-main-packages.ts            ← Publish main packages to npm
│   ├── restore-packages.ts                 ← Restore workspace:* after publish
│   └── bump-dev-version.ts                 ← Bump to dev pre-release version
│
├── platform-packages/                      ← Generated at publish time
│   ├── cli-darwin-arm64/
│   ├── cli-darwin-x64/
│   ├── cli-linux-x64/
│   └── cli-windows-x64/
│
├── package.json                            ← Root (version source of truth)
├── pnpm-workspace.yaml                     ← Workspace definition
├── publish.config.ts                       ← Publish pipeline configuration
├── Cargo.toml                              ← Root Cargo workspace (if not in rust/)
├── turbo.json                              ← Turborepo config (optional)
├── tsconfig.json                           ← TypeScript config
├── AGENTS.md                               ← Agent instructions
└── README.md
```

## Directory Purposes

### `.github/workflows/`

GitHub Actions workflow files. Three workflows cover the full lifecycle:

- **ci.yml** — Runs on PR/push: Node.js build+test+lint, Rust build+test+clippy+fmt
- **publish.yml** — Runs on release/dispatch: cross-build Rust binaries, publish to npm
- **copilot-setup-steps.yml** — Lets GitHub Copilot build your project for code assistance

### `specs/`

Spec-Driven Development directory managed by LeanSpec. Contains markdown spec
files that capture requirements, design decisions, and implementation plans.

### `packages/`

Node.js packages in the pnpm workspace. At minimum, the main CLI package that
wraps the Rust binary. Can contain additional packages (SDK, shared utils, etc.).

### `rust/` or root-level Cargo

Rust workspace containing one or more crates. Can be at root level (root `Cargo.toml`
is the workspace) or nested in a `rust/` directory.

### `scripts/`

TypeScript publish pipeline scripts. These are config-driven — they read
`publish.config.ts` for project-specific values. Copy from forge templates.

### `platform-packages/`

Generated directories for platform-specific npm packages. Each contains a
`package.json` with `os`/`cpu` fields and the compiled binary. Not committed
to git — generated during the publish workflow.

## Variations

### Single binary vs. multiple binaries

```
# Single binary (simpler)
binaries: [{ name: 'my-cli', scope: 'cli', cargoPackage: 'my-cli-rs' }]
# → 4 platform packages: @scope/cli-{platform}

# Multiple binaries
binaries: [
  { name: 'my-cli', scope: 'cli', cargoPackage: 'my-cli-rs' },
  { name: 'my-mcp', scope: 'mcp', cargoPackage: 'my-mcp-rs' },
]
# → 8 platform packages: @scope/cli-{platform} + @scope/mcp-{platform}
```

### Root vs. nested Rust workspace

```
# Root-level (Cargo.toml at repo root)
cargoWorkspace: 'Cargo.toml'

# Nested (Cargo.toml in rust/ subdirectory)
cargoWorkspace: 'rust/Cargo.toml'
```
