# Publish Pipeline — Detailed Reference

## Step-by-Step Pipeline

### 1. sync-versions

**Purpose**: Propagate root package.json version to all workspace packages and Cargo.toml.

```bash
pnpm tsx scripts/sync-versions.ts
```

**What it does**:
- Reads version from root `package.json`
- Updates all workspace `package.json` files
- Updates `Cargo.toml` version field via regex
- Reports updated/skipped/errors

**Config dependency**: `cargoWorkspace`, `mainPackages`

### 2. generate-platform-manifests

**Purpose**: Create `package.json` + `postinstall.js` for each platform binary package.

```bash
pnpm tsx scripts/generate-platform-manifests.ts
```

**What it does per platform**:
- Creates `package.json` with `os`, `cpu`, `main` fields
- Generates `postinstall.js` (chmod 755 on Unix, no-op on Windows)
- Sets repository URL, license, description

**Config dependency**: `scope`, `binaries`, `platforms`, `repositoryUrl`

### 3. add-platform-deps

**Purpose**: Add platform packages as `optionalDependencies` in main package(s).

```bash
pnpm tsx scripts/add-platform-deps.ts
```

**What it does**:
- Reads platform package names from config
- Adds them as `optionalDependencies` with current version
- npm will only install the one matching user's OS/CPU

**Config dependency**: `scope`, `binaries`, `platforms`, `mainPackages`

### 4. copy-binaries / copy-platform-binaries.sh

**Purpose**: Copy compiled Rust binaries from build artifacts to platform package directories.

```bash
bash scripts/copy-platform-binaries.sh
```

**What it does**:
- Copies from CI artifact directories to platform package dirs
- Handles Windows `.exe` extension
- May copy additional assets (e.g., UI dist for HTTP servers)

### 5. validate-platform-binaries

**Purpose**: Pre-publish safety check — verify all binary files exist and are valid.

```bash
pnpm tsx scripts/validate-platform-binaries.ts
```

**What it checks**:
- File exists and size > 0
- Correct binary header:
  - darwin: Mach-O magic bytes
  - linux: ELF header
  - windows: PE/MZ header

### 6. prepare-publish

**Purpose**: Replace `workspace:*` dependencies with actual version numbers.

```bash
pnpm tsx scripts/prepare-publish.ts
```

**What it does**:
- Scans all publishable `package.json` files
- Replaces `workspace:*` and `workspace:^` with resolved versions
- Creates `.backup` files for restoration
- Copies root README to CLI package

**Critical**: Must run BEFORE npm publish, AFTER version sync.

### 7. validate-no-workspace-protocol

**Purpose**: Final safety gate — ensure no `workspace:*` references leak.

```bash
pnpm tsx scripts/validate-no-workspace-protocol.ts
```

**What it does**:
- Recursively checks all `package.json` files in publishable packages
- Fails with non-zero exit code if any `workspace:` references found

### 8. publish-platform-packages

**Purpose**: Publish all platform-specific npm packages in parallel.

```bash
pnpm tsx scripts/publish-platform-packages.ts [--tag dev] [--dry-run] [--allow-local]
```

**What it does**:
- Publishes each platform package with `npm publish`
- Runs in parallel (all platforms simultaneously)
- Requires CI environment (or `--allow-local` flag)
- Supports `--dry-run` for testing

### 9. wait-propagation (in CI workflow)

**Purpose**: Wait for platform packages to be visible on npm registry.

**What it does**:
- Polls `npm view @scope/pkg@version` for each platform package
- Exponential backoff: starts at 5s, maxes at 30s
- Up to 20 retries (total ~5 minutes)
- Required because npm registry has propagation delay

### 10. publish-main-packages

**Purpose**: Publish main wrapper packages that reference platform packages.

```bash
pnpm tsx scripts/publish-main-packages.ts [--tag dev] [--dry-run] [--allow-local]
```

**What it does**:
- Verifies platform packages are available on npm first
- Publishes main packages (CLI wrapper, SDK, etc.)
- Main packages have `optionalDependencies` pointing to platform packages

### 11. restore-packages

**Purpose**: Revert workspace dependency replacements.

```bash
pnpm tsx scripts/restore-packages.ts
```

**What it does**:
- Restores `.backup` files created by prepare-publish
- Removes copied README from CLI package
- Returns workspace to pre-publish state

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `CI` | CI environment detection | - |
| `GITHUB_ACTIONS` | GitHub Actions detection | - |
| `GITHUB_RUN_ID` | Used for dev version suffix | - |
| `NPM_TOKEN` | npm registry authentication | - |
| `NODE_AUTH_TOKEN` | Alternative npm auth | - |

## Dry Run Testing

All publish scripts support `--dry-run`:

```bash
pnpm tsx scripts/publish-platform-packages.ts --dry-run --allow-local
pnpm tsx scripts/publish-main-packages.ts --dry-run --allow-local
```

This runs through all logic but skips the actual `npm publish` call.
