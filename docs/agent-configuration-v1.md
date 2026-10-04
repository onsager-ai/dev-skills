# Onsager Agent Configuration Standard v1 Draft

This standard gives developers and coding agents one repository contract across Claude Code, Codex CLI and Codex Cloud, with native adapters and selectively loaded workflows. Its goal is predictable instructions with one authored source, low permanent context and reviewable exceptions. Adoption is proposed, not yet organization policy.

## Normative language and scope

MUST identifies an adoption requirement. SHOULD identifies a default with a recorded exception. MAY identifies an optional mechanism. The standard governs instructions used to develop repositories. Product prompts, runtime mandates, signing policies and deployed authorization remain product artifacts under their existing ownership.

## Canonical contract

An adopted repository MUST have a regular root `AGENTS.md`. It MUST identify purpose, architectural boundaries, invariants, required check entrypoints, completion criteria, relevant module contracts and conditional references. It MUST be sufficient for essential repository policy without a remote fetch or personal installation.

Repository facts MUST be owned locally. Shared organizational defaults MAY occupy a short generated section with stable rule IDs. Any exception MUST identify the rule, scope, rationale, decision source, owning role and condition for review. The effective exception MUST be visible in AGENTS; metadata alone is insufficient.

The root SHOULD require discovery of applicable module instruction files before editing those modules. It SHOULD explain generated/vendor ownership and mutable compatibility posture when those affect changes. It MUST distinguish quick development checks from merge/release gates and identify prerequisites or blocked checks honestly.

## File responsibilities

| Location | Adoption requirement | Content and ownership |
| --- | --- | --- |
| `AGENTS.md` | Required | Repo-owned contract; centrally generated common block only when selected |
| `CLAUDE.md` | Required for initial compatibility profile | Native `@AGENTS.md` import plus actual Claude mechanics; harness owner |
| `<module>/AGENTS.md` | Optional | Material module differences; module owner |
| `<module>/CLAUDE.md` | With nested contracts in compatibility profile | Import of the adjacent AGENTS; generated or module-owned adapter |
| `.agents/skills/<name>/SKILL.md` | When applicable workflows exist | Canonical repo procedures or pinned shared procedures; source owner |
| `.claude/skills/<name>/` | When Claude uses those workflows | Generated regular projection or internal per-skill link; no independent edits |
| `.agents/manifest.json` | When shared material is managed | Selected rules/skills, source revision, projections and exceptions |
| `.claude/rules/` | Optional | Claude-specific selectors/mechanics or generated module projections |
| `.claude/agents/` | Optional | Native role/tool/model/isolation configuration; actual role needs only |
| `.claude/settings.json` | Optional | Native settings and hooks; no claim of cross-harness enforcement |
| `.claude/commands/` | Legacy | Existing workflows only; prefer skills for new procedures |
| `.codex/config.toml` | Optional | Supported native project configuration on trusted execution surfaces |
| `.agents/adapters/codex.md` | Optional | Explicitly loaded Codex-specific procedure; not a native entrypoint |
| `.github/copilot-instructions.md` | Surface-dependent | Small generated projection and actual Copilot-specific notes |
| Existing docs and ADRs | Retained | Detailed architecture, evidence, history and mutable status, loaded conditionally |

Do not introduce a purported native `CODEX.md`. Do not use `AGENTS.override.md` as a routine Codex adapter: it replaces the ordinary AGENTS selected at that directory.

## Harness compatibility

Claude Code currently supports native AGENTS discovery from v2.1.277, but default discovery chooses project or ancestor CLAUDE files instead when present. A CLAUDE adapter MUST import AGENTS with native `@AGENTS.md`, rather than merely asking the model to read it. Keep that bridge until the supported fleet is experimentally validated. Project settings cannot be assumed to force the built-in instruction-file selector. Claude imports expand into context and do not save tokens.

Codex CLI discovers global guidance and a project-root-to-working-directory instruction chain. At each directory it selects AGENTS.override, AGENTS, or configured fallback in that order. The documented default project-document budget is 32 KiB. Do not assume a root-launched session injects every descendant module file. Explicit module discovery remains required.

