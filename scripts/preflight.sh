#!/bin/sh
# Railway deploy preflight — catches dev/prod divergence before it reaches Railway.
# Each check maps to a real incident. Exit 1 if any check fails.
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

pass=0
fail=0
warn=0

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

warn_check() {
    local label="$1"; shift
    if "$@" > /dev/null 2>&1; then
        echo "  PASS  $label"
        pass=$((pass + 1))
    else
        echo "  WARN  $label"
        warn=$((warn + 1))
    fi
}

echo "=== Railway Preflight ==="
echo ""
echo "--- Git / Build Context ---"

check "Cargo.lock tracked in git" \
    git ls-files --error-unmatch Cargo.lock

check "pnpm-lock.yaml tracked in git" \
    git ls-files --error-unmatch pnpm-lock.yaml

# Verify Dockerfiles don't COPY files that are gitignored
docker_copy_ok=true
for dockerfile in crates/stiglab/deploy/Dockerfile deploy/synodic.Dockerfile; do
    [ -f "$dockerfile" ] || continue
    grep -oP '^\s*COPY\s+\K\S+' "$dockerfile" \
        | grep -v -- '--from=' \
        | while read -r src; do
            case "$src" in *\**|*\$*) continue;; esac
            if [ -f "$src" ] && ! git ls-files --error-unmatch "$src" > /dev/null 2>&1; then
                echo "  FAIL  $dockerfile: COPY source '$src' not in git"
                echo "FAIL" >> /tmp/preflight-docker-fail.$$
            fi
          done
done
if [ -f /tmp/preflight-docker-fail.$$ ]; then
    rm -f /tmp/preflight-docker-fail.$$
    fail=$((fail + 1))
else
    echo "  PASS  Dockerfile COPY sources all tracked"
    pass=$((pass + 1))
fi

# Railway variable checks (need token)
if [ -z "$ONSAGER_RAILWAY_TOKEN" ]; then
    echo ""
    echo "--- Railway Variables (SKIPPED: ONSAGER_RAILWAY_TOKEN not set) ---"
else
    echo ""
    echo "--- Railway Variables ---"
    export RAILWAY_TOKEN="$ONSAGER_RAILWAY_TOKEN"
    # Collapse wrapped table output into single lines for reliable grepping
    vars=$(railway variable list --service onsager 2>&1 | tr -d '\n║│' | tr '╔╗╚╝═─' ' ') || true

    # No localhost in vars
    if echo "$vars" | grep -qi 'localhost'; then
        echo "  FAIL  Railway vars contain 'localhost' (dev values leaked to prod)"
        fail=$((fail + 1))
    else
        echo "  PASS  No localhost in Railway vars"
        pass=$((pass + 1))
    fi

    # DATABASE_URL references Railway plugin
    if echo "$vars" | grep -q 'railway\.internal'; then
        echo "  PASS  DATABASE_URL references Railway Postgres plugin"
        pass=$((pass + 1))
    else
        echo "  FAIL  DATABASE_URL may not reference Railway Postgres plugin"
        fail=$((fail + 1))
    fi
fi

echo ""
echo "=== Results: $pass passed, $fail failed, $warn warnings ==="
[ "$fail" -eq 0 ] || exit 1
