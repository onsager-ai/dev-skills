# codegraph — Cold-Start Spike Protocol

Measure CodeGraph cold-start cost on a target repo before integrating. Run once per target repo, in the environment where it will actually be used (most importantly: Claude Code Cloud session).

## Target repos

Run the protocol independently against each. One report per repo.

| # | Repo | Notes |
|---|---|---|
| 1 | `onsager-ai/onsager` | TS monorepo; primary integration target |
| 2 | `crawlab` | Go + TS/Vue; brownfield stress test |
| 3 | `codervisor/leanspec` | scope and language mix unverified — confirm before running |

## Ground rules

- Time every step with `/usr/bin/time -v` (or bash `time` as fallback) — record wall / user / sys
- No subjective "fast" / "slow" — numbers only
- Do not silently retry failures — capture raw stderr
- Do not modify repo source; write only to `.codegraph/` and `~/.npm`
- No sudo required

## Phase 0 — Environment baseline

```bash
# Runtime
uname -a
node --version
npm --version
nproc
free -h
df -h /

# npm cache state — cold or warm?
ls ~/.npm 2>/dev/null | head -5 || echo "no npm cache"
npm config get cache

# Repo stats
cd <repo-root>
git rev-parse HEAD
find . -type f -not -path './.git/*' -not -path './node_modules/*' | wc -l
du -sh . --exclude=.git --exclude=node_modules

# Language breakdown (top 10 extensions)
find . -type f -not -path './.git/*' -not -path './node_modules/*' \
  | grep -oE '\.[a-zA-Z0-9]+$' | sort | uniq -c | sort -rn | head -10
```

## Phase 1 — Install timing

Critical observation: whether tree-sitter native bindings trigger `node-gyp` compilation.

```bash
mkdir -p /tmp/cg-spike && cd /tmp/cg-spike

{ /usr/bin/time -v npx --yes @colbymchenry/codegraph --version ; } 2> install.time.log

grep -iE "node-gyp|prebuild|rebuild|gcc|make\[" install.time.log | head -20 || echo "no native build signals"

du -sh ~/.npm/_npx 2>/dev/null
du -sh /tmp/cg-spike
```

## Phase 2 — Index timing

```bash
cd <repo-root>

{ /usr/bin/time -v npx @colbymchenry/codegraph init ; } 2> init.time.log
{ /usr/bin/time -v npx @colbymchenry/codegraph index ; } 2> index.time.log

npx @colbymchenry/codegraph status > status.txt 2>&1
cat status.txt

ls -lah .codegraph/
du -sh .codegraph/
```

## Phase 3 — Query smoke test (CLI path)

Cloud session cannot restart Claude Code to load the MCP server. Probe via CLI — this still exercises the SQLite query layer end-to-end.

Pick 3 queries meaningful for the specific repo. If unfamiliar, `codegraph files` or `ls` first. Prefer one each of: symbol lookup / cross-file call traversal / task context.

Run these from inside the repo — `query`, `context`, and `files` operate on `cwd` and reject a trailing path argument. Only `init`, `index`, `status`, `sync` take a path.

```bash
cd <repo-root>
{ /usr/bin/time -v npx @colbymchenry/codegraph query "<SYMBOL>" --json ; } 2> q1.time.log > q1.out.json
{ /usr/bin/time -v npx @colbymchenry/codegraph context "<TASK>" --format markdown --max-nodes 20 ; } 2> q2.time.log > q2.out.md
{ /usr/bin/time -v npx @colbymchenry/codegraph files --json ; } 2> q3.time.log > q3.out.json
```

Baseline — same symbol lookup with grep:

```bash
{ /usr/bin/time -v grep -rn "<SYMBOL>" --include="*.ts" --include="*.js" --include="*.go" --include="*.py" . 2>/dev/null | head -50 ; } 2> grep.time.log
```

## Phase 4 — Persistence probe (manual follow-up)

Cannot complete in current session. Record as open items for the operator:

- [ ] End current session; start a new session on the same repo
- [ ] `.codegraph/codegraph.db` still present?
- [ ] `~/.npm/_npx` codegraph cache still present?
- [ ] `codegraph status` works directly, or requires fresh install?
- [ ] `.codegraph/codegraph.db` size — viable for git LFS / artifact cache?

Do not speculate answers.

## Phase 5 — Report template

Output as the final reply, no wrapping commentary:

````markdown
# CodeGraph Cloud Spike Report — <repo>

**Repo**: <repo> @ <commit-sha>
**Runtime**: Claude Code Cloud (or: local / devcontainer), Node <ver>, <nproc> cores, <mem>
**Date**: <date>

## 0. Repo baseline
- Files: <N>
- Size: <size>
- Top languages: <ext: count, ...>

## 1. Install cost
- Wall: <Xm Ys>
- Native compilation: <yes/no, which packages>
- ~/.npm/_npx footprint: <size>

## 2. Index cost
- `init` wall: <s>
- `index` wall: <Xm Ys>
- Indexed files: <N>
- Nodes / edges: <N> / <N>
- `.codegraph/` size: <size>
- Total cold-start (1 + 2): <Xm Ys>

## 3. Query latency
| Query | codegraph wall | output size | grep baseline |
|---|---|---|---|
| symbol search | <s> | <N lines> | <s> |
| context build | <s> | <N bytes> | — |
| files structure | <s> | <N entries> | — |

## 4. Persistence — open items
- [ ] new-session: .codegraph/ preserved?
- [ ] new-session: npx cache preserved?
- [ ] .codegraph/codegraph.db size git-LFS-viable?

## 5. Inference (this run only, no extrapolation beyond same-size repos)
- Cold-start range for similar repos: <X min>
- Cloud worth-it: <pending §4>

## 6. Anomalies
- <raw error / unexpected behavior, if any>
````

## Cross-repo summary (after all three reports)

| Repo | Files | Cold-start | DB size | Per-query (search) | Notes |
|---|---|---|---|---|---|
| onsager-ai/onsager | | | | | |
| crawlab | | | | | |
| codervisor/leanspec | | | | | |

## Reminders

1. Every step uses `/usr/bin/time -v` — no skips
2. Do not grep the whole repo to figure out what to query — use `codegraph files` or `ls` first
3. Failures recorded raw, no silent retry
4. Do not try to fix codegraph itself — black-box measurement
5. Complete all phases before emitting Phase 5 report; no streaming partials