Codex reads skills from `.agents/skills` in the working directory and ancestor directories up to the Git root. Claude uses `.claude/skills`; native AGENTS support does not imply native `.agents/skills` support. Skill projections MUST preserve references and dependencies. Generated regular directories are the portable baseline; repository-internal per-skill symlinks MAY be used on a validated Unix profile.

Codex Cloud MUST be tested independently. Required policy and workflow files MUST be present in the selected checkout. Do not depend on a developer home directory, local `wt` executable, personal MCP connection, or unverified project-config injection. Setup and maintenance MUST respect the task branch and pinned dependency versions. Agent-phase networking, setup secrets and cache behavior are separate environment properties.

Copilot, Cursor and OpenCode MAY use their supported AGENTS mechanisms. Additional projections SHOULD be added only for adopted surfaces. Copilot chat, cloud agent and review MUST be tested separately when adopted; do not generalize one surface's behavior to all three.

## Authority and collision policy

Discovery, injection order and instruction authority are separate concepts. File names do not grant system or developer authority. Follow the platform's actual system/developer messages, enforced managed policy and permission boundaries.

Organizational defaults MAY be specialized through explicit repo/module exceptions. Adapters MUST translate mechanics without weakening repository invariants. Skills MUST implement the contract and MUST NOT silently introduce a different authorization policy. User preferences apply through actual harness user mechanisms; they do not erase repository governance or platform constraints.

An explicit task supplies scope and authorization. A task that changes a repository invariant follows the repository's established specification/change process. Unresolved conflicting rules MUST be identified by source and resolved explicitly; do not rely on concatenation order as a policy decision.

Claude memory prose is concatenated, and its documentation warns that conflicting prose may be followed inconsistently. Codex documents more-specific project guidance following ancestor guidance. Copilot and OpenCode have different selection rules. This standard is an organizational conflict convention, not a universal runtime precedence algorithm.

## Module contracts and delegation

Nested AGENTS SHOULD exist only for meaningful differences. They MUST state scope and preserve ancestor invariants unless an explicit exception names a departure. Keep sibling module rules out of unrelated tasks.

Delegation philosophy belongs in user or adopted team conventions; native agent definitions belong in adapters. When delegating, provide the exact ref/worktree, affected module contract and relevant invariants. Do not assume every research subagent receives the parent instruction set. Separate editing sessions SHOULD use isolated checkouts; stricter primary-checkout parking policies remain explicit local rules.

An ephemeral Cloud checkout can already provide isolation. Do not change existing primary-checkout policies merely by inference; record any proposed exception and validate the execution environment first.

## Skills and tool portability

Skills SHOULD have a clear trigger, scope, prerequisites, procedure, verification and failure/reporting behavior. Use standard `name` and `description` metadata. Native extensions such as tool grants, dynamic commands or subagent execution MUST be identified as extensions and never treated as universal permission controls.

Shared skill bodies SHOULD describe operations and outcomes. Adapter references SHOULD describe available tool mappings. Preserve product metadata such as Onsager's MCP grant catalogue; it may have product-specific enforcement independent of a harness frontmatter field.

Keep existing useful names: `issue-spec`, `pre-push`, `pr-lifecycle`, `ci-triage`, `parallel-worktrees`, `docs-drift-guard`. Add `investigate`, `benchmark`, `handoff`, `release`, `review-change` or `verify-change` only when their procedures recur. Avoid generic near-duplicates and accidental replacement of native `verify`/`review` behavior. Do not install the whole catalog in every repository.

## User and governance ownership

Personal reporting style, preference for options, generic autonomy, reasoning effort, model choices and local machine workarounds SHOULD be user-scoped. Examples include `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`, subject to their actual runtime availability.

Publishing authority, credential changes, spending, public reachability, signing and product-specific gate boundaries MUST retain their declared repository/organization ownership. A statement such as 'state the call, do not ask' must not obscure those boundaries.

## Human decision requests

