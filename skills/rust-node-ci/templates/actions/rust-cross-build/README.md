# Rust Cross Build Action

Install this action into `.github/actions/rust-cross-build/action.yml` in your project.

## Usage

```yaml
- uses: ./.github/actions/rust-cross-build
  with:
    target: aarch64-apple-darwin
    packages: my-cli
    platform: darwin-arm64
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `target` | Yes | — | Rust target triple |
| `packages` | Yes | — | Space-separated Cargo package names |
| `platform` | Yes | — | Platform key for artifact naming |
| `profile` | No | `release` | Cargo build profile |
| `artifact-prefix` | No | `binary` | Artifact name prefix |
| `rust-cache` | No | `true` | Enable Rust build caching |
