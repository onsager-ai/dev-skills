# Specification format

Use this format with the repository's declared spec medium and contribution
policy. Repository-specific area labels, impact sections, public examples and
always-spec surfaces belong in its contract/workflow overlay.

## Sections

| Section | Content |
| --- | --- |
| Overview | Concrete problem, motivation and intended outcome |
| Design | Scope, externally visible behavior, boundaries and relevant contracts |
| Plan | Ordered, independently verifiable deliverables |
| Test | Evidence for each deliverable, including meaningful negative cases |
| Alignment | Named decisions, existing authorization and implementation ownership |
| Notes | Dependencies, source references and relevant tradeoffs; omit if empty |

Keep a spec near 2000 tokens or less. Split larger work into a parent and scoped
children. A shared contract can be linked from both producer and consumer specs;
repository boundaries still determine which repo owns each artifact.

## Alignment

An explicit task or existing policy can already authorize implementation. Put a
decision under Human decides only when it crosses a concrete unresolved boundary;
name the source and affected deliverables. Put authorized implementation under
AI implements. Open questions block only the dependent work, not independent work
within the existing authorization. When answered, update the question/decision in
the same sitting; comments alone do not reconcile stale blocker state.

## GitHub issue representation

Use issue state for open/closed lifecycle. Apply existing repository labels for
spec/type/area/priority and any required impact category. Do not create new labels
or status conventions by inference. Native sub-issues represent parent/child
work where supported; explicit links preserve the relationship otherwise.

Keep prose paragraphs, list items and blockquotes on single source lines with
blank lines between blocks. This avoids hard line-break rendering in GitHub
bodies. Fenced examples and tables retain their intended formatting.

Use `Closes #N` for the remaining completed slice, `Part of #N` for partial
progress and `Refs #N` for context. One closure keyword per issue prevents
accidental unclosed work. Tick Plan items after delivery, not while a draft is
still unmerged. A published issue URL and a local draft are different outcomes.

## Worked shape

```markdown
## Overview

A concrete trigger exposes an unmet requirement; explain its impact.

## Design

Describe the resulting behavior and the boundary it preserves.

## Plan

- [ ] Deliver the scoped behavior.
- [ ] Update the affected contract/reference.

## Test

- [ ] Verify the intended behavior and a meaningful refusal/failure case.

## Alignment

### AI implements

- [ ] Implement the authorized Plan and its verification.
```

Add only the repo's applicable overlay sections. The common method does not
supply another product's schema, reach, localization or provider requirements.
