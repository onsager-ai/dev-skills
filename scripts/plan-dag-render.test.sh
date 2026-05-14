#!/usr/bin/env bash
# Golden tests for plan-dag-render. Exits non-zero on any diff or unexpected
# exit code. Suitable for CI.
#
# Required on PATH:
#   - `dot` (graphviz) — for the default (top-to-bottom box-drawing) renderer.
#                        apt install graphviz, or brew install graphviz.

set -u
cd "$(dirname "$0")/.."

if ! command -v dot >/dev/null 2>&1; then
    printf 'plan-dag-render.test: `dot` (graphviz) required on PATH.\n' >&2
    printf 'Install: apt install graphviz, or brew install graphviz.\n' >&2
    exit 2
fi

SCRIPT="scripts/plan-dag-render.py"
FIX="fixtures"
EXP="$FIX/expected"

fail=0
pass=0

assert_eq () {
    local label="$1" got_file="$2" exp_file="$3"
    if diff -u "$exp_file" "$got_file" >/dev/null; then
        pass=$((pass + 1))
        printf '  ok  %s\n' "$label"
    else
        fail=$((fail + 1))
        printf '  FAIL %s\n' "$label"
        diff -u "$exp_file" "$got_file" | sed 's/^/    /'
    fi
}

run_and_compare () {
    # $1 label, $2 fixture, $3 expected suffix (tb|ascii), $4... extra args
    local label="$1" fix="$2" suf="$3"; shift 3
    local base; base="$(basename "$fix" .json)"
    local out="$tmp/$base.$suf"
    "$SCRIPT" "$fix" "$@" > "$out" 2>"$out.err"
    local rc=$?
    if [ "$rc" -ne 0 ]; then
        fail=$((fail + 1))
        printf '  FAIL %s exited %d\n' "$label" "$rc"
        sed 's/^/    /' < "$out.err"
        return
    fi
    assert_eq "$label" "$out" "$EXP/$base.$suf"
}

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "happy.json"
run_and_compare "happy default (tb)"  "$FIX/happy.json" tb
run_and_compare "happy --as=ascii"    "$FIX/happy.json" ascii --as=ascii

echo "wide.json"
run_and_compare "wide default (tb)"   "$FIX/wide.json"  tb
run_and_compare "wide --as=ascii"     "$FIX/wide.json"  ascii --as=ascii

echo "bad.json (must fail validation)"
"$SCRIPT" "$FIX/bad.json" > "$tmp/bad.out" 2>"$tmp/bad.err"
rc=$?
if [ "$rc" -ne 1 ]; then
    fail=$((fail + 1))
    printf '  FAIL bad expected exit 1, got %d\n' "$rc"
else
    pass=$((pass + 1))
    printf '  ok  bad exit 1\n'
fi
for token in 'duplicate node id' 'invalid status' 'missing label' \
             'not in declared nodes' 'missing source' 'not in [' \
             'must be an object' 'forbidden character' \
             'reserved for the synthetic CLOSE' 'ir.close is missing' \
             'critical_path[1]'; do
    if grep -qF "$token" "$tmp/bad.err"; then
        pass=$((pass + 1))
        printf '  ok  bad stderr contains: %s\n' "$token"
    else
        fail=$((fail + 1))
        printf '  FAIL bad stderr missing: %s\n' "$token"
    fi
done

echo "stdin mode"
for tgt in tb ascii; do
    if [ "$tgt" = "tb" ]; then
        cat "$FIX/happy.json" | "$SCRIPT" - > "$tmp/stdin.$tgt" 2>/dev/null
    else
        cat "$FIX/happy.json" | "$SCRIPT" - --as="$tgt" > "$tmp/stdin.$tgt" 2>/dev/null
    fi
    rc=$?
    if [ "$rc" -ne 0 ]; then
        fail=$((fail + 1))
        printf '  FAIL stdin %s exited %d\n' "$tgt" "$rc"
        continue
    fi
    assert_eq "stdin $tgt matches file-arg" "$tmp/stdin.$tgt" "$EXP/happy.$tgt"
done

echo "auto-fallback (dot not on PATH → --as=ascii)"
py3="$(command -v python3)"
PATH="" "$py3" "$SCRIPT" "$FIX/happy.json" > "$tmp/fallback.out" 2>"$tmp/fallback.err"
rc=$?
if [ "$rc" -ne 0 ]; then
    fail=$((fail + 1))
    printf '  FAIL fallback exited %d\n' "$rc"
    sed 's/^/    /' < "$tmp/fallback.err"
elif ! grep -q 'falling back to --as=ascii' "$tmp/fallback.err"; then
    fail=$((fail + 1))
    printf '  FAIL fallback: stderr missing fallback note\n'
    sed 's/^/    /' < "$tmp/fallback.err"
else
    pass=$((pass + 1))
    printf '  ok  fallback emits stderr note\n'
    assert_eq "fallback output matches --as=ascii golden" "$tmp/fallback.out" "$EXP/happy.ascii"
fi

echo
printf 'plan-dag-render.test: %d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
