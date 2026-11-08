# Commit preparation

Inspect `git status` and the staged diff before committing. Follow repository commit conventions when they differ from the examples below. Amend only an unpublished commit for a small omission or message correction; use a new commit for substantial changes or published history.

## Conventional Commits Format

```
<type>(<scope>): <subject>

<body>      ← optional; explain *why*, not *what*
<footer>    ← optional; breaking changes, refs
```

### Types

| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructure, no behavior change |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `chore` | Build, tooling, dependency updates |
| `perf` | Performance improvement |
| `ci` | CI/CD workflow changes |

### Rules

- Subject: ≤ 72 chars, imperative mood ("add" not "added"), no trailing period
- Body: wrap at 72 chars; explain motivation, not mechanics
- Breaking change: `BREAKING CHANGE:` footer, or `!` after type (`feat!:`)

## Atomic Commits

One commit = one logical change. A reviewer should understand it without other commits.

**Group together:** all files for a single feature or fix; tests with the code they cover.

**Keep separate:** refactors from behavior changes; unrelated fixes; half-done work.

Never commit "WIP" or "misc fixes" — squash or split before finalizing.

## Staging Checklist

Before `git add`, verify:
- [ ] No secrets, API keys, or credentials
- [ ] No debug code or temporary hacks (`console.log`, `TODO: remove`)
- [ ] Changes are related (one logical unit)
- [ ] `.gitignore` respected — no build artifacts or generated files unless intentional

## Examples

### Feature
```
feat(auth): add OAuth2 login flow

Replaces username/password form. Supports Google and GitHub as providers.
Token refresh is handled automatically by the auth middleware.
```

### Bug fix
```
fix(publish): handle missing platform binary gracefully

Previously threw unhandled error when the platform package was absent.
Now logs a clear message and exits with code 1.
```

### Breaking change
```
feat!: change publish config to support multiple binaries

BREAKING CHANGE: `binary` field renamed to `binaries` array.
Migrate: `binary: 'my-cli'` → `binaries: [{ name: 'my-cli', ... }]`
```

### Chore
```
chore(deps): upgrade pnpm to 10.6.2
```

## Pre-commit Hook Failures

1. Read the full hook output — it tells you exactly what failed
2. Fix the underlying issue (lint, type error, formatting)
3. Re-stage the fixed files
4. Create a **new** commit — do not amend the failed attempt
5. Never use `--no-verify` unless the user explicitly asks

