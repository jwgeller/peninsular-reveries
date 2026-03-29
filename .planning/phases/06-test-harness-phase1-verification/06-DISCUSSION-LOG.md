# Phase 6: Automated Test Harness & Phase 1 Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 06-test-harness-phase1-verification
**Areas discussed:** Dev server strategy, Test organization, CI integration, INFRA-02 verification

---

## Dev Server Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Playwright `webServer` + `serve` package | Standard approach — Playwright handles server lifecycle, `serve` as devDep, `npm test` is one command | ✓ |
| Playwright `webServer` + custom Node server | Tiny `serve-dist.ts` with `node:http` + `node:fs`, no extra dep but you maintain the code | |
| Manual server management | Start server separately, tests just connect. More flexible but worse DX | |

**User's choice:** Playwright `webServer` + `serve` package (standard approach)
**Notes:** User accepted the recommended option. Aligns with minimal-tooling ethos — one small devDep, zero config.

---

## Test Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Per-requirement files (7 files) | 1:1 mapping from requirement ID to test file (e.g., `site-01-responsive.spec.ts`). Clear audit trail — failed test immediately identifies which requirement regressed | ✓ |
| Per-page files (3 files) | Groups by page (homepage, super-word, 404). Fewer browser contexts, requirement tracing via `test.describe` blocks | |
| Hybrid per-concern (4 files) | Groups by testing concern: structure, navigation, responsive, build | |

**User's choice:** Per-requirement files (recommended option)
**Notes:** User accepted recommendation. Traceability is the priority since this phase exists specifically to close milestone audit verification gaps.

---

## CI Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Tests gate deployment (pre-deploy) | Test job runs after build, before deploy. Catches regressions before they go live | ✓ |
| Tests run post-deploy | Test job after deploy tests the live URL. Catches real deployment issues but broken code is briefly live | |
| Both pre-deploy and post-deploy | Most thorough but more CI complexity | |

**User's choice:** Tests gate deployment (pre-deploy)
**Notes:** Lighthouse already covers post-deploy checks. For a personal site, pre-deploy gating is sufficient.

---

## INFRA-02 Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Verify workflow file structure | Test reads `.github/workflows/deploy.yml` and asserts structural correctness (trigger, jobs, actions, build step) | ✓ |
| Manual/CI-only verification | Mark INFRA-02 as verified by existing live deployment. No automated test | |
| Hybrid (structure test + documentation) | Write the workflow test AND document that actual deployment is verified by CI existence | |

**User's choice:** Verify workflow file structure
**Notes:** Lightweight and catches accidental workflow breakage. Actual end-to-end deployment is observable from the live site.

---

## Agent's Discretion

- Playwright config details (browsers, timeouts, retries)
- Viewport sizes for responsive testing
- Navigation patterns in test hooks
- Test file directory location

## Deferred Ideas

None — discussion stayed within phase scope.
