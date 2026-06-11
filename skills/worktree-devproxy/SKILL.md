---
name: worktree-devproxy
description: >
  Set up and operate a git-worktree parallel web-dev environment behind a
  shared Traefik proxy — every worktree runs its own docker compose stack,
  reachable at http://<worktree>.<repo>.localhost:8000 by Host-header
  routing, with zero host-port publishing, zero DNS, zero TLS, zero port
  allocation. Covers: one-time machine setup (Traefik on the `devproxy`
  network + the `wt` manager script + direnv), onboarding a repo (.envrc,
  compose Traefik labels, framework adaptations for Vite/Next/etc.), daily
  usage (wt new/rm/ls), host-run stacks joining the same routing without
  containers (Traefik file provider + devproxy-route + auto port
  allocation), and the known failure modes (Docker API version,
  wrong-network 504s, corporate proxy hijacking localhost, root-owned
  bind-mount files, stale host-run routes). Triggers on: "worktree dev
  environment", "devproxy", "wt new", "parallel dev stacks", "Traefik
  localhost routing", "onboard this repo to the worktree proxy", "set up
  worktree dev on this machine", "<name>.<repo>.localhost", "register
  just dev / pnpm dev with the proxy", or debugging a 404/502/504 from
  the dev proxy.
metadata:
  author: onsager-ai
  version: 0.2.0
---

# worktree-devproxy

One shared Traefik + one compose stack per git worktree. Each instance is
reachable at `http://<worktree>.<repo>.localhost:8000`; a laptop reaches it
through a single SSH tunnel. Nothing else touches the host network.

```
laptop browser → SSH tunnel (:8000) → Traefik (127.0.0.1 only)
              → Host-header match → per-worktree compose stack (devproxy network)
```

