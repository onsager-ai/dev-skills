# Post-Bootstrap Checklist

Verification steps to run after scaffolding a new project.

## Quick Verification

```bash
# 1. Dependencies install cleanly
pnpm install

# 2. TypeScript compiles
pnpm build

# 3. Rust compiles
cargo check --workspace

# 4. Version sync works
pnpm tsx scripts/sync-versions.ts

# 5. Publish config is valid
pnpm tsx scripts/validate-no-workspace-protocol.ts
```

## Detailed Checklist

### Root Configuration

- [ ] `package.json` has correct `name`, `version`, `packageManager`
- [ ] `pnpm-workspace.yaml` lists all package directories
- [ ] `Cargo.toml` has `[workspace]` with correct members
- [ ] Version in `package.json` matches `Cargo.toml`

### CI Workflows

- [ ] `.github/workflows/ci.yml` exists
- [ ] CI triggers on correct branches (push to main, PRs)
- [ ] Node job runs: build, typecheck, lint, test
- [ ] Rust job runs: fmt check, clippy, test
- [ ] Caching configured (pnpm, cargo, turbo)

### Publish Workflow

- [ ] `.github/workflows/publish.yml` exists
- [ ] `publish.config.ts` has correct scope, binaries, platforms
- [ ] Build matrix covers all target platforms
- [ ] Cargo package names match actual crate names
- [ ] Platform package names in `wait-npm-propagation` match generated packages
- [ ] `NPM_TOKEN` secret is configured in repository settings

### Scripts

- [ ] All scripts from pipeline exist in `scripts/`
- [ ] Scripts import from correct config path
- [ ] `sync-versions.ts` finds all packages
- [ ] `prepare-publish.ts` / `restore-packages.ts` round-trip correctly

### LeanSpec

- [ ] `.lean-spec/config.json` exists with valid configuration
- [ ] `specs/` directory exists
- [ ] `AGENTS.md` references leanspec-sdd skill (from `codervisor/lean-spec`)

### Versioning

- [ ] Root `package.json` is the single version source of truth
- [ ] `npm version patch` + `sync-versions.ts` updates all packages
- [ ] Dev versioning produces valid semver (e.g., `0.0.2-dev.12345`)

### npm Packages

- [ ] Main package `package.json` has `"bin"` pointing to `bin.js`
- [ ] `bin.js` maps `process.platform`+`process.arch` to platform package names
- [ ] `bin.js` uses `require.resolve` to find platform binary, `execFileSync` to run it
- [ ] `bin.js` forwards exit codes from the Rust binary
- [ ] Platform packages have correct `os` and `cpu` fields

### Git

- [ ] `.gitignore` excludes: `node_modules/`, `target/`, `platform-packages/`, `.turbo/`, `*.backup`
- [ ] Committed files don't include generated platform packages
