---
name: web-testing
description: L2 AI-driven web UI testing for Onsager Dashboard. Use when testing UI on PRs, triaging L1 test failures, or verifying UI behavior at desktop + mobile viewports. Triggers include "test the UI", "check the dashboard", "triage L1 failure", "run L2 tests", "validate this PR", "exploratory test the web app".
---

# Web Testing Protocol (L2)

Exploratory, AI-driven validation of Onsager Dashboard UI changes — **not**
regression testing. Regression coverage is L1's job
(`apps/dashboard/tests/smoke/` + `apps/dashboard/tests/e2e/`). L2 catches
things L1 misses: layout bugs, mobile regressions, interaction flows that
only fail in a real browser.

## When to invoke

- A PR touches `apps/dashboard/**`
- L1 e2e fails and you need to know if it's a real regression, flaky, or env
- Someone says "validate the UI" / "dogfood this change"

## The app under test

The CI pipeline builds `crates/stiglab/deploy/Dockerfile` — a single image
bundling the Rust backends (`stiglab` + `synodic`) and the prebuilt dashboard
SPA. It listens on `http://localhost:3000`.

Primary routes:

| Route              | Page                    | Heading      |
|--------------------|-------------------------|--------------|
| `/`                | Factory overview        | `Factory`    |
| `/sessions`        | Sessions list           | `Sessions`   |
| `/sessions/:id`    | Session detail          | — (dynamic)  |
| `/nodes`           | Nodes list              | `Nodes`      |
| `/artifacts`       | Artifacts list          | `Artifacts`  |
| `/spine`           | Event spine viewer      | — (dynamic)  |
| `/governance`      | Governance              | `Governance` |
| `/settings`        | Settings + credentials  | `Settings`   |

## Viewports (always test both)

- Desktop: `agent-browser set viewport 1280 720`
- Mobile:  `agent-browser set viewport 375 812`

Mobile matters — the dashboard ships with a responsive layout (see the
`md:` breakpoints throughout). Horizontal overflow and hidden nav are the
top-two regression classes.

## Procedure

1. **Read the diff** (`git diff $DIFF_RANGE`) — you will receive
   `DIFF_RANGE` as an env var from CI.
2. **Map changes to routes.** A change in `src/pages/SessionsPage.tsx` ⇒
   `/sessions`. A change in `src/components/layout/**` ⇒ every route.
3. **For each affected route, at each viewport:**
   - `agent-browser open http://localhost:3000<route>`
   - Snapshot the page; verify the heading + key elements render.
   - Actively exercise interactive elements — don't just check markup:
     - Click buttons, submit forms, open dialogs.
     - **Verify the result** — did the UI state change, did the dialog close,
       did new data appear? Presence of markup is not proof of working.
   - Check for layout bugs. On mobile especially: horizontal scroll is a
     failure; a nav that blocks content is a failure.
   - `agent-browser screenshot --screenshot-dir /tmp/l2-screenshots` then
     rename the output to `{route-slug}-{desktop|mobile}.png`.
4. **Crystallize findings.** When you validate new behavior or catch a bug
   whose fix you can describe, write a deterministic L1 test under
   `apps/dashboard/tests/smoke/` (component-level) or
   `apps/dashboard/tests/e2e/` (browser-level). This is how L2 discoveries
   become permanent L1 coverage.
5. **Emit the verdict.** Return JSON matching `tests/l2-verdict-schema.json`:
   - `PASS` if every affected route passes at both viewports.
   - `FAIL` if any route fails; include the specific failure in
     `viewports[].issues[]`.

## Triage mode

When invoked after an L1 e2e failure, your job is different:

1. Read the failing test file(s) under `apps/dashboard/tests/e2e/`.
2. Reproduce against `http://localhost:3000` with agent-browser.
3. For each failure, classify: **regression** (real bug), **flaky**
   (intermittent / timing), or **environment** (test harness or CI issue).
4. Return JSON matching `tests/l2-triage-schema.json` with root cause and
   suggested fix.

## Guardrails

- Scope to the diff. Don't re-test the whole app on a one-line change.
- Screenshots are required evidence — no screenshot, the viewport didn't run.
- Don't invent routes. If a new route was added in the diff, use that one;
  otherwise stick to the table above.
- Keep it cheap. One browser session per viewport is plenty.
