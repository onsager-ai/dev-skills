---
name: rust-node-ci
description: >
  GitHub Actions CI/CD for Rust+Node.js hybrid repos. Covers workflow structure,
  installable composite actions, artifact flow, caching, and dev versioning.
  Use when: (1) setting up or fixing GitHub Actions workflows, (2) adding CI for
  a Rust+Node.js project, (3) working with composite actions (setup-workspace,
  rust-cross-build, compute-version, wait-npm-propagation), (4) debugging CI failures,
  (5) setting up the cross-platform build matrix. Triggers on "CI", "workflow",
  "GitHub Actions", "cross-build", "artifact", or work in .github/workflows/.
metadata:
  author: Codervisor
  version: 0.1.0
  homepage: https://github.com/codervisor/forge
---

# Rust+Node.js CI/CD

GitHub Actions workflows and composite actions for Rust+Node.js hybrid projects.

## When to Use This Skill

Activate when any of the following are true:
- Working with `.github/workflows/` in a repo with both `Cargo.toml` and `package.json`
- Setting up, fixing, or extending CI/CD pipelines
- Installing composite actions into a project
- User mentions "CI", "workflow", "GitHub Actions", "cross-build", or "artifact"

## Decision Tree

```
What does the user need?

Set up CI from scratch?
  → Copy templates/workflows/ into .github/workflows/
  → Install composite actions from templates/actions/ into .github/actions/
  → Customize platform matrix for your targets

Fix a failing CI job?
  → Node job → CI Jobs section
  → Rust build/cross-compile → Composite Actions section + references/troubleshooting.md
  → Publish workflow → see rust-npm-publish skill

Add a new platform to the build matrix?
  → Publish Workflow Matrix section
  → Full platform reference → see rust-npm-publish skill

Understand dev vs release versioning in CI?
  → Dev Versioning section
```

## Workflow Architecture

```
┌─────────────┐     ┌──────────────────┐
│  Node Build  │     │   Rust Build     │
│  (test/lint) │     │  (per platform)  │
└──────┬──────┘     └────────┬─────────┘
       │                     │
       │   ┌─────────────┐   │
       └──►│  Artifacts   │◄──┘
           └──────┬──────┘
                  │
           ┌──────▼──────┐
           │   Publish    │
           └─────────────┘
```

## Workflows

| Workflow | Trigger | What It Does |
|----------|---------|-------------|
| `ci.yml` | PR, push to main | Node build+test+lint, Rust fmt+clippy+test |
| `publish.yml` | Release, dispatch | Cross-build → publish to npm |
| `copilot-setup-steps.yml` | repository_dispatch | Copilot agent onboarding |

Templates: [templates/workflows/](./templates/workflows/)

## CI Jobs

### Node Job

```yaml
steps:
  - uses: ./.github/actions/setup-workspace
  - run: pnpm build
  - run: pnpm test
  - run: pnpm typecheck
```

### Rust Job

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: dtolnay/rust-toolchain@stable
    with:
      components: clippy, rustfmt
  - run: cargo fmt --all -- --check
  - run: cargo clippy --workspace -- -D warnings
  - run: cargo test --workspace
```

## Composite Actions

Install into `.github/actions/<name>/action.yml` in your project, then reference as `uses: ./.github/actions/<name>`.

Templates: [templates/actions/](./templates/actions/)

| Action | Install path | Purpose |
|--------|-------------|---------|
| `setup-workspace` | `.github/actions/setup-workspace/` | Checkout + pnpm + Node.js + cache + install |
| `rust-cross-build` | `.github/actions/rust-cross-build/` | Build Rust binaries for a target platform |
| `compute-version` | `.github/actions/compute-version/` | Compute dev/release version + npm tag |
| `wait-npm-propagation` | `.github/actions/wait-npm-propagation/` | Poll npm until platform packages are visible |

## Publish Workflow Matrix

```yaml
strategy:
  matrix:
    include:
      - { os: macos-latest,   target: x86_64-apple-darwin,      platform: darwin-x64 }
      - { os: macos-latest,   target: aarch64-apple-darwin,     platform: darwin-arm64 }
      - { os: ubuntu-22.04,   target: x86_64-unknown-linux-gnu, platform: linux-x64 }
      - { os: windows-latest, target: x86_64-pc-windows-msvc,   platform: windows-x64 }
```

Each matrix entry runs `rust-cross-build` and uploads the binary as an artifact.

## Artifact Flow

```yaml
# Upload from build job (one per platform)
- uses: actions/upload-artifact@v4
  with:
    name: binary-${{ matrix.platform }}
    path: target/${{ matrix.target }}/release/my-cli${{ matrix.platform == 'windows-x64' && '.exe' || '' }}
    retention-days: 1

# Download in publish job (all platforms)
- uses: actions/download-artifact@v4
  with:
    pattern: binary-*
    path: artifacts/
    merge-multiple: false
```

## Caching

| Tool | How |
|------|-----|
| pnpm | `actions/setup-node@v4` with `cache: 'pnpm'` |
| Rust | `Swatinem/rust-cache@v2` with `shared-key: ${{ matrix.platform }}` |
| Turbo | `actions/cache@v4` on `.turbo` path |

## Dev Versioning in CI

Non-release builds compute a unique pre-release version:

```
base version: 0.2.15
compute-version (is-release: false) → 0.2.16-dev.{github_run_id}
npm-tag: dev
```

Use the `compute-version` action:

```yaml
- uses: ./.github/actions/compute-version
  id: version
  with:
    base-version: ${{ steps.pkg.outputs.version }}
    is-release: ${{ github.event_name == 'release' }}
# outputs: version, npm-tag, is-dev
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Rust build fails on macOS ARM | Use `macos-latest`; `rustup target add aarch64-apple-darwin` |
| pnpm lockfile mismatch | `--frozen-lockfile` in CI; regenerate locally |
| Cargo cache too large | Add `shared-key` to rust-cache; use `save-if` on main only |
| Artifact not found downstream | Check `needs:` chain; verify artifact name matches |

See [references/troubleshooting.md](./references/troubleshooting.md) for detailed diagnostics.

## Templates

| Directory | Contents |
|-----------|----------|
| [templates/workflows/](./templates/workflows/) | `ci.yml`, `publish.yml`, `copilot-setup-steps.yml` |
| [templates/actions/](./templates/actions/) | 4 composite actions with `action.yml` + README |

## Setup & Activation

```bash
npx skills add codervisor/forge@rust-node-ci -g -y
```

Auto-activates when: `.github/workflows/` directory exists in a Rust+Node.js repo, or user mentions "CI", "workflow", "GitHub Actions", "cross-build".
