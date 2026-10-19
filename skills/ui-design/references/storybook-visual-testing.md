# Storybook visual testing

Use this reference with the [UI design workflow](../SKILL.md) to turn product requirements into repeatable visual evidence. Product repositories own their components, contracts, tokens, renderer, fixtures, commands and acceptance gates. Use their existing stack; this guidance does not require a framework or token-package migration.

## Map contracts to rendered states

Keep a small, product-owned mapping in the existing issue, PR or test plan. Add one row for each distinct requirement/state/interaction combination, grouping repeated sizes or themes only when their cause and coverage remain clear.

| Field | Record |
| --- | --- |
| State and interaction | The requirement or contract, starting state, and action or transition under review. |
| Source owner | The production component, route or CSS owner that renders and handles that state. |
| Story or served test | The Storybook story, or the repository's existing served-product test state. |
| Viewport and theme | Exact viewport dimensions, device scale where relevant, and theme/color scheme. |
| Expected result | The visible outcome and any interaction result the product contract requires. |
| Reference status | Preserve, update or unresolved, with the governing source and reason. |

Example:

| State and interaction | Source owner | Story or served test | Viewport and theme | Expected result | Reference status |
| --- | --- | --- | --- | --- | --- |
| Empty list; select “Create” | `ProjectList` and `ProjectList.css` | `ProjectList/Empty` | 1280×800, light | Empty message remains visible; create form opens | Preserve empty state; form reference pending product decision |

The example illustrates the fields only. Use the repository's actual names, contracts and reference dispositions. A story makes a presentation state reproducible; it does not establish API, authorization, runtime, reconnect or other end-to-end behavior.

## Complete a legacy-baseline migration

When a task migrates an existing acceptance-baseline system, first inventory every baseline and acceptance state in that system, including states no longer linked from the current UI, every existing visual mask, and every native or served-product acceptance gate. Record each baseline's original identifier or artifact path, owning product contract or decision, current status, Storybook story and required capture variants, and disposition. Record each mask and gate's identifier, owner, current status and disposition, including its successor if replaced. The baseline/state inventory is complete only when each such entry is either:

- active and covered by a deterministic story plus the product's required
  Playwright interaction/captures; or
- obsolete, superseded or intentionally inactive, with the authoritative
  requirement or decision that retires it and the reason it no longer needs an
  acceptance baseline.

Every mask and native or served-product gate must remain under its recorded owner unless an authorized product decision changes ownership; record whether each remains active, is replaced or is retired, and its successor when replaced.

Mark genuine conflicts unresolved and name the owner who can settle them. Do not count a representative pilot, a subset of screens, or an empty Storybook setup as completion of a full migration. Keep the inventory in the product-owned issue, PR or durable test plan so later changes can update it. A design-tool file or image may remain historical evidence or an optional exploration source; it is not the active acceptance authority after a state has been migrated. The product contract and its recorded decision govern whether that state remains active.

## Discover the product renderer and build

Before adding or changing visual tooling, inspect the repository-owned design instructions, scripts, Storybook configuration, Playwright configuration, lockfile and existing visual fixtures. Follow the declared package manager, renderer and browser version. Reuse the product's existing server/test state mechanism if it does not use Storybook. Do not impose a universal component framework, tokens package, capture service or manifest format.

Build and capture from a clean worker using the repository's locked dependencies and documented commands. Avoid personal global packages, network-fetched unversioned assets and hidden local state. Fix the capture environment's viewport, theme, locale, timezone and clock where they affect output. Load the product's local fonts and wait for fonts and layout to settle before capture; do not rely on host-specific font fallback. Settle animations or use a product-owned reduced-motion/test setting, then wait for the rendered state to be stable. Record the browser and renderer versions with the capture provenance.

Stories should import production components, CSS, tokens and controllers. Use small sanitized fixtures or presentation adapters only to establish the state under test. Reset data, timers, storage and network stubs between captures using the product's existing test hooks. Close pages and contexts and dispose of fixtures after use. Do not let one story's state leak into another capture.

Keep Storybook entries, test adapters and fixture data out of production entry points and chunks. Verify isolation with the product's existing build configuration or production-output checks. Do not export a story or design-tool artifact over authored production files.

## Capture, inspect and propose baselines

Use the product's pinned Playwright setup to exercise mapped interactions and capture every required state. Keep route, fixture, viewport, theme and other capture inputs identical when comparing a reference and candidate. Review the actual reference, candidate and diff images for each distinct change family. Hashes, summaries and pixel-diff counts help locate changes but do not replace image inspection.

Record provenance with each candidate using the repository's existing artifact format: source commit, capture command, lockfile and browser/renderer versions, story or served-test identifier, fixture version, viewport/theme and reference revision. Preserve original captures and thresholds. Commit candidate images and their reason as clearly unapproved review artifacts in the PR, separate from the approved reference; the candidate commit does not approve or promote it.

The visual CI gate compares and uploads evidence. It must fail for a missing baseline, an unexpected dimension change, drift beyond the product's declared threshold, or an omitted required capture. Preserve existing mask behavior, native and served-product acceptance gates, thresholds and ratchets unless an authorized product decision changes them; record the owner and disposition of each gate, and do not silently reset or replace a gate when adding Storybook coverage. It must not rewrite, approve or commit goldens. Require human review before accepting or promoting a candidate as an approved reference through the product's existing process. A story or isolated visual pass does not replace real-product behavioral and integration gates.

For a full migration, the reviewed Git change must make the complete inventory auditable alongside the Storybook stories, capture configuration and any explicitly approved reference updates. A candidate image remains unapproved until a human review records acceptance through the product's existing process.
