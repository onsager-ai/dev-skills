---
name: railway
description: Manage, debug, and smoke-test Railway deployments for the Onsager project. Use when asked to "check railway", "debug deployment", "railway logs", "why is deploy failing", "redeploy", "smoke test", "test the deploy", "is railway working", "check service status", "railway variables", "preflight", or any Railway deployment task. Also use proactively after pushing code that changes deploy-relevant files (Dockerfile, entrypoint, migrations, railway.toml).
allowed-tools: Bash(RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway *), Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(curl *)
---

# Railway

Manage, debug, and smoke-test Railway deployments for the Onsager monorepo.
Three modes: **preflight** (before deploy), **debug** (when something breaks),
**smoke test** (verify the live deployment works).

## Authentication

All Railway CLI commands use the project-scoped token:

```bash
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway <command>
```

This is a project token — `whoami` will fail, that's expected. Use `railway status`
to verify the token works. If the token is not set, ask the user to export
`ONSAGER_RAILWAY_TOKEN`.

## Project Layout

| Service        | Description                              | Port |
|----------------|------------------------------------------|------|
| **onsager**    | Stiglab (sessions, agents, dashboard, API) | 3000 |
| *(planned)*    | Synodic (governance API)                 | 3001 |
| **PostgreSQL** | Shared event spine (Railway plugin)      | 5432 |

Public URL: `https://onsager-production.up.railway.app`

Config files:
- `railway.toml` — root config-as-code (stiglab primary service)
- `crates/stiglab/deploy/Dockerfile` — stiglab multi-stage build
- `crates/stiglab/deploy/entrypoint.sh` — auto-migrating entrypoint
- `deploy/synodic.Dockerfile` — synodic build

---

## 1. Preflight Check

Run before any deploy or when triaging a failure. Catches known classes of
dev/prod divergence — each check maps to a real incident.

```bash
# 1. Lockfiles tracked in git (build context comes from git, not local fs)
#    Incident: Cargo.lock in .gitignore → Docker COPY failed on Railway
git ls-files --error-unmatch Cargo.lock pnpm-lock.yaml

# 2. Dockerfiles don't COPY files that are gitignored
for f in crates/stiglab/deploy/Dockerfile deploy/synodic.Dockerfile; do
  [ -f "$f" ] || continue
  grep -oP '^\s*COPY\s+\K\S+' "$f" | grep -v -- '--from=' | while read src; do
    [ -f "$src" ] && git ls-files --error-unmatch "$src" 2>/dev/null || true
  done
done

# 3. Railway vars don't contain localhost (dev values leaked to prod)
#    Incident: DATABASE_URL=postgres://...@localhost:5432 → connection refused at runtime
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway variable list --service onsager 2>&1 \
  | grep -i localhost && echo "FAIL: localhost in Railway vars" || echo "OK: no localhost"

# 4. Database URLs reference Railway plugin, not hardcoded
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway variable list --service onsager 2>&1 \
  | grep -E 'DATABASE_URL.*railway\.internal' > /dev/null \
  && echo "OK: DATABASE_URL → Railway Postgres" \
  || echo "FAIL: DATABASE_URL may not reference Railway Postgres plugin"
```

If any check fails, fix it before deploying. See "Common Failure Modes" below.

---

## 2. Debug

### Check Service Status

```bash
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway service status --all
```

States: `BUILDING`, `DEPLOYING`, `SUCCESS`, `FAILED`, `CRASHED`, `REMOVED`

### Inspect Logs

**Build logs** (Dockerfile build failures):
```bash
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway logs --service onsager --build --lines 100 --latest
```

**Deploy/runtime logs** (startup crashes, runtime errors):
```bash
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway logs --service onsager --lines 100 --latest
```

**Error-only logs**:
```bash
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway logs --service onsager --lines 50 --filter "@level:error"
```

**HTTP request logs** (health check failures, 5xx errors):
```bash
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway logs --service onsager --http --status ">=400" --lines 50
```

**Time-bounded logs**:
```bash
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway logs --service onsager --since 1h --until 10m
```

### Check Environment Variables

```bash
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway variable list --service onsager
```

Required variables for stiglab:
- `DATABASE_URL` — `${{Postgres.DATABASE_URL}}`
- `ONSAGER_DATABASE_URL` — `${{Postgres.DATABASE_URL}}`
- `STIGLAB_CREDENTIAL_KEY` — 32-byte hex AES-256-GCM key
- `PORT` — auto-injected by Railway

### Redeploy

After fixing a build issue:
```bash
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway redeploy --service onsager --yes
```

Restart without rebuild (runtime issues):
```bash
RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway restart --service onsager --yes
```

### Common Failure Modes

**Build failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cargo.lock not found` | Lockfile gitignored | Remove from `.gitignore`, commit it |
| `pnpm-lock.yaml not found` | Lockfile not committed | Commit it |
| Rust compilation error | Code doesn't compile | Fix locally: `cargo build -p stiglab` |
| `COPY ... not found` | Dockerfile path vs repo layout mismatch | Check COPY paths in Dockerfile |

**Runtime failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Health check timeout | `/api/health` not responding | Check entrypoint.sh, migration duration, port binding |
| `connection refused localhost:5432` | Dev DATABASE_URL leaked to prod | Set to `${{Postgres.DATABASE_URL}}` |
| Migration failure | Bad SQL in spine migrations | Check `crates/onsager-spine/migrations/` |

---

## 3. Smoke Test

After a deploy reaches `SUCCESS`, verify the live app works end-to-end.
Uses agent-browser for UI checks and curl for API checks.

### API Checks (fast, no browser needed)

```bash
# Health endpoint — must return 200 with {"status":"ok"}
curl -sf https://onsager-production.up.railway.app/api/health

# Auth status — must return 200 (checks DB connectivity)
curl -sf https://onsager-production.up.railway.app/api/auth/me
```

### UI Checks (agent-browser)

```bash
# 1. Dashboard loads
agent-browser open https://onsager-production.up.railway.app
agent-browser screenshot
agent-browser snapshot -i

# 2. Login page renders (if auth enabled)
agent-browser open https://onsager-production.up.railway.app/login
agent-browser screenshot
agent-browser snapshot -i
# Expect: GitHub OAuth login button visible

# 3. Key pages load without errors
agent-browser open https://onsager-production.up.railway.app/sessions
agent-browser screenshot
agent-browser snapshot -i

agent-browser open https://onsager-production.up.railway.app/nodes
agent-browser screenshot
agent-browser snapshot -i

agent-browser open https://onsager-production.up.railway.app/settings
agent-browser screenshot
agent-browser snapshot -i
```

### What to Check

For each page:
- **Loads without blank screen** — React app hydrated, not a white page or error
- **No console errors** — check `agent-browser console` for JS exceptions
- **Key elements render** — navigation bar, page title, data tables or empty states
- **API calls succeed** — network tab shows 200s, not 401s/500s/connection errors

### Smoke Test Workflow

The full post-deploy verification sequence:

1. Confirm service status is `SUCCESS`
2. Run API checks with curl (health, auth)
3. Open each UI page with agent-browser, screenshot, check for errors
4. Report pass/fail summary

If auth is enabled and pages redirect to login, that's a pass — the redirect
itself proves the app is running and routing correctly. Test authenticated
flows only if the user provides credentials.

---

## 4. Verifying a Fix

After pushing a fix and redeploying, the full sequence:

1. Run preflight checks (section 1)
2. Watch build: `railway logs --service onsager --build --latest`
3. Watch deploy: `railway logs --service onsager --latest`
4. Confirm status: `railway service status --all` → `SUCCESS`
5. Run smoke test (section 3)
