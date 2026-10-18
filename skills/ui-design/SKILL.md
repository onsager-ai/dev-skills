---
name: ui-design
description: Reconcile product requirements with UI baselines, implement changes in actual frontend sources, and review deterministic Storybook and Playwright evidence. Use for visual changes and baseline candidates; optional pen.dev/Figma exploration remains conditional.
---

# UI design workflow

## Scope

This procedure defaults to a source-first workflow: use product requirements,
contracts and existing source tokens to change real components and CSS, then
capture deterministic UI states and review the images before proposing a
baseline change. Product repositories own their visual system, implementation
stack, fixtures and acceptance gates. Storybook and Playwright use the product's
existing setup; this workflow does not authorize a framework migration, new
token package, credential migration or paid service. Optional pen.dev/Figma
exploration remains conditional; pen.dev setup details are in the existing
[integration reference](references/integrations.md). The ordinary design, build,
capture and check path requires no pen.dev account, `PEN_CLI_KEY`, desktop
socket, personal global skill or paid design service.

## Prerequisites

Resolve the checkout/ref, read AGENTS.md and the repository's design instructions.
Inspect existing components, token sources, generated assets, Storybook or
served test states, browser capture tools and visual tests. Find commands and
renderer settings in the repository's own scripts and lockfiles; do not assume
a universal stack.
Use [harness-operations](../harness-operations/SKILL.md) when capability mapping is
needed. The optional user-level tooling is described in
[integration setup](references/integrations.md); loading this workflow itself
requires no personal installation.

## Procedure

1. Reconcile requirements and references using [baseline consistency](#baseline-consistency)
   before implementing a visible change or accepting a diff. Read the
   repository-local design brief and contracts. Extract exact source values and
   semantic roles, including theme variants and source SHA. A generated DESIGN.md
   or .pen library is a derived design artifact, never a replacement token
   authority. Keep shared foundations and product layouts separate; do not
   introduce a reverse dependency between repositories.
2. Map the affected requirement, state and interaction to their owning source,
   deterministic story or served-product test, viewport/theme, expected result
   and reference status. Use the concise format in
   [Storybook visual testing](references/storybook-visual-testing.md); scale it
   to the change and keep product contracts and tokens in their existing owners.
3. Implement in the actual authored components and CSS, using existing
   components, tokens and controllers. Stories must import production UI and may
   provide sanitized fixtures or presentation adapters; they must not fork
   production markup, tokens, controllers or product behavior. Preserve server
   forms, accessibility, security, focus, touch and lifecycle ownership.
4. Build the smallest deterministic Storybook state that exercises the mapped
   contract, in a clean worker using the product's locked dependencies, renderer
   and build scripts. When a repository has no Storybook, use its existing
   served-product test-state mechanism. Keep fixtures, story tooling and
   visual-test adapters out of the production bundle. Stabilize fonts, clocks,
   animation and fixture lifecycle as described in the reference.
5. Use the product's pinned Playwright setup to exercise the relevant
   interaction and capture every required state at its mapped viewport and
   theme. A story fixture establishes a reproducible presentation state; it
   does not prove API, authorization, runtime, reconnect or other end-to-end
   behavior. Cover those claims with the product's real integration and
   behavioral gates.
6. Inspect actual reference, candidate and diff images for every distinct change
   family, including relevant interactions, using the inspection and
   classification rules below. If images cannot be inspected, report the
   visual-review limit without claiming visual acceptance; continue independent
   checks and reviewable preparation.
7. Refine the actual source, not only a fixture or capture input. Regenerate
   bundles with their owning build tool. Run the repository's existing affected
   design, behavioral, accessibility and visual gates; product repositories own
   their commands and coverage.
8. Present any proposed baseline change as a Git-reviewed candidate with the
   before/reference, actual candidate and diff images, its reason and capture
   provenance. Preserve original evidence, thresholds and state coverage. CI
   compares and uploads results; it must not rewrite, approve or auto-commit
   baselines. Missing baselines, unexpected dimension changes, drift and omitted
   required captures fail the visual gate. Follow the product's existing human
   review process before committing an intentional baseline change.

## Baseline consistency

Record a short mapping in the existing issue or PR: decision/source, affected
screen or state, expected visible behavior, and reference disposition (preserve,
update or unresolved). Scale it to the change; a small change may need one row.
Use current task scope and settled product decisions to determine where an older
reference remains applicable. Approval of a historical screen does not require
retaining capabilities or invitations superseded by later requirements.
Resolve clear consequences within the authorized scope; ask only about genuine
conflicts or new design choices, with representative images and concrete options.
Keep unrelated work moving while an affected decision remains unresolved.

Check capability changes against navigation, onboarding, empty states, help and
direct-call boundaries. Verify behavior separately from pixel stability. Add
user-facing explanations only when they help users act or decide; an internal
architecture constraint alone is not a copy requirement.

Inspect representative actual reference/candidate images and diffs for every
distinct change family, including relevant interactions. Logs, hashes, decreasing
diff counts and another agent's conclusion do not replace viewing the images.
Classify each family as an implementation defect, stale reference, incorrect
test/fixture state, or unresolved product decision, and record its reason/action.
Check the relevant interaction, implementation and fixture before attributing a
different value to a test error or treating a retained disclosure as active
capability delivery. Screenshots alone do not establish those behavioral claims.
Group repeated sizes/themes by cause while retaining every required state.
If images cannot be inspected, report the visual-review limit without claiming
visual acceptance; continue independent checks and reviewable preparation.

Validate representative affected states early, then run the repository's required
final coverage on the delivered tree. Correct only references justified by the
settled requirement through the repository's supported procedure; retain original
evidence, thresholds and state coverage. Never substitute bulk golden replacement,
masks or changed capture inputs for explaining a mismatch. Record intentional
changes in the durable baseline/contract; artifact-specific acceptance records
cannot supply missing product intent or reopen an already settled decision.

## Completion

Report source/ref, the requirement-to-state mapping, artifact paths, reviewed
image families, classified differences, baseline provenance, justified baseline
changes and final product-gate results/limits in the existing handoff. Separate
deterministic story evidence, real-product behavioral coverage and visual
acceptance. If the consumer workflow was not run, say so; shared documentation
or passing CI does not establish consumer adoption or visual acceptance. When an
optional pen.dev/Figma integration was used, report its actual discovery,
authentication and desktop/cloud limits separately. Never infer a tool call from
static configuration.
