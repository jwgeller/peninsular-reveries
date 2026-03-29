# Retrospective

## Milestone: v1.0 — Peninsular Reveries MVP

**Shipped:** 2026-03-29
**Phases:** 6 | **Plans:** 13

### What Was Built
- Live static site on GitHub Pages with esbuild build pipeline and GitHub Actions CI/CD
- Super Word game — 8-module TypeScript rewrite (types, puzzles, state, renderer, input, accessibility, animations, main)
- Styled homepage with dark mode, project cards, theme toggle, playful 404, OG social previews
- Game polish — horizontal scene transitions, letter fly-to-notepad animations, emoji share-to-clipboard
- CSS View Transitions, build-time 200KB budget gate, Lighthouse CI in deployment pipeline
- Automated Playwright test suite with CI test gate

### What Worked
- **Deploy-first strategy** — shipping a skeleton in Phase 1 created accountability and made all subsequent phases deliver visible progress at a live URL
- **Web standards approach** — vanilla TS + CSS + DOM API was sufficient for everything; no framework overhead or churn
- **Accessibility-first in Phase 2** — baking WCAG compliance into the game architecture from the start avoided costly retrofitting
- **Descoping discipline** — three requirements (LOOK-02, LOOK-07, LOOK-08) were descoped with documented rationale, keeping v1 focused

### What Was Inefficient
- **Phase 1 verification gap** — Phase 1 lacked a VERIFICATION.md, requiring Phase 6 to close the gap with automated tests. Future phases should verify as they go.
- **ROADMAP.md progress table drift** — the progress table got stale (showed Phase 2-6 as "Planned"/"Not started" despite being complete). Automation should keep this in sync.

### Patterns Established
- **Game registry pattern** — single source of truth for nav and homepage content (`game-registry.ts`)
- **Shell injection** — shared nav/footer injected via TypeScript module (`shell.ts`)
- **Build-time budget** — `statSync` assertion in `build.ts` catches size regressions at CI
- **Raw PNG generation** — apple-touch-icon and OG image built via zlib, zero image dependencies
- **CSS-only View Transitions** — `@view-transition` MPA approach, no JS needed

### Key Lessons
- The "ship first, polish later" structure genuinely works for maintaining momentum on personal projects
- Minimal tooling (esbuild, no framework) pays off — sub-second builds, near-zero config, nothing to maintain
- Automated tests for infrastructure requirements should be part of the initial phase, not a gap-closure phase later

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 6 |
| Plans | 13 |
| Timeline | 3 days |
| LOC | ~2,965 |
| Commits | 66 |
| Descoped | 3 requirements |
