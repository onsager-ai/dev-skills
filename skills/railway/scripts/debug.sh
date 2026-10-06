#!/bin/sh
# Railway debug — single-command diagnostics for a failed or misbehaving deploy.
# Usage: debug.sh [service]
# Collects: service status, build logs (tail), deploy logs (tail), error logs, env vars.
set -e

SERVICE="${1:-onsager}"

if [ -n "$ONSAGER_RAILWAY_TOKEN" ]; then
    export RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN"
fi

echo "=== Railway Debug: $SERVICE ==="

echo ""
echo "--- Service Status ---"
railway service status --all 2>&1

echo ""
echo "--- Build Logs (last 40 lines) ---"
railway logs --service "$SERVICE" --build --lines 40 --latest 2>&1 || echo "(no build logs)"

echo ""
echo "--- Deploy Logs (last 40 lines) ---"
railway logs --service "$SERVICE" --lines 40 --latest 2>&1 || echo "(no deploy logs)"

echo ""
echo "--- Error Logs (last 20) ---"
railway logs --service "$SERVICE" --lines 20 --filter "@level:error" 2>&1 || echo "(no errors)"

echo ""
echo "--- HTTP Errors (last 10, status >= 400) ---"
railway logs --service "$SERVICE" --http --status ">=400" --lines 10 2>&1 || echo "(no http errors)"

echo ""
echo "--- Environment Variable Names (values withheld) ---"
# Do not mix stderr into JSON: a diagnostic error may include private material.
# Pipeline failure is propagated by the JSON parser rather than printed raw.
railway variable list --service "$SERVICE" --json 2>/dev/null | python3 -c '
import json, sys
variables = json.load(sys.stdin)
if not isinstance(variables, dict):
    raise SystemExit("Unexpected variable response shape; values withheld")
print("\n".join(sorted(variables)))
'