Invariants (don't trade these away when adapting):

1. **No host ports** except Traefik's own `127.0.0.1:8000` (web) and
   `127.0.0.1:8080` (dashboard/API). Everything else flows over the shared
   external docker network `devproxy`.
2. **Routing is Host-header only** — `*.localhost` resolves to loopback by
   OS convention, so there is no DNS, no TLS, and no port allocation table.
3. **Worktree isolation is `COMPOSE_PROJECT_NAME`** (set by `.envrc` via
   direnv): independent networks, volumes, and container names per worktree.

## One-time machine setup

Prerequisites: `docker` (with compose plugin), `git`, `direnv` (hook it
into the shell rc).

1. Copy [`references/dev-proxy.docker-compose.yml`](references/dev-proxy.docker-compose.yml)
   to `~/dev-proxy/docker-compose.yml`, `mkdir -p ~/dev-proxy/dynamic`,
   and `docker compose up -d` (run with `COMPOSE_PROJECT_NAME=dev-proxy`
   or from a direnv-free shell — a stray project name from another repo's
   `.envrc` creates a *second* Traefik that loses the :8000 bind race).
   Two flags in it are load-bearing, learned the hard way:
   - `image: traefik:v3` (not an old pin) — Traefik ≤ v3.3 hardcodes
     Docker API 1.24, which Docker Engine 29+ rejects outright.
   - `--providers.docker.network=devproxy` — app containers sit on
     `[default, devproxy]`; without the pin Traefik dials the default
     network's IP it can't reach and every request 504s.
2. Install [`scripts/wt`](scripts/wt) and
   [`scripts/devproxy-route`](scripts/devproxy-route) to `~/bin/`,
   `chmod +x`, make sure `~/bin` is on PATH.
3. Verify: `curl -s --noproxy '*' localhost:8080/api/version` returns the
   Traefik version; `curl localhost:8000` returns 404 (no routes yet —
   correct).

## Onboarding a repo

Four pieces per repo, all **committed** — worktrees are created from HEAD,
so uncommitted setup files silently don't propagate and `wt new` breaks.

1. **`.envrc`** at the repo root:

   ```bash
   export REPO=<repo-dir-name>
   export WORKTREE=$(basename "$PWD" | tr '/_.' '-')
   export COMPOSE_PROJECT_NAME="${REPO}-${WORKTREE}"
   # Main checkout (dir name == repo) sits at the apex; worktrees are
   # subdomains: <repo>.localhost vs feat-x.<repo>.localhost.
   if [ "$WORKTREE" = "$REPO" ]; then
       export DEV_HOST="${REPO}.localhost"
   else
       export DEV_HOST="${WORKTREE}.${REPO}.localhost"
   fi
   ```

   Then `direnv allow`. (Don't apex-special-case `COMPOSE_PROJECT_NAME`
   the same way on an already-onboarded repo — renaming the project
   orphans its existing volumes, including the database.)

2. **`docker-compose.yml`** — the HTTP-serving service gets Traefik labels
   and **no `ports:` section**; the file joins the external network:

   ```yaml
   services:
     web:
       labels:
         - traefik.enable=true
         - traefik.http.routers.${COMPOSE_PROJECT_NAME}.rule=Host(`${DEV_HOST}`)
         - traefik.http.services.${COMPOSE_PROJECT_NAME}.loadbalancer.server.port=<container port>
       networks: [default, devproxy]

   networks:
     devproxy:
       external: true
   ```

   Internal services (db, redis) keep only the default network and lose
   any host-port publishing too. Name volumes with **plain aliases** (no
   explicit `name:`) so compose prefixes them per project — that *is* the
   per-worktree data isolation. Give an explicit shared `name:` only to
   caches where cross-worktree reuse is the point (cargo registry,
   sccache, pnpm store).

3. **Server must bind `0.0.0.0`** inside the container, and framework
   Host-checking must admit `.localhost`:
   - **Vite**: `server.allowedHosts: ['.localhost']`; gate `host` on an
     env var (`process.env.VITE_HOST ?? 'localhost'`) so bare host-side
     `pnpm dev` is unchanged; if HMR runs through the proxy, wire
     `server.hmr.clientPort` from an env var and set it to `8000` in
     compose.
   - **Next.js**: dev command gets `-H 0.0.0.0`.
   - Multi-process stacks (API + frontend): either run them in **one
     container** so existing `127.0.0.1` proxy targets keep working, or
     keep an internal reverse proxy (Caddy/nginx) as the labeled service.
   - Rust/Go binaries: pass `--host 0.0.0.0` or the bind env var.

4. **CLAUDE.md** — append a section telling agents the instance is at
   `http://$DEV_HOST:8000` and verifiable with
   `curl -s -H "Host: $DEV_HOST" localhost:8000`.

Useful patterns from onboarded repos: single-container pnpm monorepo
(arbor), build-then-serve with a one-shot builder service +
`service_completed_successfully` dependency (duhem), full multi-service
stack with an internal Caddy edge carrying the Traefik labels (onsager).

## Daily usage

```
wt new feat/xyz   # run inside the repo → branch + worktree + stack up
                  # → http://feat-xyz.<repo>.localhost:8000
wt rm  feat/xyz   # compose down -v + remove worktree (chown fallback built in)
wt ls             # all worktree containers across repos
```

Worktrees land at `<repo-parent>/<repo>-wt/<name>`, sibling to the repo.

Laptop side, one tunnel serves every repo and worktree:

```
Host devbox
    HostName <remote>
    LocalForward 8000 127.0.0.1:8000
    LocalForward 8080 127.0.0.1:8080
```

## Host-run stacks (no containers)

When the containerized per-worktree stack is too slow as the primary loop
(first build compiles the whole workspace into container-private volumes),
a repo's native dev runner (`just dev`, `pnpm dev`, …) can join the same
routing via Traefik's **file provider** — already enabled by the machine
setup above. Pattern (reference implementation: onsager `just dev`,
onsager-ai/onsager#579):

1. **Auto-allocate ports, canonical-first**: try the service's usual port,
   fall back to a random free one so parallel worktree stacks never
   collide. Bash picker:

   ```bash
   pick_port() {
     local p=$1
     while (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; do
       p=$(( (RANDOM % 20000) + 20000 ))
     done
     echo "$p"
   }
   ```

2. **Register the front door only**: `devproxy-route up <port>` writes
   `~/dev-proxy/dynamic/$COMPOSE_PROJECT_NAME.yml` mapping
   `Host($DEV_HOST)` → `http://host.docker.internal:<port>`. Point it at
   the one process that fronts the rest (e.g. Vite with a dev proxy for
   `/api`); backends only need to be reachable *by that process*, not by
   Traefik. `devproxy-route down` in the runner's EXIT trap.

3. **Same framework rules as containers**: the fronting process must bind
   `0.0.0.0` (host-gateway traffic arrives on a non-loopback interface),
   allow `.localhost` hosts, and aim its HMR websocket at the proxy port
   (`clientPort: 8000`) when reached through Traefik.

Containerized (`wt new`) and host-run stacks coexist behind one Traefik —
routing is per-hostname, so each worktree independently picks whichever
mode fits. Don't run both modes for the *same* worktree at once: two
routers with an identical Host rule is a coin-flip.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Traefik logs `client version 1.24 is too old` | Old Traefik image vs Docker 29+. Use `traefik:v3` (v3.5+). |
| 502 on a host-run stack's hostname | Stale route file from a hard-killed runner (EXIT trap never ran), or the fronting process bound to `127.0.0.1` so host-gateway can't reach it. `rm ~/dev-proxy/dynamic/<project>.yml` or restart the runner; bind `0.0.0.0`. |
| Every route 504s but containers are healthy | Traefik dialing the wrong network. Ensure `--providers.docker.network=devproxy`. |
| 404 from Traefik | No router matched: label interpolation empty (direnv not allowed / compose run without the env), or container not on `devproxy`. Check `curl -s localhost:8080/api/rawdata`. |
| `curl localhost:8000` exits 000 / hangs | Corporate proxy env (`ALL_PROXY` etc.) hijacking loopback. `export NO_PROXY=localhost,127.0.0.1,.localhost` in the shell rc, or `curl --noproxy '*'`. |
| Vite answers 403 / "host not allowed" | Missing `server.allowedHosts: ['.localhost']`. |
| `wt rm` fails `Permission denied` | Root-owned files written by containers into the bind mount. The bundled `wt` already chowns via a throwaway alpine container and falls back to `rm -rf` + `git worktree prune`. |
| `wt new` works but the app 404s/504s briefly | First boot is still installing/compiling inside the container — `docker logs <project>-<service>-1` to watch progress. |
| Stack vanished after a docker daemon restart | App services carry no `restart:` policy by design (only Traefik does). Re-run `docker compose up -d` in the worktree. |