When a concrete human decision remains unresolved, adopted interactive prompts
and skills MUST use the exposed and permitted structured question capability:
`AskUserQuestion` in Claude Code, or the available Codex equivalent described by
harness-operations. A plain-text question, final-response list or Human decides
checkbox alone MUST NOT substitute for an available tool call. Include context,
options and tradeoffs, wait for an explicit answer before dependent work, and
reconcile the decision record. Continue independent authorized work; do not
re-ask settled decisions. Silence, elapsed time and recommended defaults are not
approval. If no permitted question tool exists, state the limitation and use the
established human handoff channel. Unattended product protocols, native
permission gates and dashboard approvals retain their existing authority and
recording requirements; a question-tool answer does not replace them.

The shared `human-decisions` rule is selected explicitly in consumer manifests;
native mappings belong in harness-operations.

## Cross-repository distribution

The proposed canonical engineering source is `onsager-ai/dev-skills`. Keep product operation in `onsager-skills`; keep Ostrom's shipped behavior and operator policies independent.

A consumer MUST select a full immutable source revision and the required subset of rules/skills. Sync SHOULD produce a small managed AGENTS block, vendored skills, harness discovery projections and provenance. Local contract sections remain repo-owned. Changed upstream main MUST NOT silently change a consumer's effective instructions.

Update through reviewed PRs. A deterministic `--check` operation MUST detect changes to generated content and provenance. No network fetch is required during ordinary agent work. Submodules are not the default; local generation/vendor copies are more reliable in offline and ephemeral environments.

The revised pilots implement checkout-local distribution using the [deterministic generator](../agent-config/README.md), immutable manifests, drift locks and generated Claude projections. Shared workflow introductions defer policy to repo contracts and map tool operations to each harness. The selected common bodies are harness-neutral; harness-operations owns conditional Claude/Codex capability references. Other optional legacy skills outside the selected subset retain their declared tool prerequisites.

## Context budget

Root guidance SHOULD normally fit roughly 1,000–2,000 tokens, with 4–8 KB as an initial review range. Warn when the applicable contract chain approaches 16 KiB to retain headroom below Codex's documented 32 KiB project-document cap. Claude recommends under 200 lines, but long lines and expanded imports must also be measured.

These are review thresholds, not arbitrary correctness caps. Keep unusually large contracts when justified, and document why. Procedures with branching/setup/stages or substantial examples belong in skills; historical incidents belong in references. Do not preload architecture manuals, findings ledgers or branding references for unrelated work. Use normal conditional references rather than eager imports for large documents.

## Verification and completion

Require the checks that exercise the affected behavior. Preserve special gates, fixture provenance, mutation/negative-test requirements and compatibility exceptions. Never report a blocked merge-preview check as a successful local substitute. Record commands, outcomes, prerequisites and remaining scope.

Prompts are guidance, not security enforcement. Prefer scripts, CI, conformance tests, generation checks and platform controls for enforceable requirements.

## Adoption gates

Before rollout, verify root/module discovery, CLAUDE import behavior, skill projection, skill-name collisions, delegation context, fresh Cloud checkouts, cache resumption and offline operation. Record harness version, settings, branch/SHA and context diagnostics. Self-reported marker output is supplementary, not proof of injection.

Blocking static checks should cover required files, valid symlinks, generated equality, immutable provenance, skill metadata, broken references, module routing and valid declared exceptions. Semantic contradiction and context-growth checks begin advisory. Reuse `dev-skills` validators and `docs-drift-check`; extend them for imports, symlinks and code-span paths.

## Authoritative references

- [Claude memory and AGENTS support](https://code.claude.com/docs/en/memory)
- [Claude skills](https://code.claude.com/docs/en/skills)
- [Claude subagent context](https://code.claude.com/docs/en/sub-agents)
- [Codex AGENTS discovery](https://developers.openai.com/codex/guides/agents-md)
- [Codex skills](https://developers.openai.com/codex/skills)
- [Codex native configuration](https://developers.openai.com/codex/config-basic)
- [Codex Cloud environments](https://developers.openai.com/codex/cloud/environments)

Behavior claims were researched in the October 2 audit. Exact target versions and Cloud behavior remain validation gates, not completed experiments.
