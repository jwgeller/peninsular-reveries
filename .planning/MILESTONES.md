# Milestones

## v1.0 Peninsular Reveries MVP (Shipped: 2026-03-29)

**Phases completed:** 6 phases, 13 plans
**Timeline:** 3 days (2026-03-26 → 2026-03-29)
**LOC:** ~2,965 (1,710 TS + 1,058 CSS + 197 HTML)
**Commits:** 66

**Key accomplishments:**

1. Live static site on GitHub Pages with esbuild build pipeline and GitHub Actions CI/CD
2. Full Super Word game — 8-module TypeScript rewrite with 5 puzzles, keyboard/pointer/touch input, WCAG accessibility
3. Styled homepage with dark mode, project cards, theme toggle, playful 404, OG social previews
4. Game polish — scene transitions, letter fly-to-notepad animations, emoji share-to-clipboard, prefers-reduced-motion
5. Performance enforcement — CSS View Transitions, build-time 200KB budget gate, Lighthouse CI pipeline
6. Automated Playwright test suite verifying all Phase 1 requirements with CI test gate

**Descoped:**
- LOOK-02: localStorage persistence (game is ~5 min, starts fresh) — D-01
- LOOK-07: Loading indicator (scene transitions serve this purpose) — D-09
- LOOK-08: Analytics (deferred to v2) — D-05

---
