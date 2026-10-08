# Optional user-level design integrations

Install from the canonical dev-skills source, once per machine or persistent
cloud home. The installer writes no product files and preserves existing named
MCP entries. Linux/macOS need Node >=22.19, npm, Git and Codex CLI. Claude Code is
installed if absent. Windows can use WSL; native desktop integrations can instead
be enabled in pen.dev's MCP settings.

```sh
python3 skills/ui-design/scripts/setup.py
```

The pinned installer uses pen.dev CLI 0.3.10, Claude Code 2.1.293 when missing,
Google Labs Stitch SDK 0.3.5 and the original Stitch skills commit
`0337446dadde6f8c94210444e2aa9d546126480f`. Its dependency lock is included.
Review vendor updates upstream, update pins/lock and rerun setup deliberately.
Do not also install these same skills as vendor plugins.

## One configuration, two harnesses

- `~/.local/share/ui-design-tools/stitch-skills` is the original pinned vendor
  checkout. Six Stitch design skills and design-md/enhance-prompt are symlinked
  into `~/.agents/skills` (Codex) and `~/.claude/skills` (Claude Code). All relative
  references/scripts stay in the canonical checkout. Framework-specific build,
  shadcn, video and taste prescriptions are not installed by default.
- The pen.dev package's pen-design skill is preserved under the same user-level
  canonical tree, with two discovery symlinks. Its generic recommendations yield
  to repository-specific design/implementation contracts.
- The repository ui-design procedure stays pinned and generated using the
  existing manifest architecture. Do not install dev-skills globally on top of
  a checkout-local consumer.
- `~/.local/bin/ui-design` is an absolute-path launcher referenced by user MCP
  entries named `stitch` and `pencil`. Codex uses its user config.toml; Claude
  uses user-scoped MCP configuration. No .mcp.json is added to consumer repos.
  Existing entries are reused and must be validated separately; the installer
  does not replace credentials or app-managed configuration.

## Authentication and custody

Inject STITCH_API_KEY and PEN_CLI_KEY through the environment's secure secret
settings, or edit `~/.config/ui-design/credentials.json` privately on a local
machine. That regular file must be owned by the user and mode 0600; its directory
should be 0700. Its initially empty entries are loaded only at runtime. Inherited
secure variables take precedence, including proxy-injected credential bindings.
Do not paste secrets in chat, commit them, place them in MCP headers/env config,
pass them as CLI arguments or inspect provider token files.

Get a Stitch key through Stitch's MCP/API-key settings. The launcher runs the
original Google Labs SDK stdio proxy against `https://stitch.googleapis.com/mcp`;
both harnesses share the same runtime credential lookup. The SDK supplies the
X-Goog-Api-Key header in memory. Proxy and CA settings are preserved; TLS
verification remains enabled. API keys are chosen for durable shared use, rather
than copying separate harness OAuth caches or expiring access tokens.

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
plus secure secret injection. This cannot configure an unattached laptop or a
different Claude cloud host. Restart each harness after initial setup.

## Independent validation

```sh
codex mcp list
claude mcp list
node ~/.local/share/ui-design-tools/runtime/smoke.mjs codex stitch
node ~/.local/share/ui-design-tools/runtime/smoke.mjs claude stitch
node ~/.local/share/ui-design-tools/runtime/smoke.mjs codex pencil
node ~/.local/share/ui-design-tools/runtime/smoke.mjs claude pencil
~/.local/bin/ui-design pen status
~/.local/bin/ui-design pen interactive --out /absolute/scratch/smoke.pen
```

Each smoke process loads that harness's actual named entry, initializes MCP,
lists tools and calls list_projects or get_app_state without printing private
results. This establishes configured transport compatibility, not model-driven
harness execution. In a fresh authenticated harness session, read AGENTS and
ui-design, inspect skill discovery, and invoke those read tools directly. In
headless pen smoke, read_skill(), get_app_state(), save(), exit() operate only
on the explicit scratch output; inspect its existence. Record exact failures
and distinguish unavailable authentication/host from success.

## Vendor sources

- [Stitch MCP setup](https://stitch.withgoogle.com/docs/mcp/setup/)
- [Original Google Labs skills](https://github.com/google-labs-code/stitch-skills)
- [Original Google Labs SDK](https://github.com/google-labs-code/stitch-sdk)
- [pen.dev installation and native MCP](https://docs.pen.dev/getting-started/installation)
- [pen.dev MCP architecture](https://docs.pen.dev/getting-started/ai-integration)
- [Headless CLI and authentication](https://docs.pen.dev/for-developers/pen-cli)

The Google Labs skills/SDK are Google-maintained open-source projects with their
own support disclaimer. An installed vendor skill can still contain stale
commands; the CLI/live tool catalog and repository contract take precedence.
