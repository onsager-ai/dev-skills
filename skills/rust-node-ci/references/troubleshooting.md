# Troubleshooting — CI/CD

Common CI/CD failures and fixes for Rust+Node.js hybrid GitHub Actions workflows.

## Rust Build Fails on macOS ARM

**Fixes**:
- Use `macos-latest` (supports both x64 and arm64 runners)
- For cross-compilation: `rustup target add aarch64-apple-darwin`

## pnpm Lockfile Mismatch

**Fixes**:
- Always use `--frozen-lockfile` in CI
- Regenerate locally: `pnpm install --no-frozen-lockfile`, commit lockfile

## Cargo Cache Too Large

**Fixes**:
- Add `shared-key` to Swatinem/rust-cache for cross-job sharing
- Use `save-if: ${{ github.ref == 'refs/heads/main' }}` to only save cache on main

## Artifact Not Found in Downstream Job

**Fixes**:
- Check `needs:` dependency chain between jobs
- Verify artifact `name` matches exactly between upload and download steps
- Check `pattern` vs `name` in download action (pattern supports wildcards, name does not)

## setup-workspace Action Not Found

**Symptom**: `Can't find 'action.yml'` for `./.github/actions/setup-workspace`

**Fix**: Install composite actions from the `rust-node-ci` skill templates:
```bash
cp -r .forge/skills/rust-node-ci/templates/actions/setup-workspace .github/actions/
```

## Rust clippy Warnings Failing CI

**Symptom**: `cargo clippy -- -D warnings` fails

**Fixes**:
- Fix the lint warnings locally first: `cargo clippy --workspace`
- To temporarily allow a specific lint: `#[allow(clippy::lint_name)]`
- Don't disable `-D warnings` in CI — it's there to prevent lint drift

## compute-version Outputs Empty

**Symptom**: `${{ steps.version.outputs.version }}` is empty

**Fixes**:
- Ensure the step has `id: version`
- Confirm `base-version` input is set (not empty)
- Check the action is installed at `.github/actions/compute-version/`

## Publish Workflow Not Triggered

**Symptom**: Publish workflow doesn't run on release

**Fixes**:
- Check trigger: `on: release: types: [published]` (not `created`)
- Verify the release was published (not just draft)
- For manual trigger: `workflow_dispatch` must be in `on:` block
