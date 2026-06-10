#!/usr/bin/env bash
# spec-show.sh — show one spec issue's DERIVED activity, linked PRs, plan progress,
# and whether open questions are still outstanding.
#
# Mirrors spec-list.sh's status derivation for a single issue, with detail:
#   - derived status (○ todo / ● in-progress / ◐ partial / ✓ done)
#   - every linked PR and its state
#   - Plan checkbox progress
#   - whether an "Open questions" subsection with unanswered (blockquote) lines exists
#
# Usage:
#   scripts/spec-show.sh 42
#   scripts/spec-show.sh 42 --repo owner/name
#
# Requires: gh (authenticated), jq.
set -euo pipefail

num=""
repo=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
    *) num="${1#\#}"; shift ;;
  esac
done

[[ -z "$num" ]] && { echo "usage: spec-show.sh <issue-number> [--repo owner/name]" >&2; exit 2; }
command -v gh >/dev/null || { echo "gh not found" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq not found" >&2; exit 1; }
[[ -z "$repo" ]] && repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
owner="${repo%/*}"; name="${repo#*/}"

read -r -d '' QUERY <<'GRAPHQL' || true
query($owner: String!, $name: String!, $num: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $num) {
      number title url state body
      labels(first: 30) { nodes { name } }
      timelineItems(first: 100, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
        nodes {
          __typename
          ... on CrossReferencedEvent { source { __typename ... on PullRequest { number state title url } } }
          ... on ConnectedEvent       { subject { __typename ... on PullRequest { number state title url } } }
        }
      }
    }
  }
}
GRAPHQL

gh api graphql -f query="$QUERY" -f owner="$owner" -f name="$name" -F num="$num" \
  | jq -r '
    .data.repository.issue as $i
    | ($i // error("issue not found")) | .
    | ([ .timelineItems.nodes[]? | (.source // .subject) | select(.__typename == "PullRequest") ] | unique_by(.number)) as $prs
    | (if .state == "CLOSED" then "✓ done"
       elif ($prs | map(select(.state == "OPEN")) | length) > 0 then "● in-progress"
       elif ($prs | length) > 0 then "◐ partial"
       else "○ todo" end) as $status
    | ( [ .body | scan("(?m)^- \\[x\\]") ] | length ) as $pdone
    | ( [ .body | scan("(?m)^- \\[ \\]") ] | length ) as $ptodo
    | ([ .labels.nodes[].name | select(startswith("area:")) | ltrimstr("area:") ] | join(", ")) as $areas
    # Open questions = blockquote lines under an "Open questions" heading still present (only meaningful while open).
    | ( (.state != "CLOSED")
        and (.body | test("(?im)^#+.*open questions"))
        and (.body | test("(?m)^> *\\S")) ) as $oq
    | "spec #\(.number)  \($status)",
      "  \(.title)",
      "  \(.url)",
      "  area:     \(if $areas == "" then "—" else $areas end)",
      "  plan:     \(if ($pdone + $ptodo) == 0 then "—" else "\($pdone)/\($pdone + $ptodo) checked" end)",
      "  open Qs:  \(if $oq then "⚠ unresolved — block work until answered" else "none" end)",
      "  PRs:",
      ( if ($prs | length) == 0 then "    (none linked)"
        else ($prs[] | "    #\(.number)  \(.state | ascii_downcase)  \(.title)") end )
  '
