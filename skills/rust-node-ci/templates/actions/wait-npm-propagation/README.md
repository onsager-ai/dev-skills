# Wait npm Propagation Action

Install this action into `.github/actions/wait-npm-propagation/action.yml` in your project.

## Usage

```yaml
- uses: ./.github/actions/wait-npm-propagation
  with:
    packages: '["@scope/cli-darwin-arm64", "@scope/cli-linux-x64"]'
    version: '0.2.16'
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `packages` | Yes | — | JSON array of package names |
| `version` | Yes | — | Version to wait for |
| `max-retries` | No | `20` | Maximum retry attempts |
| `initial-delay` | No | `5` | Initial delay (seconds) |
| `max-delay` | No | `30` | Maximum delay (seconds) |
