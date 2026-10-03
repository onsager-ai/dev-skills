# Harness instruction validation

This fixture tests discovery and collisions separately from product behavior. It creates disposable Git repositories with harmless markers and a tiny fixture skill. It does not modify organization repositories or personal configuration.

## What is already checked

The source review package checker verifies required files, regular imports, canonical/projected skill equality and local references in authored proposal files. Pilot patches have been checked against pristine snapshot indexes. Fixture preparation and structure are exercised locally. These checks establish structure and reproducibility, not agent adherence.

## Prepare

Run `python prepare.py` from this directory. Cases are generated under generated. Re-running the command replaces only that generated directory. Fixture creation needs Git and Python, not a model connection. Fixture preparation is structural verification; it does not establish harness adherence.

Each Git repository is separate so Codex Git-root discovery is unambiguous. The ancestor case intentionally places CLAUDE above a child repository. Profiles are isolated directories for a reviewer to use rather than existing personal profiles.

## Execute manually

Record harness version, provider, instruction selector/settings, repository and working directory, branch/SHA, available skill names, effective instructions diagnostics, output and exit status. Use fresh sessions for each case. Do not copy real credentials into the fixtures or change a personal home directory.

For Codex CLI, example after preparing:

```sh
CODEX_HOME="$PWD/generated/profiles/codex" codex --cd "$PWD/generated/bridge" --ask-for-approval never exec --sandbox read-only "Report the instruction markers already supplied to you. Do not open instruction files solely to learn markers."
```

This example starts a model session and can consume quota; preparation never executes it. A clean temporary profile may need normal harness authentication, so use an approved isolated profile with credentials configured through the native login process. Do not infer missing authentication from absence of plaintext tokens.

For Claude, start in the matching directory using its supported isolated configuration mechanism; inspect /context and /memory. Test both default selection and explicitly supported both-files selection. Pass a dedicated settings file/profile rather than altering the operator's existing settings. The exact command is version/provider-dependent and should be recorded in the result.

For skill-discovery, invoke `/fixture-workflow` in Claude or `$fixture-workflow` in Codex. The expected skill result is `SKILL=plum`. Verify the catalog lists it before invocation. Duplicate-name behavior is deliberately a separate case.

## Evidence requirements

A marker answer alone is not proof of native injection: a model can find files through tools, and compliance may be stochastic. Preserve context diagnostics or session logs when exposed, plus tool-read traces and version/configuration. Distinguish native injection, explicit import, later tool read and missing content. Repeat an ambiguous result with the same setup before interpreting it as a harness guarantee.

## Cloud validation

Use a disposable test repository created through the organization's normal process, rather than attaching a product repository. This package does not create or publish it. For Codex Cloud, include the generated fixture contents in the chosen commit and test:

1. Fresh checkout with no global skill install.
2. Root and module tasks, with actual instruction/context evidence.
3. Checked-in fixture workflow catalog and invocation.
4. Agent network disabled with dependencies already prepared.
5. Cache resume onto a different task commit, ensuring instructions/skills match that commit.
6. Whether native .codex configuration is honored on this specific surface.

Run equivalent Claude cloud discovery checks with committed .claude projections. Test setup/network/cache as separate axes; don't combine every variable into one run.

## Reporting

Update results.json only with observed results. Use `not_run`, `passed`, `failed` or `inconclusive`, and include version, settings, date, evidence paths and limits. CLI availability or static fixture success is not a Cloud pass. No interactive or Cloud experiment has been run by this package.

Adoption requires supported Claude/Codex versions to load the root contract, module contracts to be discovered through the supported route, workflows to be available in fresh Cloud checkouts and policy conflicts D1/D2 to be resolved. Removing the Claude import bridge is a separate optional decision.
