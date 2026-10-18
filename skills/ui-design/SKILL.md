---
name: ui-design
description: Reconcile product requirements with UI baselines, review actual visual differences and implement changes in an existing frontend. Use for baseline selection/correction, visual acceptance and source-grounded pen.dev work; preserve design ownership, native forms and regression gates.
---

# UI design workflow

## Scope

This procedure coordinates visual review and optional pen.dev tooling; repository contracts own the visual
system, implementation stack and acceptance checks. Tool installation does not
authorize production UI changes, a new aesthetic, credential migration or paid
generation. Use the user's established scope without repeated setup per repo.

## Prerequisites

Resolve the checkout/ref, read AGENTS.md and the repository's design instructions.
Inspect existing components, token sources, generated assets and visual tests.
Use [harness-operations](../harness-operations/SKILL.md) when capability mapping is
needed. The optional user-level tooling is described in
[integration setup](references/integrations.md); loading this workflow itself
requires no personal installation.

## Procedure

1. Reconcile requirements and references using [baseline consistency](#baseline-consistency)
   before selecting a baseline, implementing a visible change or accepting a diff.
   Read the repository-local design brief before selecting a tool. Extract exact
   source values and semantic roles, including theme variants and source SHA.
   A generated DESIGN.md or .pen library is a derived design artifact, never a
   replacement token authority. Keep shared foundations and product layouts
   separate; do not introduce a reverse dependency between repositories.
2. Inspect the live tool catalog and authentication independently for each
   harness. pen.dev desktop MCP requires a same-host
   app/socket. In cloud environments use the supported headless CLI when no app
   is available. Do not invent a remote pen.dev MCP endpoint or report a configured
   server as operational. CLI agent-provider authentication is separate from
   pen.dev authentication and from the calling harness's authentication.
3. Credentials stay in inherited secure variables or the private user credential
   store. Never extract a key from an MCP config, print it, include it in a prompt,
   pass it on a command line or commit it. Some upstream upload examples pass an
   API key as an argument: use supported secure authentication instead.
   Account access does not authorize uploading private source/data;
   prepare the concrete assets under the user's task scope. Synthetic fixtures
   are preferable to real transcripts and authenticated personal pages.
4. For pen.dev desktop MCP, load read_skill and verify get_app_state against the
   intended document before editing. For headless work use the user launcher
   `~/.local/bin/ui-design pen interactive --out <explicit-artifact-path>`.
   Read the current schema/execute instructions, work in an isolated .pen file,
   save deliberately and inspect an exported screenshot. Use independent output
   paths for concurrent harnesses; never let both edit one active document.
5. Refine a small approved screen or component first. Compare the result with
   source tokens, the approved design and the existing implementation. Implement
   in authored frontend sources using existing components/controllers. Preserve
   server forms, accessibility, security, focus, touch and lifecycle ownership.
   Regenerate bundles with their owning build tool, never vendor-export them over
   production files. Run the repository's applicable design, behavioral and pixel
   checks; review differences before an intentional baseline update.

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

Report source/ref, artifact paths, each harness's actual discovery/tool-call
evidence, authentication gaps and desktop/cloud limitations. Separate static
configuration, MCP transport, successful tool calls and visual acceptance.
Include the requirement mapping, reviewed image families, classified differences,
justified baseline changes and final check results/limits in the existing handoff.
Minimal setup smoke tests read pen.dev app state; they
do not require generation, production data uploads or baseline changes.
