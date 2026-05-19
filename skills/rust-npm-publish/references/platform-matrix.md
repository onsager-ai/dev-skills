# Platform Matrix Reference

## Supported Platforms

| Key | OS | CPU | Rust Target | Runner (GitHub Actions) | Binary Extension |
|-----|-----|-----|-------------|------------------------|-----------------|
| `darwin-arm64` | macOS | Apple Silicon (M1+) | `aarch64-apple-darwin` | `macos-latest` | (none) |
| `darwin-x64` | macOS | Intel x86_64 | `x86_64-apple-darwin` | `macos-latest` | (none) |
| `linux-x64` | Linux | x86_64 | `x86_64-unknown-linux-gnu` | `ubuntu-22.04` | (none) |
| `windows-x64` | Windows | x86_64 | `x86_64-pc-windows-msvc` | `windows-latest` | `.exe` |

## Platform Detection in package.json

npm uses `os` and `cpu` fields to filter `optionalDependencies`:

```json
{
  "os": ["darwin"],
  "cpu": ["arm64"]
}
```

### Mapping

| Platform Key | `os` | `cpu` |
|-------------|------|-------|
| `darwin-arm64` | `["darwin"]` | `["arm64"]` |
| `darwin-x64` | `["darwin"]` | `["x64"]` |
| `linux-x64` | `["linux"]` | `["x64"]` |
| `windows-x64` | `["win32"]` | `["x64"]` |

## Binary Validation Headers

| Platform | Format | Magic Bytes | Hex |
|----------|--------|-------------|-----|
| darwin | Mach-O (64-bit LE) | `CF FA ED FE` | `0xCFFAEDFE` |
| darwin | Mach-O (64-bit BE) | `FE ED FA CF` | `0xFEEDFACF` |
| linux | ELF | `7F 45 4C 46` | `0x7F454C46` |
| windows | PE/MZ | `4D 5A` | `0x4D5A` |

## Adding a New Platform

### 1. Verify Rust target availability
```bash
rustup target list | grep <target>
rustup target add <target>
```

### 2. Update publish.config.ts
```typescript
platforms: [
  'darwin-x64', 'darwin-arm64', 'linux-x64', 'windows-x64',
  'linux-arm64',  // ← new
],
```

### 3. Add CI matrix entry
```yaml
matrix:
  include:
    # ... existing entries ...
    - os: ubuntu-22.04
      target: aarch64-unknown-linux-gnu
      platform: linux-arm64
```

### 4. Cross-compilation (if needed)
Some targets need cross-compilation toolchains:

```yaml
# linux-arm64 needs cross-linker
- name: Install cross-compilation tools
  run: sudo apt-get install -y gcc-aarch64-linux-gnu
  
- name: Build
  env:
    CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER: aarch64-linux-gnu-gcc
  run: cargo build --release --target aarch64-unknown-linux-gnu
```

### 5. Regenerate manifests
```bash
pnpm tsx scripts/generate-platform-manifests.ts
pnpm tsx scripts/add-platform-deps.ts
```

## Common Platform Targets (Future)

| Platform Key | Rust Target | Notes |
|-------------|-------------|-------|
| `linux-arm64` | `aarch64-unknown-linux-gnu` | AWS Graviton, Raspberry Pi 4+ |
| `linux-musl-x64` | `x86_64-unknown-linux-musl` | Alpine, static linking |
| `linux-musl-arm64` | `aarch64-unknown-linux-musl` | Alpine ARM |
| `freebsd-x64` | `x86_64-unknown-freebsd` | FreeBSD servers |
