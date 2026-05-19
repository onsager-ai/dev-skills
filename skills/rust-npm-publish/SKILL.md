---
name: rust-npm-publish
description: >
  Publish Rust binaries to npm using the optionalDependencies platform package pattern.
  Covers the full publish pipeline, version sync, workspace:* protocol, and platform
  package architecture. Use when: (1) publishing Rust binaries to npm, (2) setting up
  the platform package pattern (main + per-OS packages), (3) debugging publish failures,
  (4) managing version sync across pnpm + Cargo workspaces, (5) working with workspace:*
  protocol. Triggers on "publish", "platform packages", "optionalDependencies", "bin.js",
  "version sync", "workspace protocol", "npm tag", or "prepare-publish".
metadata:
  author: Codervisor
  version: 0.1.0
  homepage: https://github.com/codervisor/forge
---

# Rust npm Publishing

Distribute Rust binaries to npm using the `optionalDependencies` platform package pattern.

## When to Use This Skill

Activate when any of the following are true:
- Publishing Rust binaries to npm or debugging publish pipeline failures
- Setting up `publish.config.ts`, `bin.js`, or platform package manifests
- Managing version sync across workspace packages and `Cargo.toml`
- Working with `workspace:*` protocol or prepare/restore scripts
- Scripts matching `*publish*`, `*platform*`, `*version*`, or `*sync*` exist

## Decision Tree

```
What does the user need?

Setting up publishing for the first time?
  → The Pattern section + Configuration + Templates

Running the publish pipeline?
  → Publish Pipeline section
  → Full details: references/publish-pipeline.md

Adding a new platform?
  → Adding a New Platform section
  → Platform reference: references/platform-matrix.md

Version sync / bump?
  → Versioning section
  → Full strategy: references/version-strategy.md
  → workspace:* details: references/workspace-protocol.md

Debugging a failure?
  → references/troubleshooting.md
```

## The Pattern

```
@scope/my-tool                    ← main package (thin JS wrapper + bin.js)
├── optionalDependencies:
│   ├── @scope/my-tool-darwin-arm64   ← macOS ARM (M-series)
│   ├── @scope/my-tool-darwin-x64     ← macOS Intel
│   ├── @scope/my-tool-linux-x64      ← Linux x86_64
│   └── @scope/my-tool-windows-x64    ← Windows x86_64
```

Each platform package contains **only** the pre-compiled binary for that target.
npm installs only the one matching the user's OS/CPU at install time.

Same approach used by SWC, Turbopack, esbuild, and similar tools.

## Configuration

Each repo provides a `publish.config.ts` (see [examples/](./examples/)):

```typescript
export default {
  scope: '@myorg',
  binaries: [{ name: 'my-cli', scope: 'cli', cargoPackage: 'my-cli-rs' }],
  platforms: ['darwin-x64', 'darwin-arm64', 'linux-x64', 'windows-x64'],
  mainPackages: [{ path: 'packages/cli', name: 'my-cli' }],
  cargoWorkspace: 'Cargo.toml',
  repositoryUrl: 'https://github.com/myorg/my-project',
};
```

## Publish Pipeline

```
sync-versions → generate-manifests → add-platform-deps → copy-binaries
→ validate-binaries → prepare-publish → validate-workspace → publish-platforms
→ wait-propagation → publish-main → restore-packages
```

**Critical ordering**: Platform packages MUST be published and propagated before
main packages, because main packages reference them as `optionalDependencies`.

See [references/publish-pipeline.md](./references/publish-pipeline.md) for step-by-step details.

## Main Package Wrapper (`bin.js`)

The main npm package is a **thin JS wrapper** — `bin.js` resolves the platform binary and spawns it.
See [templates/wrapper/](./templates/wrapper/) for the template.

Key details:
- `process.platform` returns `win32` (not `windows`) — map `win32-x64` → `@scope/cli-windows-x64`
- Use `require.resolve('pkg/package.json')` to find platform package, then read `main` for binary name
- Use `execFileSync` and forward exit codes from the Rust process
- Main package has NO `os`/`cpu` fields — it installs everywhere. Only platform packages use those.

