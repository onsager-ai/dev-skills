---
name: ci-triage
description: Investigate a failed GitHub Actions run or PR check, distinguish regression, flake, infrastructure and insufficient evidence, and reproduce with repository-owned gates and fixtures. Use for failed runs, red main or red PR checks.
---

# CI triage

## Scope

This skill owns evidence-based classification. The repo contract/overlay owns
reproduction commands, expected failures, issue conventions and warning severity.
Triage does not authorize code publication, reverts, issue/comments or mentions.
Load [pr-lifecycle](../pr-lifecycle/SKILL.md) when repair changes an authorized PR.

## Prerequisites

Identify the run, workflow, exact tested SHA and event. For PRs distinguish the
head from the tested merge preview. Use
[harness-operations](../harness-operations/SKILL.md) when retrieving checks/logs
requires a capability mapping. Authentication and log availability must be
observed; do not assume all connectors expose the same fields or limitations.

## Procedure

1. Read run/job status, first failed step and bounded logs through the available
   GitHub tools. Redact credentials and personal data. If logs are unavailable,
   retain the status/configuration evidence and report the access limit.
2. Compare the tested diff with the previous comparable run, including workflow,
   inputs, dependencies and environment. An earlier green commit alone does not
   establish a flake or prove causation. Identify a suspect change with evidence;
   do not blame an author from the merge-message shape alone.
3. Reproduce in an authorized isolated checkout at the exact tested ref or merge
   result using its own gate commands and fixtures. Do not switch a parked primary
   checkout to the suspect branch. Browser failures use the repo's browser workflow;
   another product's routes or fixtures are not interchangeable.
4. Classify with the following taxonomy. Missing logs, credentials, tooling or a
   reproducible environment limit confidence; report them rather than guessing.
5. Follow the repo's issue convention only when authorized. If it uses a rolling
   main-red issue, search for an existing open tracker before creating one. Append
   concise evidence instead of opening duplicates. Do not notify people merely
   because a template contains a mention. Close a tracker only with authority and
   a cited green run for the affected workflow.
6. For a repair, hand off to the repo workflow and pre-push/PR lifecycle. For a retry,
   retain the failed run and compare the same tested inputs. A green retry alone
   does not justify weakening a required assertion.

## Classification

| Bucket | Evidence | Next action |
| --- | --- | --- |
| regression | Deterministic failure tied to the tested change or its merged interaction | Reproduce and repair the demonstrated defect |
| flake | Same comparable inputs alternate outcomes, with evidence of a nondeterministic cause | Record/retry and address the cause |
| infra | Runner, service, network or dependency provisioning failed independently of product assertions | Repair/retry the environment |
| needs-human | Evidence or authority is insufficient for a reliable diagnosis | State the missing observation or decision |

## Completion

Report workflow/run URL, tested SHA, first failing step, bucket, confidence,
reproduction result, bounded evidence and next action. A blocked reproduction is
not a successful local check. Keep check status tied to the exact SHA.
