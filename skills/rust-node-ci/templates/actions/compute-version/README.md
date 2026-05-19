# Compute Version Action

Install this action into `.github/actions/compute-version/action.yml` in your project.

## Usage

```yaml
- uses: ./.github/actions/compute-version
  id: version
  with:
    base-version: '0.2.15'
    is-release: 'false'
# Outputs: version, npm-tag, is-dev
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `base-version` | Yes | — | Base version from package.json |
| `is-release` | No | `false` | Production release flag |
| `run-id` | No | `${{ github.run_id }}` | Run ID for dev suffix |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | Computed version (e.g., `0.2.16-dev.12345`) |
| `npm-tag` | npm dist-tag (`latest` or `dev`) |
| `is-dev` | Whether this is a dev build |
