# Agent architecture decision register

These decisions require organizational interpretation rather than a file rename. On October 3, 2026, the requesting user approved D1's recommended authority model and preservation of D2's existing Claude-only scope. The PRs propose implementing that decision; unmerged changes and old global installations do not yet reflect it. Owning roles are proposed; no named person has been assigned.

| ID | Decision and evidence | Recommendation | Proposed owning role | What waits |
| --- | --- | --- | --- | --- |
| D1 | Shared `pr-lifecycle` forbids opening PRs without an explicit request; Duhem/Onsager Claude cloud defaults require it on `claude/` branches | Approved: task or declared repository policy supplies authority; the shared procedure grants none. Retain existing Claude cloud behavior | Workflow maintainer and repository policy owner | Companion dev-skills PR and refresh of older installed shared procedures |
| D2 | Duhem's repo-only session restriction explicitly says Claude sessions; `onsager-dogfood` describes broader cross-product authoring | Approved: preserve the Claude-only restriction exactly; do not expand it to other harnesses by inference. Broader skill trigger reconciliation remains later work | Duhem policy owner | Any scope expansion or neutralization of this restriction |
| D3 | `semon-archive` is not GitHub-archived despite its name | Declare whether it is frozen, transitional or independently maintained; migrate only if development continues | Semon repository owner | Migration of that repository |
| D4 | Proposed conventions source extends existing `dev-skills` | Adopt `dev-skills` for v1; separate agent-config only if governance ownership diverges | Organization engineering conventions owner | Central generation rollout |
| D5 | Duhem/Tolmap primary-checkout rules are explicit and stricter than generic session isolation | Preserve them. Consider an explicit task-isolated Cloud exception only after validation | Each repository owner | Relaxing worktree requirements in Cloud |

## Required experiment decisions

- Retain CLAUDE import bridges unless tested target fleets justify removing them.
- Use generated regular skill projections as the portable default; internal links remain a validated optional profile.
- Avoid adopting native-name skills such as `verify` without examining personal/bundled collisions and automatic commit behavior.

## Approved resolution wording for D1

'Opening, updating or merging a pull request requires authority supplied by the task or the repository's declared workflow policy. This procedure does not grant authority itself. Once authorized, perform the spec/trivial decision, relevant checks and accurate reporting before creating or updating the PR.'

This wording is implemented in the companion `pr-lifecycle` change and Duhem's proposed shared contract. Existing contradictory global installations remain migration debt until the reviewed change is merged and consumers update. The Claude adapter preserves the original session scope, editing mechanics and cloud defaults.

## Source links

- [Shared PR policy](https://github.com/onsager-ai/dev-skills/blob/14c732fd83f6f9a5033831b6923d2fe8a9093663/skills/pr-lifecycle/SKILL.md)
- [Duhem session policy](https://github.com/onsager-ai/duhem/blob/196d52f7f8d4ca403cfa79ef36f4bb715e0610d8/CLAUDE.md)
