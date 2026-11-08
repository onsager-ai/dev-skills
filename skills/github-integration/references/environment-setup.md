# Environment Setup

## Two Environments, Two Approaches

### Claude Code Cloud (claude.ai/code)

Claude Code cloud runs sessions in Anthropic-managed VMs. The `gh` CLI is **not pre-installed**. You need two things:

1. **Setup script** — installs `gh` when the session starts
2. **`GH_TOKEN` env var** — authenticates `gh` with your GitHub PAT

#### Quick Start: Setup Script

In the Claude Code web UI: Environment Settings → Setup script:

```bash
#!/bin/bash
apt update && apt install -y gh
```

Then add `GH_TOKEN` as an environment variable with your GitHub Personal Access Token (needs `repo` scope).

#### Alternative: SessionStart Hook (repo-portable)

Add to `.claude/settings.json` in your repo:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "if [ \"$CLAUDE_CODE_REMOTE\" = \"true\" ]; then apt update && apt install -y gh; fi",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

The `CLAUDE_CODE_REMOTE` check ensures it only runs in cloud sessions.

#### Important: The `-R` Flag

Due to the sandbox proxy, `gh` may not auto-detect the repo. Use the `-R owner/repo` flag:

```bash
gh pr create -R codervisor/myrepo --title "..." --body "..."
gh issue list -R codervisor/myrepo
```

### GitHub Copilot Coding Agent

Copilot coding agents use `.github/copilot-setup-steps.yml`. The `gh` CLI is pre-installed; you just need to authenticate it.

Add this file at `.github/copilot-setup-steps.yml`:

```yaml
name: "Copilot Setup Steps"

on: repository_dispatch

jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate gh CLI
        run: gh auth status
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

See [Copilot setup template](../templates/copilot-setup-steps.yml) for a full template with dependency installation.

## Setup Scripts vs SessionStart Hooks vs copilot-setup-steps

|                  | Setup scripts            | SessionStart hooks              | copilot-setup-steps.yml          |
|------------------|--------------------------|---------------------------------|----------------------------------|
| **Platform**     | Claude Code cloud only   | Claude Code (local + cloud)     | GitHub Copilot agents only       |
| **Configured in**| Environment settings UI  | `.claude/settings.json` in repo | `.github/copilot-setup-steps.yml`|
| **Runs**         | Before Claude launches   | After Claude launches           | Before Copilot agent launches    |
| **Runs on resume**| No (new sessions only) | Yes (every session)             | Yes                              |
| **Network**      | Needs registry access    | Needs registry access           | Full GitHub Actions network      |