## Platform Package Manifests

Each platform package needs `os`/`cpu` fields and a `postinstall.js` for chmod:

```json
{
  "name": "@scope/cli-darwin-arm64",
  "os": ["darwin"],
  "cpu": ["arm64"],
  "main": "my-cli"
}
```

## Platform Matrix

| Platform | Rust Target | `os` | `cpu` | Binary Extension |
|----------|------------|------|-------|-----------------|
| `darwin-arm64` | `aarch64-apple-darwin` | `darwin` | `arm64` | (none) |
| `darwin-x64` | `x86_64-apple-darwin` | `darwin` | `x64` | (none) |
| `linux-x64` | `x86_64-unknown-linux-gnu` | `linux` | `x64` | (none) |
| `windows-x64` | `x86_64-pc-windows-msvc` | `win32` | `x64` | `.exe` |

See [references/platform-matrix.md](./references/platform-matrix.md) for adding new platforms.

## Adding a New Platform

1. Add to `platforms` array in `publish.config.ts`
2. Add Rust target: `rustup target add <target-triple>`
3. Add to CI matrix in publish workflow
4. Regenerate manifests: `pnpm tsx scripts/generate-platform-manifests.ts`

## Versioning

Root `package.json` is the **single source of truth**. Never manually edit version elsewhere.

```
root package.json (version: "0.2.15")
  ├── packages/cli/package.json  → 0.2.15  (via sync-versions.ts)
  ├── Cargo.toml                 → 0.2.15
  └── platform-packages/*/      → 0.2.15  (via generate-manifests)
```

### Version Sync Flow

```bash
npm version patch                     # Bump root: 0.2.15 → 0.2.16
pnpm tsx scripts/sync-versions.ts     # Propagate to all packages + Cargo.toml
```

### Dev Builds

CI computes: `0.2.15` → `0.2.16-dev.{github_run_id}`
Published with `--tag dev`. Install: `npm install my-cli@dev`

Cargo.toml stays at base version (`0.2.15`) for dev builds — Cargo pre-release handling differs from npm.

### Version Bump Guide

| Change | Command | Example |
|--------|---------|---------|
| Breaking API | `npm version major` | 1.0.0 → 2.0.0 |
| New feature | `npm version minor` | 0.2.0 → 0.3.0 |
| Bug fix | `npm version patch` | 0.2.15 → 0.2.16 |
| CI/testing | Automatic (CI) | 0.2.15 → 0.2.16-dev.123 |

### workspace:* Protocol

pnpm uses `workspace:*` for internal deps during development. Replace before publish, restore after:

```bash
pnpm tsx scripts/prepare-publish.ts                  # Replace workspace:* → real versions
pnpm tsx scripts/validate-no-workspace-protocol.ts   # Safety gate
npm publish
pnpm tsx scripts/restore-packages.ts                 # Restore workspace:*
```

See [references/workspace-protocol.md](./references/workspace-protocol.md) for details.
See [references/version-strategy.md](./references/version-strategy.md) for the full strategy.

## Troubleshooting Quick Reference

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| `Unsupported platform` | Missing platform in bin.js | Add platform key mapping |
| Platform pkg not found on npm | Registry propagation delay | Wait; check publish logs |
| `workspace:*` in published pkg | prepare-publish didn't run | Run prepare-publish.ts |
| Binary not executable | postinstall didn't run | `chmod +x` the binary |
| Version mismatch | Forgot to sync | Run sync-versions.ts |

See [references/troubleshooting.md](./references/troubleshooting.md) for detailed diagnostics.

## Templates

| Directory | Contents |
|-----------|----------|
| [templates/scripts/](./templates/scripts/) | All 11 publish pipeline scripts |
| [templates/wrapper/](./templates/wrapper/) | `bin.js` + main package `package.json` |
| [examples/](./examples/) | Real `publish.config.ts` from consuming projects |

## Setup & Activation

```bash
npx skills add codervisor/forge@rust-npm-publish -g -y
```

Auto-activates when: `publish.config.ts` present, scripts matching `*publish*` or `*platform*` exist, user mentions "publish", "platform packages", or "version sync".
