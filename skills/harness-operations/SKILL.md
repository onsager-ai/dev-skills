---
name: harness-operations
description: Map a workflow operation to the tools and instruction-discovery mechanisms actually available in Claude Code, Codex or ChatGPT Work. Use when a common or repository skill needs structured human questions, file, GitHub, check/log or subscription capabilities, or when discovery/authentication is uncertain.
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
   Carry forward authorization for the same action and scope. Resolve routine
   implementation choices independently; request a human decision only when its
   answer is required to proceed or materially changes the intended outcome.
2. Load only the matching native reference:
   [Claude Code](references/claude-code.md), [Codex](references/codex.md) or
   [ChatGPT Work](references/chatgpt-work.md).
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
5. For a pending human decision, use the exposed, permitted structured question
   tool from the matching native reference. Include the concrete choice, context
   and tradeoffs; wait for an explicit answer before dependent work and reconcile
   the decision record. Continue independent authorized work. A plain-text question
   or checklist is not a substitute for an available question tool. Do not re-ask
   settled decisions or treat silence/default selections as approval. If the
   question capability is unavailable, state the limitation and use the established
   human handoff channel; native permission and product approval gates still apply.
6. Preserve configured identity, proxy and trust. Never print credentials, inspect
   secret files for values, dump the environment, or replace credentials because
   a token is not visible. Diagnose 401/403 using current runtime observations.
   Try an equivalent configured tool before requesting installation, login or
   broader permissions. Report the failing operation and actual error rather than
   making setup for one tool a prerequisite for all work.
7. If no equivalent exists, finish independent work and report the exact blocked
   operation. Do not turn missing subscriptions into invented background monitoring
   or missing publication into a claim that an issue/PR was created.

## Completion

State the capability used, observed result and limitation that affects completion.
For discovery tests record harness/version/settings, checkout SHA, catalog/context
and tool-read evidence. Marker answers alone are supplementary evidence.
