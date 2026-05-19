# Setup Workspace Action

Install this action into `.github/actions/setup-workspace/action.yml` in your project.

## Usage

```yaml
- uses: ./.github/actions/setup-workspace
  with:
    node-version: '22'
    install-args: '--frozen-lockfile'
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `node-version` | No | `22` | Node.js version |
| `pnpm-version` | No | (from packageManager) | pnpm version |
| `install-args` | No | `--frozen-lockfile` | Extra pnpm install args |
