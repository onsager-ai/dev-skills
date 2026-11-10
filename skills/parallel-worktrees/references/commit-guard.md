# Repository hooks

Commit and checkout guardrails are selected by each consumer repository's
manifest and generated into its committed `.githooks` directory. This replaces
the retired machine-global `~/.githooks` guard, which conflicts with
repository-local `core.hooksPath` configuration.

See [checkout-local agent configuration](../../../agent-config/README.md) for
selection, enablement, linked-worktree behavior, local extensions, and limits.
Use the generated `.githooks/README.md` in a consumer checkout for the exact
selected behavior.
