---
name: harness-operations
description: Map a workflow operation to the tools and instruction-discovery mechanisms actually available in Claude Code or Codex. Use when a common or repository skill needs file, GitHub, check/log or subscription capabilities, or when discovery/authentication is uncertain.
---

# Harness operations

## Scope

This skill owns capability selection and native mechanics, not repository policy.
It never supplies publication, merge, credential, spending or cross-repo authority.
AGENTS.md and the task remain the contract; native adapter prose translates tools.

## Prerequisites

Determine the actual harness from session/runtime diagnostics, not a branch prefix
or presence of a file. Inspect the available tool catalog and observed configured
authentication. A checked-in skill does not provision a connector, CLI or token.

## Procedure

1. Identify the needed operation and whether it is read-only or an authorized
   mutation. Prefer an already available configured capability; do not add personal
   setup as a default prerequisite.
2. Load only the matching native reference:
   [Claude Code](references/claude-code.md) or [Codex](references/codex.md).
   If the harness is different or uncertain, use observed tools and report the
   missing mapping instead of pretending one profile applies.
3. For GitHub, resolve the exact repository/ref and use connected GitHub tools
   when available. An authenticated supported CLI is an alternative when exposed.
   Match operations and parameter schemas from the actual catalog; a tool name
   in an example is not evidence it exists in this session.
4. Check capabilities separately: issue/PR reads, file/tree publication, run/check
   metadata, log bodies, commit statuses and subscriptions may have different
   availability. Avoid a blanket claim that a connector cannot read logs. Retain
   the actual error and use an equivalent exposed capability where available.
5. Preserve configured identity, proxy and trust. Never print credentials, inspect
   secret files for values, dump the environment, or replace credentials because
   a token is not visible. Diagnose 401/403 using current runtime observations.
6. If no equivalent exists, finish independent work and report the exact blocked
   operation. Do not turn missing subscriptions into invented background monitoring
   or missing publication into a claim that an issue/PR was created.

## Completion

State the capability used, observed result and limitation that affects completion.
For discovery tests record harness/version/settings, checkout SHA, catalog/context
and tool-read evidence. Marker answers alone are supplementary evidence.
