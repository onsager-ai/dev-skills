---
name: railway
description: Manage, debug, and smoke-test Railway deployments for the Onsager project. Use when asked to "check railway", "debug deployment", "railway logs", "why is deploy failing", "redeploy", "smoke test", "test the deploy", "is railway working", "check service status", "railway variables", "preflight", or any Railway deployment task. Also use proactively after pushing code that changes deploy-relevant files (Dockerfile, entrypoint, migrations, railway.toml).
allowed-tools: Bash(RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway *), Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(curl *), Bash(sh *), Bash(bash *)
---

# Railway

Manage, debug, and smoke-test Railway deployments for the Onsager monorepo.

All operations are bundled as scripts in `scripts/` — call them directly to
avoid token overhead from many individual CLI invocations. The scripts handle
authentication, error formatting, and pass/fail reporting.

## Quick Reference

| Task | Command |
|------|---------|
| Pre-deploy check | `sh .claude/skills/railway/scripts/preflight.sh` |
| Diagnose failure | `sh .claude/skills/railway/scripts/debug.sh [service]` |
| Verify live deploy | `sh .claude/skills/railway/scripts/smoke.sh [url]` |
| Redeploy | `RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway redeploy --service onsager --yes` |
| Restart (no rebuild) | `RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway restart --service onsager --yes` |

## Scripts

### preflight.sh

Run before any deploy or when triaging a build failure. Checks:
- Lockfiles (`Cargo.lock`, `pnpm-lock.yaml`) tracked in git
- Dockerfile COPY sources not gitignored
- Railway vars don't contain `localhost` (dev/prod leak)
- `DATABASE_URL` references Railway Postgres plugin

Exits 0 on all-pass, 1 on any failure. Skips Railway variable checks if
`ONSAGER_RAILWAY_TOKEN` is not set.

### debug.sh [service]

One-shot diagnostics for a failed or stuck deploy. Collects:
- Service status (all services)
- Build logs (last 40 lines)
- Deploy/runtime logs (last 40 lines)
- Error-only logs (last 20)
- HTTP errors (status >= 400, last 10)
- Environment variables

Default service: `onsager`. Requires `ONSAGER_RAILWAY_TOKEN`.

### smoke.sh [base_url]

Post-deploy verification against the live deployment. Runs:
- API checks via curl: `/api/health`, `/api/auth/me`, `/api/nodes`, `/api/sessions`
- UI checks via agent-browser (if installed): `/`, `/login`, `/sessions`, `/nodes`, `/settings`

Default URL: `https://onsager-production.up.railway.app`. UI checks are
skipped gracefully if agent-browser is not available.

## When to Use Each

- **"check railway" / "is it working"** → `smoke.sh`
- **"why is deploy failing" / "debug"** → `debug.sh`
- **Before pushing deploy-relevant changes** → `preflight.sh`
- **After pushing a fix** → `preflight.sh` then wait for build, then `smoke.sh`

## Project Layout

| Service        | Description                              | Port |
|----------------|------------------------------------------|------|
| **onsager**    | Stiglab (sessions, agents, dashboard, API) | 3000 |
| *(planned)*    | Synodic (governance API)                 | 3001 |
| **PostgreSQL** | Shared event spine (Railway plugin)      | 5432 |

Public URL: `https://onsager-production.up.railway.app`

Config files:
- `railway.toml` — root config-as-code
- `crates/stiglab/deploy/Dockerfile` — stiglab multi-stage build
- `crates/stiglab/deploy/entrypoint.sh` — auto-migrating entrypoint
- `deploy/synodic.Dockerfile` — synodic build

## Common Failure Modes

**Build failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cargo.lock not found` | Lockfile gitignored | Remove from `.gitignore`, commit it |
| `pnpm-lock.yaml not found` | Lockfile not committed | Commit it |
| `COPY ... not found` | Dockerfile path vs repo mismatch | Check COPY paths |
| Rust compilation error | Code doesn't compile | `cargo build -p stiglab` locally |

**Runtime failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Health check timeout | `/api/health` not responding | Check entrypoint, migrations, port |
| `connection refused localhost:5432` | Dev DATABASE_URL in prod | Set to `${{Postgres.DATABASE_URL}}` |
| Migration failure | Bad SQL | Check `crates/onsager-spine/migrations/` |
