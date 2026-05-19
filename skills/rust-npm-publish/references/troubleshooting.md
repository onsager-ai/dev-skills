# Troubleshooting — Publishing & Versioning

Common failures and fixes for the npm publish pipeline and version sync.

## Publishing Issues

### Platform Package Not Found on npm

**Symptom**: `publish-main-packages` fails with "platform package not available"

**Causes & Fixes**:
1. **Registry propagation delay** — npm takes 10-60s to propagate
   - Wait and retry: `npm view @scope/cli-darwin-arm64@0.2.16`
   - The `wait-propagation` step handles this automatically

2. **Platform package publish failed** — check CI logs for `publish-platform-packages` step
   - Look for: 403 (auth), 409 (version exists), network errors

3. **Version mismatch** — platform and main packages have different versions
   - Run `sync-versions.ts` before publishing
   - Check all package.json files have same version

### `npx my-tool` Fails with "Unsupported platform"

**Symptom**: Platform key not in the wrapper's lookup table

**Fixes**:
- The wrapper's `PLATFORMS` map doesn't include the user's `process.platform`-`process.arch`
- Check with: `node -e "console.log(process.platform, process.arch)"`
- Add the missing platform key to `bin.js` and a matching platform package

### Platform Package Not Installed / "Failed to find package"

**Symptom**: `optionalDependencies` with `os`/`cpu` filtering failed

**Fixes**:
- Check with: `ls node_modules/@scope/cli-*`
- Manual fix: `npm install @scope/cli-darwin-arm64`

### workspace:* Leaked into Published Package

**Symptom**: `npm install` fails with "No matching version found for workspace:*"

**Causes & Fixes**:
1. **prepare-publish didn't run** — run it before `npm publish`
2. **New dependency added** — update workspace package map in `prepare-publish.ts`
3. **validate-no-workspace-protocol** should catch this pre-publish

**Recovery**:
```bash
# Unpublish the broken version (within 72h)
npm unpublish @scope/my-cli@0.2.16

# Fix and republish
pnpm tsx scripts/prepare-publish.ts
pnpm tsx scripts/validate-no-workspace-protocol.ts
npm publish
pnpm tsx scripts/restore-packages.ts
```

### Binary Not Executable After Install

**Symptom**: `Permission denied` when running the installed CLI

**Fixes**:
1. **postinstall.js didn't run** — npm may skip postinstall in some configs
   - Manual fix: `chmod +x node_modules/@scope/cli-darwin-arm64/my-cli`

2. **postinstall.js missing** — regenerate manifests
   - `pnpm tsx scripts/generate-platform-manifests.ts`

3. **npm --ignore-scripts** — user installed with scripts disabled
   - Re-install without the flag

### Wrong Binary for Platform

**Symptom**: Binary crashes with "exec format error" or similar

**Fixes**:
1. **Incorrect os/cpu in package.json** — check platform manifest
   ```bash
   cat node_modules/@scope/cli-darwin-arm64/package.json | jq '{os, cpu}'
   ```

2. **Binary copied to wrong directory** — check `copy-platform-binaries.sh`

3. **Cross-compilation issue** — binary compiled for wrong target
   ```bash
   file node_modules/@scope/cli-darwin-arm64/my-cli
   # Should show: Mach-O 64-bit executable arm64
   ```

### Version Already Published

**Symptom**: `npm ERR! 403 - You cannot publish over the previously published versions`

**Fixes**:
1. **Forgot to bump version** — run `npm version patch` in root
2. **CI re-run on same version** — version is deterministic per run_id, so re-runs are safe
3. **Dev version collision** — shouldn't happen with run_id suffix

### CI Environment Required

**Symptom**: "This script must be run in a CI environment"

**Fixes**:
- Publish scripts require `CI=true` or `GITHUB_ACTIONS=true`
- For local testing: `--allow-local` flag
- For dry run: `--dry-run --allow-local`

### Binary Validation Failed

**Symptom**: "Invalid binary header" or "Binary file not found"

**Fixes**:
1. **Binary not compiled** — check Rust build step in CI
2. **Binary not copied** — check `copy-platform-binaries.sh` output
3. **Corrupt binary** — rebuild
4. **Wrong format** — ensure correct Rust target triple

**Manual validation**:
```bash
file path/to/binary
xxd -l 4 path/to/binary
# darwin: cffa edfe or feed facf
# linux:  7f45 4c46
# windows: 4d5a
```

### npm Auth Issues

**Symptom**: 401 or 403 during publish

**Fixes**:
1. **Token expired** — regenerate npm token, update GitHub secret
2. **Token scope** — ensure token has `publish` permission
3. **2FA required** — use automation token (no 2FA prompt)
4. **Wrong registry** — check `.npmrc` for registry URL

## Versioning Issues

### Version Mismatch Between Packages

```bash
# Check all versions
grep -r '"version"' packages/*/package.json
grep '^version' Cargo.toml

# Fix: sync from root
pnpm tsx scripts/sync-versions.ts
```

### workspace:* in Published Package

```bash
# Validate before publish
pnpm tsx scripts/validate-no-workspace-protocol.ts

# If already published, unpublish within 72h
npm unpublish @scope/pkg@version
```

### Cargo.toml Version Not Updating

- Check regex matches: `version = "x.y.z"` (with spaces around `=`)
- Ensure Cargo.toml path is correct in config
- For workspace Cargo.toml, target the root workspace file
- Note: Cargo doesn't support pre-release the same way npm does
