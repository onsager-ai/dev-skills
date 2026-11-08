---
name: ui-design
description: Reconcile product requirements with UI baselines, review actual visual differences and implement changes in an existing frontend. Use for baseline selection/correction, visual acceptance and Storybook-based review; preserve design ownership, native forms and regression gates.
---

# UI design workflow

## Scope

This procedure coordinates visual review; repository contracts own the visual
system, implementation stack and acceptance checks. It does not authorize
production UI changes or a new aesthetic beyond the user's established scope.

## Prerequisites

Resolve the checkout/ref, read AGENTS.md and the repository's design instructions.
Inspect existing components, token sources, generated assets and visual tests.
Use [harness-operations](../harness-operations/SKILL.md) when capability mapping is
needed.

## Procedure

1. Reconcile requirements and references using [baseline consistency](#baseline-consistency)
   before selecting a baseline, implementing a visible change or accepting a diff.
   Read the repository-local design brief, then extract exact source values and
   semantic roles, including theme variants and source SHA. Keep shared
   foundations and product layouts separate; do not introduce a reverse
   dependency between repositories.
2. The product repository's Storybook is the interactive design and review
   surface. Express a proposed screen, component or state as a story built from
   the real components and tokens, and review it there. Design-canvas files
   (.pen, Stitch exports, generated mockup PNGs) must not be committed.
3. Implement in authored frontend sources using existing components/controllers.
   Preserve server forms, accessibility, security, focus, touch and lifecycle
   ownership. Regenerate bundles with their owning build tool, never hand-edit
   them. Run the repository's applicable design and behavioral checks, and its
   pixel checks where it has them; review differences before an intentional
   baseline update. A repository without pixel comparison relies on reviewed
   screenshots; do not add one unless its contract asks for it.

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

Inspect representative actual images for every distinct change family, including
relevant interactions: reference/candidate images and diffs where the repository
compares pixels, otherwise its captured review screenshots. Logs, hashes, decreasing
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

Report source/ref, the stories or artifacts reviewed, the requirement mapping,
reviewed image families, classified differences, any justified baseline changes and
final check results/limits in the existing handoff.
