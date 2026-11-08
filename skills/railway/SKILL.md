---
name: railway
description: Operate and debug Railway-hosted services using an authenticated connector or CLI. Use for "deploy to railway", build failures, crashes, 500s, logs, metrics, variables, restart or rollback, SSH, database access, and deployment health checks. Follow the repository's deployment policy.
allowed-tools: Bash(railway:*), Bash(npm install -g @railway/cli:*), Bash(which railway), Bash(jq:*), Bash(sh *), Bash(bash *), Bash(curl *), Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(just *), Read, Write, Edit
---

# railway

Use the smallest available Railway operation needed for the task. Read the repository's AGENTS.md and deployment policy before selecting a deployment route. A GitHub-driven pipeline takes precedence over generic CLI examples; this skill supplies mechanics, not authority to bypass it. For other hosts, or a code-only fix with no operational lever, use the relevant host or development skill instead.

## Deployment and authorization

- For repository code changes, prepare the branch/PR and use the declared CI/CD trigger. On a GitHub-driven service, observe the matching commit deployment; do not upload a checkout, change source branches/pins or manually apply platform patches merely to trigger redeployment.
- A manual restart, redeploy or source/configuration change needs an operational reason within the user's authorized scope, such as recovery from a diagnosed failed rollout. Record the reason, exact environment/service and expected effect. Reuse existing authorization; request a decision only for unresolved intent, destructive impact or additional scope. Read-only diagnosis, reversible code fixes and PR preparation do not require another confirmation.
- Report testing evidence separately from runtime capability and authorization; do not require a new qualification report or checklist as permission to test.
- For registry artifacts, follow the repository's image pipeline. Resolve the selected manifest, source pair, immutable registry digest and platform before an authorized write. Build/test/publication and deployment credentials have separate custody; private-registry pull credentials belong to the target environment, not image layers or build arguments.
- A queued deployment is not rollout success: track its ID, verify its exact image and target, wait for completion, and check health and baked-in source/build identity. Serialize writes per environment and enforce repository freshness rules; reconcile unknown requests using read evidence. Rollback requires a retained qualified image and the repository's database migration compatibility policy. Historical releases without retained images need an explicitly scoped recovery route, not a silent rebuild. These mechanics grant no rollout, credential-migration or resource authority.

## Start

1. Inspect the available tool catalog. Prefer an authenticated Railway connector for supported platform reads; use the CLI for local checkout, SSH or exact command workflows. A global CLI install or visible token is unnecessary when an equivalent configured connector exists.
2. For CLI work, check `command -v railway` and `railway --version`, then use a bounded account/project read to diagnose authentication. Never print a token, token prefix or the environment. Reuse CLI login or injected credentials. `RAILWAY_API_TOKEN` is account-scoped; `RAILWAY_TOKEN` is project/environment-scoped. A denied workspace listing does not establish that a project-scoped read fails.
3. Resolve the explicit project, environment and service IDs without modifying linked context. Diagnose the actual 401/403, unsupported flag or missing tool before asking for installation, login or wider access. Use an equivalent configured capability first; install/update tooling only when necessary and authorized.
4. Discover only what the task needs, then choose debug, metrics, fix, deploy or verification. Use JSON where supported and explicit `--project`, `--service`, and `--environment` rather than linked state.

```bash
railway status --json --project "$PROJECT_ID"
railway service list --json --project "$PROJECT_ID" --environment production
railway deployment list --json --limit 20 --project "$PROJECT_ID" --service api --environment production
railway logs --lines 200 --json --project "$PROJECT_ID" --service api --environment production
railway logs --build "$DEPLOYMENT_ID" --lines 500 --project "$PROJECT_ID" --service api --environment production
railway logs --http --since 30m --status ">=500" --lines 200 --json --project "$PROJECT_ID" --service api --environment production
railway metrics --json --project "$PROJECT_ID" --service api --environment production
```

Choose deploy/runtime logs for crashes or runtime behavior, build logs for failed builds, and HTTP logs for status codes, latency or requests. Use `--lines`, `--since` or `--until` to avoid a hanging stream. Use `--latest` to include the latest failed deployment; otherwise logs select the most recent successful deployment. Pair logs with metrics for suspected resource limits.

Variable listings and `railway run env` expose secret values. Read names first; inspect values privately only when necessary, never paste secrets, and use the supported private delivery mechanism for new secrets. Variable writes trigger a redeploy by default; consult the detailed procedure for staged changes and authorization.

For authorized manual operations, `railway restart` restarts without rebuilding, `railway redeploy` reruns the latest deployment, and `railway up --ci` uploads the checkout only when explicitly selected and compatible with repository policy. Verify deployment status, runtime logs and health after a deploy, not merely the build exit code.

## References

- [Full operating procedure](references/full-procedure.md) — read when using command options, filtering logs, changing variables, deploying, connecting, troubleshooting, or using the optional Onsager-specific scripts; includes detailed conventions and related skills.
- [Harness operations](../harness-operations/SKILL.md) — read when a required human choice, clarification or confirmation needs the current harness's structured question tool.

Reuse settled decisions and authorization; routine implementation and tool selection are agent responsibilities. For a required human decision, include the exact project, service, environment, operation and tradeoffs and wait for an explicit answer before dependent work. Do not leave the request only in prose. If no permitted question tool exists, state the limitation and use the established human handoff channel without assuming approval.
