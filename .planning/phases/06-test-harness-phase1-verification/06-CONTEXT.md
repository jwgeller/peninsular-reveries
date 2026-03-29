# Phase 6: Automated Test Harness & Phase 1 Verification - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Playwright test infrastructure with a local dev server, write automated tests that verify all 7 Phase 1 requirements (SITE-01, SITE-02, SITE-03, SITE-05, SITE-06, INFRA-01, INFRA-02), fix stale REQUIREMENTS.md checkboxes, and integrate tests into the CI pipeline to gate future deployments.

</domain>

<decisions>
## Implementation Decisions

### Dev Server Strategy
- **D-01:** Use Playwright's built-in `webServer` config with the `serve` npm package as a devDependency. Playwright starts/stops the server automatically — `npm test` is a single command.

### Test Organization
- **D-02:** One test file per requirement — 7 files total (e.g., `site-01-responsive.spec.ts`, `site-02-navigation.spec.ts`, etc.). 1:1 mapping from requirement ID to test file for clear audit traceability. This phase exists to close verification gaps from the milestone audit, so traceability is the priority.

### CI Integration
- **D-03:** Tests gate deployment — add a `test` job in `deploy.yml` after `build` but before `deploy`. If tests fail, deploy does not happen. Lighthouse already covers post-deploy checks, so no post-deploy test step needed.

### INFRA-02 Verification
- **D-04:** Verify INFRA-02 (GitHub Actions deployment) by reading `.github/workflows/deploy.yml` and asserting structural correctness: trigger is `push` to `main`, has build/deploy jobs, uses `actions/deploy-pages`, includes `npx tsx build.ts` step. This catches accidental workflow breakage — actual end-to-end deployment is observable from the live site.

### Agent's Discretion
- Playwright config details (browsers to test, timeouts, retry settings)
- Specific viewport sizes for responsive testing (SITE-01)
- Whether to use `page.goto` per test or share navigation in `beforeEach` hooks
- Test file location (`tests/`, `e2e/`, or other directory)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Audit
- `.planning/v1.0-MILESTONE-AUDIT.md` — Identifies the 7 partial requirements (all Phase 1 verification gaps) that this phase closes

### Requirements
- `.planning/REQUIREMENTS.md` — Full requirement definitions for SITE-01 through SITE-06, INFRA-01, INFRA-02; includes traceability table showing Phase 6 coverage

### Existing Infrastructure
- `.github/workflows/deploy.yml` — Current CI pipeline (build → deploy → Lighthouse) that needs a test job inserted
- `build.ts` — Build script that INFRA-01 tests must verify runs successfully
- `package.json` — Current scripts and devDependencies; needs `test` script and new devDeps

### HTML Pages Under Test
- `public/index.html` — Homepage (tests SITE-01, SITE-02, SITE-03, SITE-05, SITE-06)
- `public/super-word/index.html` — Game page (tests SITE-01, SITE-02, SITE-03)
- `public/404.html` — 404 page (tests SITE-03)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No test infrastructure exists — Playwright, test runner, and `test` script all need to be added from scratch

### Established Patterns
- **Build:** `tsx build.ts` produces `dist/` with static HTML/CSS/JS files
- **Minimal tooling:** Project uses esbuild with a ~50-line build script — test setup should match this simplicity
- **TypeScript throughout:** Tests should be TypeScript (`.spec.ts`)

### Integration Points
- `package.json` — Add `@playwright/test` and `serve` as devDependencies, add `test` script
- `.github/workflows/deploy.yml` — Insert `test` job between `build` and `deploy` jobs
- `dist/` — Tests serve this directory; build must run before tests
- 3 pages to test: homepage (`index.html`), Super Word (`super-word/index.html`), 404 (`404.html`)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The phase is straightforward: set up Playwright, write requirement-mapped tests, gate CI.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-test-harness-phase1-verification*
*Context gathered: 2026-03-29*
