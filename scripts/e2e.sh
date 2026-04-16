#!/bin/sh
# Railway e2e test — full browser-based verification of the deployed site.
# Usage: e2e.sh [base_url]
# Requires: npx agent-browser (by vercel-labs)
# On Linux with AppArmor, set AGENT_BROWSER_ARGS="--no-sandbox"
set -e

BASE_URL="${1:-https://onsager-production.up.railway.app}"
pass=0
fail=0
export AGENT_BROWSER_ARGS="${AGENT_BROWSER_ARGS:-}"

# Detect Linux AppArmor sandbox restriction and auto-set --no-sandbox
if [ -z "$AGENT_BROWSER_ARGS" ] && [ "$(uname)" = "Linux" ]; then
    restrict=$(sysctl -n kernel.apparmor_restrict_unprivileged_userns 2>/dev/null || echo "0")
    if [ "$restrict" = "1" ]; then
        export AGENT_BROWSER_ARGS="--no-sandbox"
    fi
fi

ab() { npx agent-browser "$@" 2>&1; }

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

snapshot_contains() {
    local label="$1"
    local pattern="$2"
    local snap
    snap=$(ab snapshot)
    if echo "$snap" | grep -qi "$pattern"; then
        echo "  PASS  $label"
        pass=$((pass + 1))
    else
        echo "  FAIL  $label (pattern '$pattern' not found)"
        fail=$((fail + 1))
    fi
}

echo "=== Railway E2E Test: $BASE_URL ==="

# --- Preflight: ensure agent-browser works ---
if ! command -v npx > /dev/null 2>&1; then
    echo "  SKIP  npx not available — cannot run e2e tests"
    exit 0
fi

# Kill stale daemon, start fresh
pkill -f "agent-browser" 2>/dev/null || true
sleep 2

echo ""
echo "--- Dashboard ---"
ab open "$BASE_URL"
sleep 2

snapshot_contains "Dashboard heading renders" "Dashboard"
snapshot_contains "Shows nodes count" "Nodes Online"
snapshot_contains "Shows active sessions count" "Active Sessions"
snapshot_contains "Shows version" "v0.1.0"
snapshot_contains "Navigation has all links" "Sessions"

# Check no JS errors
console_errors=$(ab console | grep -ci 'error' || true)
if [ "$console_errors" -lt 3 ]; then
    echo "  PASS  No excessive JS console errors ($console_errors)"
    pass=$((pass + 1))
else
    echo "  FAIL  JS console errors: $console_errors"
    fail=$((fail + 1))
fi

echo ""
echo "--- Nodes Page ---"
ab open "$BASE_URL/nodes"
sleep 2

snapshot_contains "Nodes heading renders" "heading.*Nodes"
snapshot_contains "Nodes table has columns" "columnheader"
snapshot_contains "Shows node status" "Online"
snapshot_contains "Shows node name" "built-in-runner"

echo ""
echo "--- Sessions Page ---"
ab open "$BASE_URL/sessions"
sleep 2

snapshot_contains "Sessions heading renders" "heading.*Sessions"
snapshot_contains "New Session button present" "New Session"

echo ""
echo "--- Settings Page ---"
ab open "$BASE_URL/settings"
sleep 2

snapshot_contains "Settings heading renders" "heading.*Settings"
snapshot_contains "Credential management visible" "Credentials"
snapshot_contains "Claude Code credential option" "CLAUDE_CODE_OAUTH_TOKEN"
snapshot_contains "Anthropic API key option" "ANTHROPIC_API_KEY"
snapshot_contains "Custom credential input" "ENV_VAR_NAME"

echo ""
echo "--- New Session Modal ---"
ab open "$BASE_URL/sessions"
sleep 2

# Find and click New Session button
new_session_ref=$(ab snapshot | grep -oP 'button "New Session".*?ref=\K[^]]+' | head -1)
if [ -n "$new_session_ref" ]; then
    ab click "$new_session_ref"
    sleep 1

    snapshot_contains "Modal opens with form" 'dialog.*New Session'
    snapshot_contains "Prompt field present" 'textbox "Prompt"'
    snapshot_contains "Node selector present" 'combobox.*Node'
    snapshot_contains "Working directory field present" 'Working directory'

    # Verify Create Session is disabled without input
    disabled_check=$(ab snapshot | grep 'Create Session' || true)
    if echo "$disabled_check" | grep -q 'disabled'; then
        echo "  PASS  Create Session disabled without prompt"
        pass=$((pass + 1))
    else
        echo "  FAIL  Create Session should be disabled without prompt"
        fail=$((fail + 1))
    fi

    # Fill prompt and verify button enables
    prompt_ref=$(ab snapshot | grep -oP 'textbox "Prompt".*?ref=\K[^]]+' | head -1)
    if [ -n "$prompt_ref" ]; then
        ab fill "$prompt_ref" "e2e test prompt"
        sleep 1
        enabled_check=$(ab snapshot | grep 'Create Session' || true)
        if echo "$enabled_check" | grep -qv 'disabled'; then
            echo "  PASS  Create Session enables with prompt"
            pass=$((pass + 1))
        else
            echo "  FAIL  Create Session should enable after entering prompt"
            fail=$((fail + 1))
        fi
    fi

    # Close modal (don't create a session)
    close_ref=$(ab snapshot | grep -oP 'button "Close".*?ref=\K[^]]+' | head -1)
    if [ -n "$close_ref" ]; then
        ab click "$close_ref"
        sleep 1
    fi
else
    echo "  FAIL  Could not find New Session button"
    fail=$((fail + 1))
fi

echo ""
echo "--- Navigation ---"
ab open "$BASE_URL/"
sleep 2

# Test clicking each nav link
for page in Nodes Sessions Settings Dashboard; do
    snap=$(ab snapshot)
    link_ref=$(echo "$snap" | grep -oP "link \"$page\".*?ref=\\K[^]]+" | head -1)
    if [ -n "$link_ref" ]; then
        ab click "$link_ref"
        sleep 1
        snap2=$(ab snapshot)
        if echo "$snap2" | grep -qi "heading.*$page"; then
            echo "  PASS  Nav link '$page' works"
            pass=$((pass + 1))
        else
            echo "  FAIL  Nav link '$page' didn't navigate correctly"
            fail=$((fail + 1))
        fi
    else
        echo "  FAIL  Nav link '$page' not found"
        fail=$((fail + 1))
    fi
done

echo ""
echo "=== Results: $pass passed, $fail failed ==="
[ "$fail" -eq 0 ] || exit 1
