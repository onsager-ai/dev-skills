---
name: github-integration
description: Use generic GitHub CLI patterns and configure or troubleshoot gh access in cloud agents. Use for gh authentication, setup, API calls and repository selection; use pre-push, pr-lifecycle or ci-triage for their respective workflows.
metadata:
  author: Codervisor
  version: 0.2.0
  homepage: https://github.com/codervisor/forge
---

# GitHub Integration

Enable `gh` CLI access in Claude Code cloud and GitHub Copilot coding agent environments so agents can create PRs, manage issues, and interact with GitHub APIs.

## When to Use This Skill

Activate when:
- User wants cloud AI agents to use `gh` (PRs, issues, releases, API calls)
- User needs to install `gh` in Claude Code cloud sessions
- User wants to add `copilot-setup-steps.yml` for GitHub Copilot agents
- `gh` commands fail with auth or "not found" errors in a cloud session
- User wants to enable GitHub integration for any cloud-based AI coding agent

## Decision Tree

```
Which cloud environment?

Claude Code cloud (claude.ai/code)?
  → gh is NOT pre-installed in the default image
  → Install via setup script: apt update && apt install -y gh
  → Set GH_TOKEN as environment variable in environment settings
  → For repo-portable setup, use SessionStart hook instead
  → Use -R owner/repo flag with gh due to sandbox proxy

GitHub Copilot coding agent?
  → Add .github/copilot-setup-steps.yml to the repo
  → gh IS pre-installed; just configure GH_TOKEN
  → Commit and push — agent sessions pick it up automatically

gh commands failing?
  → "command not found" → gh not installed; add to setup script
  → HTTP 401 → GH_TOKEN not set; add to environment variables
  → HTTP 403 → Token lacks required scope; check permissions
  → "could not determine repo" → Use -R owner/repo flag
  → See references/cloud-auth.md for more

Need gh in local dev too?
  → Run: gh auth login (interactive, browser-based)
  → Or set GH_TOKEN env var for headless/CI use
```

Read [environment setup](references/environment-setup.md) when configuring cloud or Copilot agent access to gh.

## Common gh Commands for Agents

```bash
# PRs (use -R in Claude Code cloud)
gh pr create -R owner/repo --title "..." --body "..."
gh pr list -R owner/repo
gh pr view -R owner/repo
gh pr merge -R owner/repo --squash --delete-branch

# Issues
gh issue list -R owner/repo
gh issue view 42 -R owner/repo
gh issue create -R owner/repo --title "..." --body "..."

# API (for anything not covered by subcommands)
gh api repos/owner/repo/actions/runs
```

## Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| `gh: command not found` | Not installed (Claude Code cloud) | Add `apt install -y gh` to setup script |
| `HTTP 401` / auth error | `GH_TOKEN` not set | Add to environment variables in settings UI |
| `HTTP 403` on push | Token lacks `repo` scope | Regenerate PAT with `repo` scope |
| `could not determine repo` | Sandbox proxy hides git remote | Use `-R owner/repo` flag |
| `gh pr create` fails | No upstream branch | Push with `git push -u origin <branch>` first |
| Setup script fails | No network access | Set network to "Limited" (default) or "Full" |

## References

- `references/cloud-auth.md` — Token auth, scopes, proxy details, troubleshooting
- `references/copilot-setup-steps.md` — Full guide to customizing the Copilot setup workflow
