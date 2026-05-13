#!/usr/bin/env bash
# Golden tests for plan-dag-render. Exits non-zero on any diff or unexpected
# exit code. Suitable for CI.
#
# Required on PATH:
#   - `dot`         (graphviz)    — for the `tb` target (default renderer).
#                                   apt install graphviz, or brew install graphviz.
#   - `graph-easy`  (Perl module) — for the `boxart` / `ascii` targets.
#                                   apt install libgraph-easy-perl, or cpan -T -i Graph::Easy.

set -u
cd "$(dirname "$0")/.."

missing=()
command -v dot        >/dev/null 2>&1 || missing+=("dot (graphviz)")
command -v graph-easy >/dev/null 2>&1 || missing+=("graph-easy")
if [ "${#missing[@]}" -gt 0 ]; then
    printf 'plan-dag-render.test: missing required tools on PATH:\n' >&2
    for m in "${missing[@]}"; do printf '  - %s\n' "$m" >&2; done
    printf 'See script header for install hints.\n' >&2
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

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "happy.json"
for tgt in tb boxart ascii mermaid; do
    "$SCRIPT" "$FIX/happy.json" --as="$tgt" > "$tmp/happy.$tgt" 2>"$tmp/happy.$tgt.err"
    rc=$?
    if [ "$rc" -ne 0 ]; then
        fail=$((fail + 1))
        printf '  FAIL happy --as=%s exited %d\n' "$tgt" "$rc"
        sed 's/^/    /' < "$tmp/happy.$tgt.err"
        continue
    fi
    assert_eq "happy --as=$tgt" "$tmp/happy.$tgt" "$EXP/happy.$tgt"
done

echo "wide.json"
for tgt in tb boxart ascii mermaid; do
    "$SCRIPT" "$FIX/wide.json" --as="$tgt" > "$tmp/wide.$tgt" 2>"$tmp/wide.$tgt.err"
    rc=$?
    if [ "$rc" -ne 0 ]; then
        fail=$((fail + 1))
        printf '  FAIL wide --as=%s exited %d\n' "$tgt" "$rc"
        sed 's/^/    /' < "$tmp/wide.$tgt.err"
        continue
    fi
    assert_eq "wide --as=$tgt" "$tmp/wide.$tgt" "$EXP/wide.$tgt"
done

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
for tgt in tb boxart ascii mermaid; do
    cat "$FIX/happy.json" | "$SCRIPT" - --as="$tgt" > "$tmp/stdin.$tgt" 2>/dev/null
    rc=$?
    if [ "$rc" -ne 0 ]; then
        fail=$((fail + 1))
        printf '  FAIL stdin --as=%s exited %d\n' "$tgt" "$rc"
        continue
    fi
    assert_eq "stdin --as=$tgt matches file-arg" "$tmp/stdin.$tgt" "$EXP/happy.$tgt"
done

echo
printf 'plan-dag-render.test: %d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
