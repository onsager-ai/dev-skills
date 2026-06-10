#!/usr/bin/env bash
# spec-list.sh — list spec issues with activity DERIVED from issue state + linked PRs.
#
# The issue-spec SOP applies no status labels: lifecycle is just open → closed.
# This script enriches that with the linked-PR signal so you can see, at a glance,
# which open specs are actually in flight without opening each one.
#
#   ○ todo         open, no linked PR
#   ● in-progress  open, ≥1 linked PR still open
#   ◐ partial      open, only merged PRs linked (e.g. `Part of #N` parent)
#   ✓ done         closed
#
# Usage:
#   scripts/spec-list.sh                 # open specs in the current repo
#   scripts/spec-list.sh --state all     # include closed
#   scripts/spec-list.sh --state closed
#   scripts/spec-list.sh --area cli      # filter to area:cli
#   scripts/spec-list.sh --repo owner/name
#
# Requires: gh (authenticated), jq.
set -euo pipefail

state="open"
area=""
repo=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --state)  state="$2"; shift 2 ;;
    --area)   area="$2"; shift 2 ;;
    --repo)   repo="$2"; shift 2 ;;
    -h|--help) sed -n '2,22p' "$0"; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

command -v gh >/dev/null || { echo "gh not found" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq not found" >&2; exit 1; }

[[ -z "$repo" ]] && repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

# Build the search query.
q="repo:$repo is:issue label:spec"
case "$state" in
  open)   q="$q is:open" ;;
  closed) q="$q is:closed" ;;
  all)    ;;
  *) echo "--state must be open|closed|all" >&2; exit 2 ;;
esac
[[ -n "$area" ]] && q="$q label:area:$area"

read -r -d '' QUERY <<'GRAPHQL' || true
query($q: String!, $cursor: String) {
  search(query: $q, type: ISSUE, first: 50, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on Issue {
        number title url state body
        labels(first: 30) { nodes { name } }
        timelineItems(first: 60, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
          nodes {
            __typename
            ... on CrossReferencedEvent { source { __typename ... on PullRequest { number state } } }
            ... on ConnectedEvent       { subject { __typename ... on PullRequest { number state } } }
          }
        }
      }
    }
  }
}
GRAPHQL

# Paginate, collecting all nodes into one stream.
cursor=""
nodes_file="$(mktemp)"
trap 'rm -f "$nodes_file"' EXIT
while :; do
  if [[ -z "$cursor" ]]; then
    page="$(gh api graphql -f query="$QUERY" -f q="$q")"
  else
    page="$(gh api graphql -f query="$QUERY" -f q="$q" -f cursor="$cursor")"
  fi
  echo "$page" | jq -c '.data.search.nodes[]' >> "$nodes_file"
  if [[ "$(echo "$page" | jq -r '.data.search.pageInfo.hasNextPage')" == "true" ]]; then
    cursor="$(echo "$page" | jq -r '.data.search.pageInfo.endCursor')"
  else
    break
  fi
done

# Derive status + plan progress, emit aligned rows sorted by number.
jq -rs '
  def prs:
    [ .timelineItems.nodes[]?
      | (.source // .subject)
      | select(.__typename == "PullRequest")
    ] | unique_by(.number);
  def status:
    if .state == "CLOSED" then "✓ done"
    elif (prs | map(select(.state == "OPEN")) | length) > 0 then "● in-progress"
    elif (prs | length) > 0 then "◐ partial"
    else "○ todo" end;
  def plan:
    ( [ .body | scan("(?m)^- \\[x\\]") ] | length ) as $done
    | ( [ .body | scan("(?m)^- \\[ \\]") ] | length ) as $todo
    | if ($done + $todo) == 0 then "" else "\($done)/\($done + $todo)" end;
  def areas:
    [ .labels.nodes[].name | select(startswith("area:")) | ltrimstr("area:") ] | join(",");
  sort_by(.number)
  | .[]
  | [ "#\(.number)", status, (areas // ""), plan, .title ]
  | @tsv
' "$nodes_file" | awk -F'\t' '
  { n[NR]=$1; s[NR]=$2; a[NR]=$3; p[NR]=$4; t[NR]=$5
    if (length($1)>wn) wn=length($1)
    if (length($2)>ws) ws=length($2)
    if (length($3)>wa) wa=length($3)
    if (length($4)>wp) wp=length($4) }
  END {
    if (NR==0) { print "No spec issues found."; exit }
    for (i=1;i<=NR;i++)
      printf "%-*s  %-*s  %-*s  %-*s  %s\n", wn,n[i], ws,s[i], wa,a[i], wp,p[i], t[i]
  }'
