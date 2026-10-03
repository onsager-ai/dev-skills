# Agent architecture pilot adoption

Prepared October 3, 2026 from the attached `agent-architecture-review.zip`.
The standard remains a draft. Pilot PRs remain draft until their product and
supported-harness adoption gates have evidence.

| Repository | Reviewed current main | Proposed slice |
| --- | --- | --- |
| Semon | `24e1932ef78238fdb13b5c1d11b61636695baf34` | New contract/import and two workflows; updated for current typed UI and generated bundles |
| Tolmap | `405ff271d996e56b4ba3cd549d38b723db62b423` | Shared contract/import and three workflows; algorithm/UI invariants and fixture provenance preserved |
| Duhem | `196d52f7f8d4ca403cfa79ef36f4bb715e0610d8` | Regular contract, Claude adapter, conditional detail reference and canonical skill ownership |
| dev-skills | `14c732fd83f6f9a5033831b6923d2fe8a9093663` | Standard draft, approved D1 authority correction, decisions and reusable validation fixtures |

Tracking: [shared adoption spec #16](https://github.com/onsager-ai/dev-skills/issues/16)
and [Duhem spec #569](https://github.com/onsager-ai/duhem/issues/569).

## Policy and dependencies

The requesting user approved D1's task/repository-supplied PR authority and D2's
unchanged Claude-only scope. The shared procedure correction and Duhem contract
implement that resolution together. Selected shared workflows are now vendored locally; personal global copies are no longer required.
Opening/updating authority does not itself authorize merging. Duhem's existing
Claude cloud defaults, session restriction and tool mechanics are retained.

D3 (`semon-archive` maintenance status) remains pending. The revised pilots use
the existing dev-skills repository as their synchronization source; broader D4
governance ownership remains an organization decision. D5's stricter checkout
parking rules remain intact. No global installation or environment configuration
is changed.

## Checkout-local distribution

The revised pilots check in selected shared workflows, complete referenced assets,
an immutable source manifest, a drift lock, generated common AGENTS rules and
regular Claude projections. The [generator](../agent-config/README.md) owns those
artifacts. Repository-specific skills remain canonical locally. Generic SDD
mechanics were removed from Duhem's overlay; product-specific schema/DX, worked
example, scope and merge gates remain local.

Each consumer gets a pinned-upstream CI check and a weekly draft-update workflow.
It uses the built-in Actions token; GitHub must permit Actions-created PRs. No
custom token, developer profile, global installer or session-time fetch is needed.
Merge dev-skills before adopting the consumer pins. Physical copies are generated
and checked, so changes have one authored source.

## Observed validation

- All 42 source-package checksums matched; its source-aware checker passed against
  pinned source snapshots, and six isolated fixture Git roots were prepared.
- Semon and Tolmap packaged patches passed `git apply --check` against current
  main. Duhem's packaged patch omits deletion of the tracked `.agents/skills`
  symlink, so `git apply` rejects the new children. The proposed tree was
  materialized in an isolated worktree, explicitly replacing that symlink.
- Final pilots have regular root contracts, native Claude imports, valid skill
  identity/trigger metadata, equal regular skill projections and valid authored
  repository references. Duhem's initial local skill copies matched the source. The revised local overlay
  removes shared-method duplication; Claude session restriction, editing
  workaround and cloud-default section still match the source exactly.
- `npm run check` passed in dev-skills: 18 skill frontmatters and 48 relative
  links across 48 skill Markdown files. New documentation links were checked
  separately. `git diff --cached --check` passed for each proposal.

## Remaining adoption gates

Rust/Cargo and `just` are absent in this environment. Product gates were not run;
Duhem's committed merge-preview `just preflight` remains blocked, and no quick
check is claimed as a substitute. Semon/Tolmap owning CI remains the product gate.

Codex CLI `0.159.0-alpha.3` is available; Claude CLI is absent. No interactive
harness or Cloud experiment has run. The organization's supported fleet and
disposable Cloud fixture repository are not configured in this session. Follow
the [validation procedure](agent-architecture-validation/README.md) and record
version, settings, selected commit, context diagnostics and tool-read evidence in
[results.json](agent-architecture-validation/results.json). CLI availability,
static structure and marker answers do not establish Cloud adherence.

Required evidence includes root/module discovery, native import behavior, skill
catalog/invocation and collisions, fresh offline Cloud checkout behavior and cache
resumption onto another task commit. Keep drafts until these gates are met.
