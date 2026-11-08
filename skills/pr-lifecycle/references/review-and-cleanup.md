# Review And Cleanup

## Reviewable descriptions

Lead with the concrete problem and resulting behavior. Use a before/after example
when it explains the change. Describe the final diff for a reviewer who has not
seen the conversation; rewrite stale titles and bodies instead of appending a
work diary. Keep a small change to a short paragraph plus validation. Aim for
100–250 words for most bodies, expanding only for material review complexity.
Link detailed protocols, benchmark tables and historical command logs. Include
only evidence that helps assess the change or its readiness.

For a larger change, use this order:

- **Problem and outcome:** state the trigger, previous behavior and new behavior.
- **Changes:** explain the decisions that affect behavior or review. Keep distinct
  concerns in separate PRs when they can be reviewed and validated independently.
- **Review:** name the first two or three authored files or groups to read. Identify
  generated bundles, screenshots and evidence separately from authored logic.
- **Validation and remaining scope:** give actual commands/results, their exact
  revision, linked evidence and unrun gates. State stack and cross-repository
  dependencies, including an exact source pin when adoption requires one.

Use short active sentences and consistent terms. Expand an unfamiliar acronym
once. Keep identifiers exact. Separate numbers from words and state their units.
Avoid vague claims such as "improve robustness" without the observable behavior.
Plain technical English does not require a restricted dictionary or an STE
compliance claim.

For a visible UI change, show a small set of actual before/after screenshots from
the base and head under the same viewport, theme, route and fixture. Label each
comparison and link the larger evidence set. State when a baseline is unavailable;
never synthesize an image as validation. Follow the repository's UI workflow to
identify the governing product decisions, expected visible changes, actual image
families inspected, and why each reference change is justified. Group repeated
states by cause and separate implementation, reference and fixture defects from
unresolved product choices. Existing explicit decisions do not need fresh approval
merely because an older baseline contradicts them. Preserve repository-specific
acceptance gates and report any visual inspection limit.
Use a compact diagram only when branches,
ownership or state transitions are clearer than prose. Omit empty template sections
and visuals that do not help review.

## Backlog cleanup

When cleanup is authorized, compare each PR with the current intended base. Check
ancestry, file identity and remaining behavior; a large merge-base diff or an old
date does not establish remaining scope. Preserve unique code, tests and historical
evidence in an identified replacement before closing an old integration PR.

Close incorporated or superseded PRs with the checked head/base and a link to the
landed implementation or replacement. Distinguish an open replacement from landed
work. Retain branches used as stack bases until their dependents are reconciled.
Do not merge an obsolete source pin merely to clear a queue. Keep a draft when
residual scope or required adoption evidence is unresolved.

