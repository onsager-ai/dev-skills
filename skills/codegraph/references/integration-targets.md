# Integration targets

## Known integration targets

Cold-start measured locally (Node 22, 4 cores). Cloud cold-start still pending — re-run [spike protocol](spike.md) in a cloud session before relying on these numbers there.

| Repo | Indexed files | Nodes / edges | DB size | Cold init+index | Query wall |
|---|---|---|---|---|---|
| onsager-ai/onsager | 578 (rust + tsx/ts) | 8.6k / 20k | 24 MB | 12s | ~0.9s |
| crawlab-team/crawlab | 644 (go) | 6.8k / 15k | 11 MB | 6s | ~0.9s |
| codervisor/leanspec | 695 (tsx/rust/ts) | 8.9k / 21k | 23 MB | 10s | ~0.9s |

Per-query wall is dominated by Node startup — the SQLite work itself is milliseconds. End-to-end cold-start including one-shot `npx install` is ~13–19s for repos in this size class.
