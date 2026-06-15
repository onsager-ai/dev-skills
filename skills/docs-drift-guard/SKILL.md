---
name: docs-drift-guard
description: >
  Keep prose docs (architecture overviews, READMEs, ADRs, runbooks) from
  rotting out of sync with the code they describe. Provides a methodology — the
  drift-resistance ladder (derived/executed > checked > reviewed > prose),
  altitude discipline, and one-home-per-fact — plus a concrete CI floor: the
  zero-dependency `@onsager/docs-drift-check` bin, which fails the gate if any
  repo-relative link/path a Markdown doc cites no longer resolves. Use when
  asked to "stop docs drifting", "add a docs drift guard", "keep docs in sync
  with code", "check doc links in CI", "the architecture doc is stale", "guard
  this doc", or when writing a doc that will need to stay true as code changes.
  Repo-agnostic; the consumer repo's CLAUDE.md overlays which docs to guard,
  how to wire the gate, and which higher rungs to add.
metadata:
  author: onsager-ai
  version: 0.1.0
---

# docs-drift-guard

Prose documentation drifts because nothing forces it to stay true: the code moves, the doc doesn't, and the rot is invisible until someone trusts a stale sentence. This skill is the methodology for making that drift either impossible (by construction) or loud (by a check), plus the ready-made floor check to drop into any repo's gate.

## The principle

> The more a doc is **derived from** or **executed against** code rather than hand-written *about* it, the less it can drift. Push every claim as far down this ladder as it will go; what's left as prose, keep at an altitude that rarely changes and guard the parts that can be checked.

| Rung | What it means | Drift outcome |
| --- | --- | --- |
| **Generated** | the doc is a build artifact of the code (API/CLI/type reference) | can't drift |
| **Executed** | the doc's examples/claims run in CI (doctests, runnable snippets) | drift = red test |
| **Checked** | links, snippets, and structural rules verified mechanically | structural drift caught |
| **Reviewed** | humans/bots prompted to re-read when cited source changes | drift surfaced, not blocked |
| **Prose** | sentences nobody re-checks | drifts freely |

A doc is usually a mix: generate what you can, execute the examples, *check* the links and the invariants, and leave only genuine synthesis as guarded prose.

## The floor: `@onsager/docs-drift-check` (the Checked rung, every repo)

The cheapest enforced rung: assert that every repo-relative link/path a doc cites still resolves. Deterministic, zero-dependency, no LLM, safe as a blocking gate — and it ignores links inside code fences so example snippets never trip it.

```sh
npm i -D @onsager/docs-drift-check
npx docs-drift-check 'docs/**/*.md' README.md      # exit 1 on any dead path
npx docs-drift-check --external 'docs/**/*.md'      # also HEAD-check http(s) links (opt-in)
```

Wire it into the repo's existing gate — whichever the repo already runs:

- **`node:test` repos** — a thin wrapper so it runs with the suite:
  ```js
  import { test } from "node:test";
  import { execFileSync } from "node:child_process";
  test("docs cite no dead paths", () =>
    execFileSync("docs-drift-check", ["docs/**/*.md", "README.md"], { stdio: "inherit" }));
  ```
- **any repo** — a `package.json` script or a CI step: `docs-drift-check 'docs/**/*.md' README.md`.

Source: <https://github.com/onsager-ai/docs-drift-check>. Single source of truth — install it, don't vendor a copy (a vendored copy is itself a thing that drifts).

## Higher rungs (add per language/claim)

The floor only catches *dead* links — a cited file that still exists but whose *contents* drifted stays green. Close that gap on the claims that matter:

- **Structural invariants → rule enforcement (Executed/Checked).** If the doc asserts a dependency direction or layering ("protocol must not import server"), enforce it as a test instead of describing it: **dependency-cruiser** or **ts-arch** (TS/JS), **import-linter** (Python), **ArchUnit** (Java). Bonus: dependency-cruiser can *generate* the dependency graph image, so the picture stops being hand-drawn.
- **Embedded code samples → transclusion (Checked).** Don't paste code into docs; transclude it from the real source and byte-compare in CI: **embedme**, **remark**, or region/snippet anchors. A pasted snippet is drift waiting to happen.
- **Runnable examples → doctests (Executed).** Rust doctests, Python `doctest`, Go example tests, `mdbook test` — the example fails CI when the API it shows changes.
- **Semantic "is the prose still true?" → path-triggered re-read (Reviewed).** A **CODEOWNERS** entry or a CI step that, when a cited source file changes in a PR, requires the doc owner to re-read the affected section. Catches contents-drift no existence check can. Keep any LLM-based version of this **advisory, never a blocking gate** — it's non-deterministic.

## Authoring discipline (so there's less to guard)

Two habits cut the drift surface before any check runs:

- **Altitude.** Document the *stable seams* — the dependency graph, the data/event model, the key invariants — not signatures, env-var tables, or line-level detail that churns every PR. High-altitude prose changes only when the architecture changes.
- **One home per fact.** Each fact lives in exactly one doc; the others link to it. A canonical split: **README** = runbook + env vars, **ADRs** = the *why* (immutable, amended in place — never rewritten), the **architecture doc** = the *what's-wired-to-what* snapshot. Duplication is what rots; eliminating it eliminates that whole class of drift.

## What's repo-agnostic vs. overlaid

| Repo-agnostic (this skill) | Overlaid by the consumer (CLAUDE.md / wiring) |
| --- | --- |
| the ladder + altitude + one-home discipline | *which* docs to guard |
| the `@onsager/docs-drift-check` floor + how to wire it | how the gate runs (node:test vs pytest vs a CI step) |
| pointers to per-language rule/doctest/transclusion tools | *which* higher rungs are worth adding here |

## Limits

The floor is a link/path-integrity check, not a semantics check: it catches a cited file being renamed, moved, or deleted — **not** a cited file whose contents changed so the surrounding prose is now wrong. That semantic drift is exactly what the *Reviewed* rung (CODEOWNERS path-triggered re-read) and the *rule-enforcement* rungs exist to cover. Use the floor as the always-on baseline and add the rung that matches each doc's most load-bearing claims.
