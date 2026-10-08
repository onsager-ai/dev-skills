---
name: ui-design
description: Use Stitch and pen.dev for source-grounded design system extraction, UI exploration, visual refinement and implementation in an existing frontend. Preserve repository design ownership, native forms and visual regression gates; distinguish desktop MCP from headless CLI capabilities.
---

# UI design workflow

## Scope

This procedure coordinates design tools; repository contracts own the visual
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

1. Read the repository-local design brief before selecting a tool. Extract exact
   source values and semantic roles, including theme variants and source SHA.
   A generated DESIGN.md or .pen library is a derived design artifact, never a
   replacement token authority. Keep shared foundations and product layouts
   separate; do not introduce a reverse dependency between repositories.
2. Inspect the live tool catalog and authentication independently for each
   harness. Stitch is a remote service; pen.dev desktop MCP requires a same-host
   app/socket. In cloud environments use the supported headless CLI when no app
   is available. Do not invent a remote pen.dev MCP endpoint or report a configured
   server as operational. CLI agent-provider authentication is separate from
   pen.dev authentication and from the calling harness's authentication.
3. For Stitch, load the relevant Google Labs skills from the single user-level
   canonical installation: extract-design-md, design-md, enhance-prompt,
   manage-design-system, generate-design, extract-static-html, upload-to-stitch
   or code-to-design. Follow repository policy and available equivalent tools.
   Framework-specific example output does not authorize a stack migration.
   Do not install the same vendor skills as both plugins and loose skills.
4. Credentials stay in inherited secure variables or the private user credential
   store. Never extract a key from an MCP config, print it, include it in a prompt,
   pass it on a command line or commit it. Some upstream upload examples pass an
   API key as an argument: use authenticated MCP/SDK uploads with in-memory auth
   instead. Account access does not authorize uploading private source/data;
   prepare the concrete assets under the user's task scope. Synthetic fixtures
   are preferable to real transcripts and authenticated personal pages.
5. For pen.dev desktop MCP, load read_skill and verify get_app_state against the
   intended document before editing. For headless work use the user launcher
   `~/.local/bin/ui-design pen interactive --out <explicit-artifact-path>`.
   Read the current schema/execute instructions, work in an isolated .pen file,
   save deliberately and inspect an exported screenshot. Use independent output
   paths for concurrent harnesses; never let both edit one active document.
6. Refine a small approved screen or component first. Compare the result with
   source tokens, the approved design and the existing implementation. Implement
   in authored frontend sources using existing components/controllers. Preserve
   server forms, accessibility, security, focus, touch and lifecycle ownership.
   Regenerate bundles with their owning build tool, never vendor-export them over
   production files. Run the repository's applicable design, behavioral and pixel
   checks; review differences before an intentional baseline update.

## Completion

Report source/ref, artifact paths, each harness's actual discovery/tool-call
evidence, authentication gaps and desktop/cloud limitations. Separate static
configuration, MCP transport, successful tool calls and visual acceptance.
Minimal setup smoke tests list Stitch projects and read pen.dev app state; they
do not require generation, production data uploads or baseline changes.
