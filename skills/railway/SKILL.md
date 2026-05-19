---
name: railway
description: Debug, develop, and operate apps hosted on Railway (railway.com) from the CLI — list projects/services, tail and filter build/deploy/HTTP logs, read metrics, inspect and set variables, deploy from the current directory, redeploy / restart / roll back, run local commands with the service's env, SSH into containers, and open a DB shell. Authenticates via the `RAILWAY_TOKEN` environment variable (account token, or project-scoped token). Optional bundled scripts (`scripts/preflight.sh`, `scripts/debug.sh`, `scripts/smoke.sh`) are Onsager-specific wrappers — other repos can ignore them or fork. Triggers include "deploy to railway", "railway deploy this", "railway logs", "tail railway logs", "why is my railway service crashing", "why did the build fail on railway", "railway 500s", "railway latency", "show railway http logs", "redeploy on railway", "restart my railway service", "roll back railway", "set a railway env var", "list railway variables", "railway metrics", "is my railway service healthy", "connect to my railway postgres", "ssh into railway", "run this locally with railway env", "list railway projects/services/deployments", and (Onsager-specific) "check railway", "preflight", "smoke test", "is the deploy healthy".
allowed-tools: Bash(railway:*), Bash(npm install -g @railway/cli:*), Bash(which railway), Bash(jq:*), Bash(sh *), Bash(bash *), Bash(curl *), Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(just *), Read, Write, Edit
---

# railway

One skill for the full Railway operator loop: **status → debug → fix → deploy → verify**. It wraps the `railway` CLI in a non-interactive, JSON-first style that an agent can drive without prompts, and it leans on `RAILWAY_TOKEN` from the environment instead of an interactive `railway login`.

