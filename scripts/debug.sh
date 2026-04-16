#!/bin/sh
# Railway debug — single-command diagnostics for a failed or misbehaving deploy.
# Usage: debug.sh [service]
# Collects: service status, build logs (tail), deploy logs (tail), error logs, env vars.
set -e

SERVICE="${1:-onsager}"

if [ -z "$ONSAGER_RAILWAY_TOKEN" ]; then
    echo "ERROR: ONSAGER_RAILWAY_TOKEN not set" >&2
    exit 1
fi
export RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN"

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
echo "--- Environment Variables ---"
railway variable list --service "$SERVICE" 2>&1
