# Version Strategy Reference

Comprehensive guide to versioning in a polyglot Rust+Node.js monorepo.

## Single Source of Truth

The root `package.json` version is the **canonical source**. All other version
declarations are derived from it through automated scripts.

```
root package.json (version: "0.2.15")
  │
  ├─ sync-versions.ts ──► packages/cli/package.json        → 0.2.15
  │                   ──► packages/sdk/package.json        → 0.2.15
  │                   ──► packages/shared/package.json     → 0.2.15
  │                   ──► Cargo.toml                       → 0.2.15
  │
  └─ generate-manifests ► platform-packages/*/package.json → 0.2.15
```

## Release Types

### Production Release

```bash
# 1. Bump version in root package.json
npm version patch   # 0.2.15 → 0.2.16
# or: npm version minor / npm version major

# 2. Push tag (triggers publish workflow)
git push --follow-tags
```

Published with `--tag latest` (npm default).

### Dev (Pre-release)

Triggered by workflow_dispatch or push to main.

Version formula: bump patch + append `-dev.{run_id}`
```
0.2.15 → 0.2.16-dev.12345678
```

Published with `--tag dev`:
```bash
npm publish --tag dev
```

Users install dev builds explicitly:
```bash
npm install my-cli@dev
```

### Why `-dev.{run_id}`?

- **Deterministic**: Same CI run always produces same version
- **Unique**: No collisions between runs
- **Sortable**: Higher run_id = newer build
- **npm-compatible**: Valid semver pre-release identifier

## Version Sync Flow

### Development (Local)

```bash
# 1. Bump root version
npm version patch    # 0.2.15 → 0.2.16

# 2. Propagate to workspace packages
pnpm tsx scripts/sync-versions.ts

# 3. Verify
grep '"version"' packages/*/package.json
grep '^version' Cargo.toml
```

### What sync-versions.ts Does

1. Reads `version` from root `package.json`
2. Finds all workspace packages via `pnpm-workspace.yaml`
3. Updates every workspace `package.json` → same version
4. Updates `Cargo.toml` version field via regex:
   ```
   /^version\s*=\s*"[^"]*"/m → version = "0.2.16"
   ```
5. Reports: updated / skipped / errors

### CI: Dev Build (push to main / workflow_dispatch)

```
package.json: 0.2.15
       │
  compute-version action
       │
       ▼
  dev version: 0.2.16-dev.12345678
       │
  sync-versions.ts (with override)
       │
       ├──► packages/*/package.json → 0.2.16-dev.12345678
       └──► Cargo.toml             → 0.2.15 (no pre-release in Cargo)
```

Note: Cargo.toml stays at the base version because Cargo's pre-release handling
differs from npm. For dev builds, only npm packages get the `-dev.X` suffix.

### CI: Production Release (GitHub release)

```
package.json: 0.2.16 (already bumped)
       │
  compute-version action (is-release: true)
       │
       ▼
  version: 0.2.16
       │
  sync-versions.ts
       │
       ├──► packages/*/package.json → 0.2.16
       └──► Cargo.toml             → 0.2.16
```

## Computing Dev Versions

### In GitHub Actions

Use the `compute-version` action:

```yaml
- uses: ./.github/actions/compute-version
  id: version
  with:
    base-version: '0.2.15'
    is-release: 'false'
# Outputs: version=0.2.16-dev.12345678, npm-tag=dev
```

### In Scripts

```typescript
function computeDevVersion(baseVersion: string, runId: string): string {
  const [major, minor, patch] = baseVersion.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}-dev.${runId}`;
}
```

## Cargo.toml Version Sync

The sync script uses regex replacement:

```typescript
const cargoContent = readFileSync(cargoPath, 'utf8');
const updated = cargoContent.replace(
  /^version\s*=\s*"[^"]*"/m,
  `version = "${version}"`
);
writeFileSync(cargoPath, updated);
```

### Limitations

- Only updates the first `version = "..."` line matching the pattern
- For Cargo workspaces with multiple crates, target the workspace `Cargo.toml`
  and use `workspace.package.version`
- Pre-release identifiers are valid in Cargo but may cause issues with crates.io

### Recommended Approach

- **npm packages**: Full dev version with suffix (`0.2.16-dev.12345678`)
- **Cargo.toml**: Keep at base version (`0.2.15`) for dev builds

## npm Tag Strategy

| Scenario | Version | npm Tag | Install Command |
|----------|---------|---------|-----------------|
| Production | `0.2.16` | `latest` | `npm install my-cli` |
| Dev build | `0.2.17-dev.123` | `dev` | `npm install my-cli@dev` |
| Release candidate | `0.3.0-rc.1` | `next` | `npm install my-cli@next` |

### Publishing with Tags

```bash
npm publish            # Production (latest is default)
npm publish --tag dev  # Dev build
npm publish --tag next # Release candidate
```

### Checking Tags

```bash
npm view my-cli dist-tags       # See all dist-tags
npm view my-cli dist-tags.dev   # See specific tag
```

## Version Ordering

Dev versions sort correctly in semver:

```
0.2.15              ← current release
0.2.16-dev.100      ← first dev build after release
0.2.16-dev.101      ← next dev build
0.2.16-dev.200      ← later dev build
0.2.16              ← next release (higher than all dev builds)
```

## CI Integration

### Trigger-based version selection

```yaml
jobs:
  publish:
    steps:
      - uses: ./.github/actions/compute-version
        id: version
        with:
          base-version: ${{ steps.pkg.outputs.version }}
          is-release: ${{ github.event_name == 'release' }}

      - name: Sync version
        run: pnpm tsx scripts/sync-versions.ts --version ${{ steps.version.outputs.version }}

      - name: Publish
        run: npm publish --tag ${{ steps.version.outputs.npm-tag }}
```

## Version Discovery

The sync script discovers packages to update via:

1. **pnpm workspace config** — `pnpm-workspace.yaml` or `package.json` workspaces field
2. **Cargo workspace config** — `[workspace]` members in `Cargo.toml`
3. **Explicit config** — `mainPackages` array in `publish.config.ts`

## Adding New Packages

When adding a new workspace package:

1. Add it to the workspace config (`pnpm-workspace.yaml` or `package.json`)
2. Run `sync-versions.ts` to set its initial version
3. The package will be automatically included in future syncs

## Cleanup

Old dev versions accumulate on npm. Consider periodically deprecating them:

```bash
npm deprecate "my-cli@0.2.16-dev.*" "Old dev build, use latest"
```

Or use `npm unpublish` for versions less than 72 hours old.

## Verification

After publishing, verify packages:

```bash
npm view @scope/my-cli version              # Check latest version
npm view @scope/my-cli dist-tags.dev        # Check dev version
npm view @scope/my-cli-darwin-arm64 version  # Check platform package
npm pack @scope/my-cli --dry-run             # Verify optionalDeps resolve
```