This skill is **repo-agnostic**. It assumes the project is hosted on Railway (railway.com) and that a `RAILWAY_TOKEN` is exported in the environment. It makes no assumptions about the stack (Node, Python, Go, Docker, Nixpacks/Railpack — Railway's builder figures it out).

## When this skill triggers

Phrases that should route here:

- **Deploy / build**
  - "deploy this to railway"
  - "push to railway", "ship to railway", "railway up"
  - "build is failing on railway", "why did my build fail"
- **Logs / debugging**
  - "show me the railway logs", "tail the logs", "railway logs --since 1h"
  - "why is my service crashing on railway"
  - "show me the 500s on railway", "show http logs", "show slow requests"
  - "find the request id abc123 in railway logs"
- **Ops**
  - "redeploy on railway", "restart the api service", "roll back the last deploy"
  - "scale my railway service", "remove the latest deployment"
- **State / discovery**
  - "list my railway projects", "what services are in this project", "list deployments"
  - "what's the status of my railway project", "is my service healthy"
- **Variables**
  - "set a railway env var FOO=bar", "list railway variables", "delete a railway var"
- **Run / connect**
  - "run this script with railway production env", "open a shell with railway env"
  - "ssh into my railway service", "connect to my railway postgres / redis / mongo"
- **Metrics**
  - "what's the cpu/memory on railway", "is my service hitting limits"
  - "p95 latency on railway", "request rate on /api"

Skip when:

- The host is not Railway (Fly, Render, Vercel, AWS, …). This skill knows the `railway` CLI; it does not generalise.
- The fix is a code change with no operational lever — let the normal dev-process skills handle the code; come back here once it's time to deploy or read logs.

## Prerequisites

1. **CLI on PATH.** `which railway` should resolve. If not, install: `npm install -g @railway/cli` (or use the official installer at https://docs.railway.com/guides/cli). Minimum version: 4.x (this skill assumes the modern subcommand layout — `service list`, `deployment list`, `logs --filter`, `--json` on most commands).
2. **Auth via env var.** `echo "${RAILWAY_TOKEN:0:8}…"` should print a non-empty prefix. The CLI reads `RAILWAY_TOKEN` directly — **do not** run `railway login` in agent sessions. Two token shapes exist:
   - **Account / personal token** (created at https://railway.com/account/tokens) — works across every workspace, project, and environment the user has access to. Required for `railway list`, `railway link --workspace`, and any cross-project view.
   - **Project token** (created in a project's Settings → Tokens, scoped to one project+environment) — works for that single project/env. `railway list` and other workspace-level commands return `Unauthorized` with this kind; `railway status`, `railway logs`, `railway up`, `railway variable …` all work.
   First call that returns `Unauthorized` / `Invalid RAILWAY_TOKEN` is the signal to ask the user which shape they configured and whether they need to widen scope.
3. **No interactive prompts.** Always pass explicit `--project / --service / --environment` flags (and `--json`, `-y`, `--ci` where they exist) instead of relying on linked state. Linked state is a `.railway/` directory and survives across CLI calls, but in fresh agent sessions there is no link yet — set the scope every call until the user explicitly asks to link.

## Operating procedure

The skill is a small state machine. Pick the smallest entry point that answers the user's question; don't run discovery they didn't ask for.

```
       ┌──────────┐
       │ Discover │  list projects / services / deployments / env / vars
       └────┬─────┘
            ▼
       ┌──────────┐        ┌──────────┐
       │  Debug   │◄──────►│ Metrics  │   logs (build/deploy/http) + cpu/mem/p95
       └────┬─────┘        └──────────┘
            ▼
       ┌──────────┐
       │   Fix    │  variables set / code edit / config change
       └────┬─────┘
            ▼
       ┌──────────┐        ┌──────────┐
       │  Deploy  │───────►│  Verify  │   up / redeploy / restart / down / roll back
       └──────────┘        └──────────┘
```

### Step 1 — discover

Always start by capturing the IDs you need, so subsequent calls are explicit. Prefer JSON output for parsing.

```bash
# Workspace-wide view (requires an account token).
railway list --json

# A single project's structure (project token works here too if you pass --project).
railway status --json --project "$PROJECT_ID"

# Services and environments inside that project.
railway service list --json --project "$PROJECT_ID" --environment production
railway environment list --json --project "$PROJECT_ID"

# Deployments for a specific service (most recent first).
railway deployment list \
  --project "$PROJECT_ID" \
  --service api \
  --environment production \
  --limit 20 --json
```

Capture from the JSON: project id, environment id/name (typically `production`, `staging`, plus PR preview envs), service ids/names, the latest deployment id and its `status` (`SUCCESS`, `FAILED`, `BUILDING`, `DEPLOYING`, `CRASHED`, `REMOVED`). The deployment status is what tells you whether the symptom is a build problem, a startup problem, or a steady-state runtime problem — pick the right log stream accordingly.

### Step 2 — debug (logs first)

Railway exposes three log streams. **Pick the one that matches the failure mode**; mixing them makes the tail unreadable.

| Stream | Flag | Use when |
|---|---|---|
| Deploy / runtime | `railway logs` (default) | The app is up but misbehaving, or it crashed after starting. |
| Build | `railway logs --build [DEPLOYMENT_ID]` | Deployment is `FAILED` and never reached runtime. |
| HTTP | `railway logs --http` | The symptom is a status code, a latency spike, a specific request. |

Default to **historical, non-streaming** queries in agent sessions — streaming hangs the shell. Any of `--lines`, `--since`, or `--until` disables streaming.

```bash
# Last 200 deploy log lines, JSON for parsing.
railway logs \
  --project "$PROJECT_ID" --service api --environment production \
  --lines 200 --json

# Build logs for the failed deployment specifically.
railway logs --build "$DEPLOYMENT_ID" \
  --project "$PROJECT_ID" --service api --environment production \
  --lines 500

# Errors only in the last hour.
railway logs --since 1h --filter "@level:error" --lines 100 \
  --project "$PROJECT_ID" --service api --environment production

# All 5xx HTTP responses in the last 30 minutes.
railway logs --http --since 30m --status ">=500" --lines 200 \
  --project "$PROJECT_ID" --service api --environment production --json

# Slow GETs on a specific path.
railway logs --http --method GET --path /api/users \
  --filter "@totalDuration:>=1000" --lines 50 --json \
  --project "$PROJECT_ID" --service api --environment production

# Trace one request end-to-end.
railway logs --http --request-id "$REQUEST_ID" --lines 50 --json \
  --project "$PROJECT_ID" --service api --environment production
```

Filter syntax (Railway query language, also accepted in the dashboard):

- **Text**: bare words → substring match; `"two words"` → phrase.
- **Level** (deploy/build only): `@level:error`, `@level:warn`, `@level:info`.
- **HTTP fields**: `@httpStatus`, `@method`, `@path`, `@host`, `@requestId`, `@clientUa`, `@srcIp`, `@edgeRegion`, `@upstreamAddress`, `@upstreamProto`, `@downstreamProto`, `@responseDetails`, `@deploymentId`, `@deploymentInstanceId`, `@totalDuration`, `@responseTime`, `@upstreamRqDuration`, `@txBytes`, `@rxBytes`, `@upstreamErrors`.
- **Operators**: `> >= < <= ..` (range, e.g. `@httpStatus:200..299`); `AND`, `OR`, `-` (negation), parentheses.

If the user asks for "logs from the latest deployment even if it failed", add `--latest` — otherwise `railway logs` walks back to the most recent **successful** deployment, which is usually not what you want when debugging a regression.

### Step 3 — metrics (sanity check resource state)

Pair logs with metrics when the symptom could be a resource ceiling (OOM kills, CPU throttling, egress bursts, volume full).

```bash
# Compact summary for the linked service, last hour.
railway metrics --json \
  --project "$PROJECT_ID" --service api --environment production

# Specific dimensions.
railway metrics --cpu --memory --since 6h --json \
  --project "$PROJECT_ID" --service api --environment production

# HTTP percentiles + RPS for a path.
railway metrics --http --path /api/users --json --since 1h \
  --project "$PROJECT_ID" --service api --environment production

# Table across every service in the project.
railway metrics --all --json \
  --project "$PROJECT_ID" --environment production
```

Read these together with the deploy log: a memory line climbing into the service's limit followed by a sudden gap is an OOM; sustained CPU at 100% with growing p95 is a throttle. Don't editorialise beyond what the numbers show.

### Step 4 — variables (read-only first, write only on confirmation)

Variables are usually where misconfiguration hides. **Listing variables prints secret values** — treat the output as confidential, never echo raw values back into the chat, and use `--json` so you can summarise (key names + value lengths) instead of pasting plaintext secrets.

```bash
# Read — JSON includes raw values; redact before surfacing.
railway variable list --json \
  --project "$PROJECT_ID" --service api --environment production

# Write — explicit confirmation required before running.
railway variable set "FEATURE_FLAG=on" \
  --project "$PROJECT_ID" --service api --environment production
# Setting a variable triggers a redeploy by default; add --skip-deploys
# (top-level, before the subcommand) to set without redeploying.

# Delete.
railway variable delete FEATURE_FLAG \
  --project "$PROJECT_ID" --service api --environment production
```

Default to listing first ("here are the keys configured on production; which one do you want to change?") and only run `set` / `delete` after the user picks a target. For new secrets, prefer reading from stdin so the plaintext never enters the agent's argv buffer (visible in `ps`): pipe the value into `railway variable set --stdin KEY` (a top-level option on the legacy `variable` form; the modern flow is `railway variable set "KEY=$(< file)"` from a local file the user controls).

### Step 5 — fix and deploy

Three deploy verbs, in increasing order of intent:

| Verb | Effect | Use when |
|---|---|---|
| `railway restart` | Restart the latest deployment without rebuilding. | Process is wedged but the build artefact is fine. |
| `railway redeploy` | Re-run the latest deployment (or `--from-source` to pull the newest commit / image). | A transient failure or you want to redeploy the *same* artefact. Use `--from-source` to pick up new commits without uploading. |
| `railway up` | Upload the current working directory and deploy it. | The fix is a code change in this repo. |

Non-interactive defaults:

```bash
# Restart (no rebuild). -y skips the confirmation dialog.
railway restart -y --json \
  --project "$PROJECT_ID" --service api --environment production

# Redeploy the latest deployment.
railway redeploy -y --json \
  --project "$PROJECT_ID" --service api --environment production

# Redeploy and pull the newest commit / image from the configured source.
railway redeploy -y --from-source --json \
  --project "$PROJECT_ID" --service api --environment production

# Upload and deploy this directory. --ci streams build logs only, then exits;
# perfect for agent sessions (no interactive log attach).
railway up --ci \
  --project "$PROJECT_ID" --service api --environment production \
  --message "fix: bump httpx to 0.27 to pick up TLS bug fix"

# Remove the most recent deployment (rollback to whatever was before it).
railway down -y \
  --project "$PROJECT_ID" --service api --environment production
```

`railway up --ci` is the agent-friendly form: it implies `CI=true`, streams build logs to stdout, and exits with non-zero on build failure. Without `--ci` the CLI tries to attach a live log pager; in an automation context that hangs.

After deploy, **always verify** by sampling the new deployment's logs and a tiny metrics window — don't just trust the exit code. The Railway build can succeed and the runtime can still crashloop on startup.

```bash
# Quick verification loop.
railway deployment list --json --limit 3 \
  --project "$PROJECT_ID" --service api --environment production
railway logs --lines 50 --since 2m \
  --project "$PROJECT_ID" --service api --environment production
```

### Step 6 — run, shell, ssh, db connect

For development workflows that need production env vars locally, or a shell on the live container:

```bash
# Run a one-shot command with the linked service's variables injected.
railway run --service api --environment production -- node scripts/migrate.js

# Open a subshell with the same env (interactive — only run when the user is at the terminal).
railway shell --service api --environment production --silent

# SSH into the running container of a service. -i picks an identity file if Railway
# can't find a usable key in ~/.ssh.
railway ssh \
  --project "$PROJECT_ID" --service api --environment production

# One-shot remote command (non-interactive).
railway ssh \
  --project "$PROJECT_ID" --service api --environment production \
  -- ls /app

# Open a database shell against a Railway-managed DB service.
railway connect postgres \
  --project "$PROJECT_ID" --environment production
```

`railway run env` and `railway run printenv` will print every secret variable for that service — treat the output as you would `railway variable list --json` and never paste it back.

## Common failure shapes

### `Unauthorized. Please check that your RAILWAY_TOKEN is valid`

Either no token, an expired one, or a **project-scoped** token being used against a workspace-level command (`railway list`, `railway link --workspace`). Ask the user which token shape they configured; if they need workspace-level commands, they need an account token from https://railway.com/account/tokens.

### Build `FAILED`, deploy log empty

The failure is in `--build` logs, not the default deploy stream:

```bash
railway logs --build "$DEPLOYMENT_ID" --lines 500 \
  --project "$PROJECT_ID" --service api --environment production
```

If the deployment id is unknown, `railway deployment list --json --limit 5` gives you the most recent failed one.

### `CRASHED` deployment, deploy logs end with the start command

App is dying during startup. Read the tail of `railway logs --lines 200` for the actual exception. Common shapes:

- Missing env var (something like `KeyError: 'DATABASE_URL'` or `panic: required environment variable …`) → `railway variable list --json` to confirm, then `railway variable set …`.
- Port binding wrong — Railway sets `$PORT`; the service must bind to `0.0.0.0:$PORT`, not a hardcoded port.
- DB connection refused — check the linked DB service is in the same environment and the private network DNS (e.g. `postgres.railway.internal`) is what the app expects.

### Build succeeds, runtime 502 / Bad Gateway from the edge

The app didn't bind to `$PORT` in time (default healthcheck window). Either the app is slow to start (raise `healthcheckTimeout` in `railway.json`/`railway.toml`, or fix the slow startup), or it's binding to `127.0.0.1` instead of `0.0.0.0`. Cross-check with `railway logs --http --status 502 --lines 50` to confirm the edge is the source.

### Sudden OOM (`SIGKILL` / `out of memory`)

Pair the deploy log with `railway metrics --memory --since 30m --json`. If memory climbs into the service limit and the gap aligns with the kill, raise the service's memory cap (dashboard or `railway.json` `resources.memory`). Don't silently raise it without telling the user — call out that you saw the ceiling hit.

### `railway up` hangs in an agent session

You forgot `--ci`. The default mode attaches a live pager that doesn't exit. Kill it, re-run with `--ci`.

### Variable changes "didn't take effect"

`railway variable set` triggers a redeploy by default — but if `--skip-deploys` was passed, the variable is staged and the running deployment still has the old value. Either redeploy explicitly (`railway redeploy -y`) or rerun the set without `--skip-deploys`.

## Conventions

- **JSON-first.** Add `--json` to every command that supports it, and parse with `jq` rather than scraping human-readable output. Layouts change; the JSON keys are stable.
- **Explicit scope every call.** Pass `--project`, `--service`, `--environment` on every command in an agent session. Don't rely on `.railway/` linked state — it's invisible to the user and confusing when it drifts.
- **Non-streaming logs by default.** Always combine with `--lines`, `--since`, or `--until`. Streaming is for humans at a terminal, not agents.
- **Never paste secrets.** `railway variable list`, `railway run env`, and `railway shell` all surface plaintext secrets. Summarise (key names, value lengths) instead. If the user explicitly asks for a value, paste it in a code block and remind them it's a secret.
- **Confirm before destructive ops.** `railway down`, `railway restart`, `railway redeploy`, `railway variable delete`, `railway environment delete`, `railway volume delete`, `railway delete` (the project!) all change live state. Repeat the scope back to the user ("restart `api` in `production` of project `…`?") and wait for explicit confirmation, even if `-y` is technically available.
- **Verify after deploy.** Don't end on a `railway up --ci` success line. Pull the latest deployment's status and a 50-line log sample so the user sees the actual runtime state, not just the build outcome.
- **One failure mode per investigation.** Build vs. crashloop vs. 5xx vs. OOM are distinct shapes with distinct log streams. Don't blend their tails in one report.

## Onsager-bundled scripts (optional, repo-specific)

The `scripts/` directory ships three shell wrappers tuned for the
`onsager-ai/onsager` monorepo. They are pinned to that repo's
deployment shape (service name `onsager`, env var
`ONSAGER_RAILWAY_TOKEN`, production URL
`https://onsager-production.up.railway.app`, `justfile` targets).
**Repos other than Onsager can ignore these or fork them**; the
generic operating procedure above covers every project.

When in the Onsager repo:

| Task | Command |
|------|---------|
| Pre-deploy check | `sh scripts/preflight.sh` |
| Diagnose failure | `sh scripts/debug.sh [service]` |
| Verify live deploy | `sh scripts/smoke.sh [url]` |

- **`preflight.sh`** — runs before any deploy or while triaging a build
  failure. Checks lockfiles (`Cargo.lock`, `pnpm-lock.yaml`) are
  tracked in git, Dockerfile COPY sources resolve, Railway vars don't
  leak `localhost`, and `DATABASE_URL` points at the Railway Postgres
  plugin. Exits non-zero on any failure; skips Railway variable
  checks if `ONSAGER_RAILWAY_TOKEN` is not set.
- **`debug.sh [service]`** — one-shot diagnostics for a failed or
  stuck deploy: service status, build logs (40 lines), deploy/runtime
  logs (40), error-only logs (20), HTTP 4xx/5xx (10), env vars.
  Default service `onsager`. Requires `ONSAGER_RAILWAY_TOKEN`.
- **`smoke.sh [base_url]`** — post-deploy verification: API checks
  via `curl` (`/api/health`, `/api/auth/me`, `/api/nodes`,
  `/api/sessions`) and optional UI checks via `agent-browser` (`/`,
  `/sessions`, `/nodes`, `/settings`). Default URL
  `https://onsager-production.up.railway.app`. UI checks skip
  gracefully if `agent-browser` is not on PATH.

These scripts demonstrate the wrapping pattern; another repo
adopting this skill should fork the directory and re-shape the
script bodies for its own deployment.

## Related skills

- The repo's spec-driven dev-process skill — when the fix is a code change, not just an ops lever; that's where the spec / branch / PR loop lives. This skill picks up at the deploy step.
- `plan-dag` — when the operator question is really "what's still blocking the deploy?" rather than "deploy this thing".
- Railway's own AI surfaces — `railway agent -p "<question>"` runs an interactive assistant inside the CLI, and `railway mcp install` wires Railway's MCP server into Claude Code / Cursor / Codex. Useful as a fallback when this skill's scripted flow isn't enough, but they're not a substitute for the explicit JSON-first loop above — they're for exploratory questions, not for reproducible automation.
