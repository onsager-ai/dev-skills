# Optional user-level design integrations

Install from the canonical dev-skills source, once per machine or persistent
cloud home. The installer writes no product files and preserves existing named
MCP entries. Linux/macOS need Python >=3.11, Node >=22.19, npm and Codex CLI.
Codex-only setup is the default. Claude Code installation, configuration and
validation are deferred unless `--harness both` is explicitly selected.
Windows can use WSL; native desktop integrations can instead
be enabled in pen.dev's MCP settings.

```sh
python3 skills/ui-design/scripts/setup.py --harness codex
```

The pinned installer uses pen.dev CLI 0.3.10 and Claude Code 2.1.293 only with
`--harness both` when missing. Its runtime dependency lock is included. Review
vendor updates upstream, update pins/lock and rerun setup deliberately. Do not
also install the same pen.dev skill as a vendor plugin.

## One canonical installation, selected harnesses

`--harness codex` does not probe/install Claude Code, write its user config or
create its user skill symlinks. Future `--harness both` reuses the same canonical
installation and adds Claude discovery/configuration without duplicate skills.
Generated consumer Claude projections remain for future compatibility; they do
not install, configure or authenticate Claude Code.

- The pen.dev package's pen-design skill is preserved under the same user-level
  canonical tree, with discovery symlinks for the selected harnesses. Its generic
  recommendations yield
  to repository-specific design/implementation contracts.
- The repository ui-design procedure stays pinned and generated using the
  existing manifest architecture. Do not install dev-skills globally on top of
  a checkout-local consumer.
- `~/.local/bin/ui-design` is an absolute-path launcher referenced by user MCP
  entry named `pencil`. Codex uses its user config.toml; Claude
  uses user-scoped MCP configuration. No .mcp.json is added to consumer repos.
  Existing entries are reused and must be validated separately; the installer
  does not replace credentials or app-managed configuration. For entries owned
  by this launcher it sets a 60-second startup allowance and forwards secure
  credential/proxy/CA environment variable names through Codex `env_vars`; no
  credential values are stored. Existing explicit forwarding/timeout choices
  are preserved and must be validated independently.

## Authentication and custody

Inject PEN_CLI_KEY through the environment's secure secret
settings, or edit `~/.config/ui-design/credentials.json` privately on a local
machine. That regular file must be owned by the user and mode 0600; its directory
should be 0700. Its initially empty entries are loaded only at runtime. Inherited
secure variables take precedence, including proxy-injected credential bindings.
Do not paste secrets in chat, commit them, place them in MCP headers/env config,
pass them as CLI arguments or inspect provider token files.

The pen launcher preloads a proxy-aware fetch dispatcher in its Node child,
preserving existing `NODE_OPTIONS`, inherited proxy settings and CA trust. TLS
verification remains enabled. The credential loader reads only PEN_CLI_KEY;
other entries in an existing credential file are ignored and preserved. Setup
adds only pen.dev tooling; it does not uninstall previous user tools, delete
credentials or remove unrelated MCP entries.

### Upgrading a previous installation

Before restarting a harness that used the retired Stitch integration, disable
its old `stitch` entry in that harness's MCP settings. The updated launcher rejects
that mode, so leaving the old entry enabled produces a startup failure. Remove
only installer-created discovery symlinks whose resolved targets are inside
`~/.local/share/ui-design-tools/stitch-skills`, under the selected harness's
`~/.agents/skills` or `~/.claude/skills`. Keep the canonical vendor checkout,
regular files, user edits and credentials. Review external entries separately.
The installer preserves these old settings/links rather than silently deleting
them; repository updates do not apply this user-machine migration automatically.

For pen.dev headless operations use an organization CLI key from Developer Keys,
or `~/.local/bin/ui-design pen login` to store a vendor-managed session. Both
harnesses use that same CLI and session. Desktop authentication remains separate;
do not copy CLI sessions over desktop sessions.

Claude Code must independently authenticate with its normal login or a supported
secure provider configuration. Codex uses its own native auth. Calling headless
`pen interactive` from either harness does not spawn another LLM and needs only
pen.dev authentication. `pen --prompt` is a separate nested agent operation:
Claude requires supported provider auth; pen's Codex agent requires `pen
codex-login` or its documented provider key. A logged-in Codex CLI is not proof
of pen's Codex-provider authentication. Never silently switch billing methods.

## Desktop versus cloud

The pinned package includes native stdio MCP binaries. The pencil launcher
selects the OS/architecture and connects with `-app desktop` (PEN_MCP_APP may
select another installed host). A same-machine pen.dev desktop/IDE app must be
running with the intended .pen file open. Its native server has no headless
flag; it uses a local Unix socket/named pipe and is not a remote HTTP service.
Remote cloud agents cannot access a laptop's app through this configuration.
The package's native files may need executable mode; setup repairs it.

In cloud use `~/.local/bin/ui-design pen interactive --out <artifact.pen>` or
supported CLI export operations. This is a CLI capability, not successful
desktop MCP access. Use read_skill/get_app_state/execute in its interactive
shell, then save() and exit(). No custom CLI-to-MCP bridge is introduced.
Export failure can leave a zero exit status: check that the image exists and
inspect it. Headless mode has no desktop browser tool or live canvas preview.

Persistent user config/skills remove per-repo/session setup. Ephemeral workers
still need image provisioning or an automated startup run of this installer,
plus secure secret injection. Use `--harness codex` for worker bootstrap and
verify credentials in the actual agent, MCP child and CLI child using presence
checks only. Preserve injected proxy/CA settings; do not print key values, lengths,
prefixes or hashes. If `CODEX_HOME` is supplied, Codex writes its user config there;
persistence of that directory and the user home is a worker provisioning concern.
An already-running harness may need restart/reload to register newly added MCP
servers and skills. This cannot configure an unattached laptop or a
different Claude cloud host. Restart each harness after initial setup.

## Independent validation

```sh
codex mcp list
node ~/.local/share/ui-design-tools/runtime/smoke.mjs codex pencil
~/.local/bin/ui-design pen status
~/.local/bin/ui-design pen interactive --out /absolute/scratch/smoke.pen
```

Claude equivalents are deferred in Codex-only setup; use them independently
after explicitly selecting and authenticating Claude Code.

Each smoke process loads that harness's actual named entry, initializes MCP,
lists tools and calls get_app_state without printing private
results. This establishes configured transport compatibility, not model-driven
harness execution. In a fresh authenticated harness session, read AGENTS and
ui-design, inspect skill discovery, and invoke those read tools directly. In
headless pen smoke, read_skill(), get_app_state(), save(), exit() operate only
on the explicit scratch output; inspect its existence. Record exact failures
and distinguish unavailable authentication/host from success.

## Vendor sources

- [pen.dev installation and native MCP](https://docs.pen.dev/getting-started/installation)
- [pen.dev MCP architecture](https://docs.pen.dev/getting-started/ai-integration)
- [Headless CLI and authentication](https://docs.pen.dev/for-developers/pen-cli)

An installed vendor skill can still contain stale commands; the CLI/live tool
catalog and repository contract take precedence.
