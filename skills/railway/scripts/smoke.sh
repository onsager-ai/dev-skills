#!/bin/sh
# Railway smoke test — verify the live deployment works after a deploy.
# Usage: smoke.sh [base_url]
# Runs API checks (curl) and optionally UI checks (agent-browser).
set -e

BASE_URL="${1:-https://onsager-production.up.railway.app}"
pass=0
fail=0

check() {
    local label="$1"; shift
    if "$@" > /dev/null 2>&1; then
        echo "  PASS  $label"
        pass=$((pass + 1))
    else
        echo "  FAIL  $label"
        fail=$((fail + 1))
    fi
}

echo "=== Railway Smoke Test: $BASE_URL ==="

# --- Service status (if token available) ---
if [ -n "$ONSAGER_RAILWAY_TOKEN" ]; then
    echo ""
    echo "--- Service Status ---"
    status=$(RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN" railway service status --all 2>&1)
    echo "$status"
    if echo "$status" | grep -q "SUCCESS"; then
        pass=$((pass + 1))
        echo "  PASS  Service status is SUCCESS"
    else
        fail=$((fail + 1))
        echo "  FAIL  Service not in SUCCESS state"
    fi
fi

# --- API Checks ---
echo ""
echo "--- API Checks ---"

check "GET /api/health returns 200" \
    curl -sf --max-time 10 "$BASE_URL/api/health"

health_body=$(curl -sf --max-time 10 "$BASE_URL/api/health" 2>/dev/null || echo "{}")
if echo "$health_body" | grep -q '"status"'; then
    echo "  PASS  /api/health returns status JSON"
    echo "         $health_body"
    pass=$((pass + 1))
else
    echo "  FAIL  /api/health response missing status field"
    fail=$((fail + 1))
fi

check "GET /api/auth/me returns 200" \
    curl -sf --max-time 10 "$BASE_URL/api/auth/me"

nodes_code=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' "$BASE_URL/api/nodes" 2>/dev/null || echo "000")
if echo "$nodes_code" | grep -qE '^(200|401)$'; then
    echo "  PASS  GET /api/nodes returns $nodes_code"
    pass=$((pass + 1))
else
    echo "  FAIL  GET /api/nodes returns $nodes_code (expected 200 or 401)"
    fail=$((fail + 1))
fi

sessions_code=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' "$BASE_URL/api/sessions" 2>/dev/null || echo "000")
if echo "$sessions_code" | grep -qE '^(200|401)$'; then
    echo "  PASS  GET /api/sessions returns $sessions_code"
    pass=$((pass + 1))
else
    echo "  FAIL  GET /api/sessions returns $sessions_code (expected 200 or 401)"
    fail=$((fail + 1))
fi

# --- UI Checks (if agent-browser available via npx) ---
if npx agent-browser --version > /dev/null 2>&1; then
    echo ""
    echo "--- UI Checks (agent-browser) ---"

    # Auto-detect Linux AppArmor sandbox restriction
    if [ -z "$AGENT_BROWSER_ARGS" ] && [ "$(uname)" = "Linux" ]; then
        restrict=$(sysctl -n kernel.apparmor_restrict_unprivileged_userns 2>/dev/null || echo "0")
        if [ "$restrict" = "1" ]; then
            export AGENT_BROWSER_ARGS="--no-sandbox"
        fi
    fi

    pages="/ /sessions /nodes /settings"
    for page in $pages; do
        url="$BASE_URL$page"
        npx agent-browser open "$url" 2>/dev/null
        sleep 2

        # Check for JS errors in console
        console_errors=$(npx agent-browser console 2>/dev/null | grep -ci 'error' || true)
        snapshot=$(npx agent-browser snapshot 2>/dev/null || echo "")

        if [ -n "$snapshot" ] && [ "$console_errors" -lt 3 ]; then
            echo "  PASS  UI renders: $page"
            pass=$((pass + 1))
        else
            echo "  FAIL  UI issue: $page (console errors: $console_errors)"
            npx agent-browser screenshot 2>/dev/null || true
            fail=$((fail + 1))
        fi
    done
else
    echo ""
    echo "--- UI Checks (SKIPPED: agent-browser not installed) ---"
fi

echo ""
echo "=== Results: $pass passed, $fail failed ==="
[ "$fail" -eq 0 ] || exit 1
