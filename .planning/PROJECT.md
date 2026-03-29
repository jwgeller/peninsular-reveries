# Peninsular Reveries

## What This Is

A lo-fi personal website hosting self-contained web games, puzzles, and code experiments. Ships one polished game (Super Word — a children's letter-finding puzzle). Built with web standards — TypeScript, vanilla CSS, esbuild, no framework. Dark mode, View Transitions, accessibility-first, sub-200KB pages. Live on GitHub Pages with automated CI/CD, Lighthouse audits, and Playwright tests.

## Core Value

A frictionless home for creative projects — dead simple to add new games and experiments, beautiful to look at, zero maintenance overhead.

## Current State

**Shipped:** v1.0 (2026-03-29)
**Live at:** GitHub Pages
**Codebase:** ~2,965 LOC (1,710 TS + 1,058 CSS + 197 HTML), 80 tracked files
**Stack:** TypeScript + esbuild + vanilla CSS + GitHub Pages
**Test suite:** Playwright (7 spec files covering all infrastructure and site requirements)
**CI pipeline:** GitHub Actions → build → budget check → Lighthouse → Playwright → deploy

## Requirements

### Validated

- ✓ Static site with homepage and per-project pages — v1.0
- ✓ Easy to add new games/experiments (game registry pattern, minimal boilerplate) — v1.0
- ✓ GitHub Pages deployment with CI/CD — v1.0
- ✓ Accessible and responsive (WCAG 2.1 AA, keyboard, touch, screen reader) — v1.0
- ✓ Super Word game: full TypeScript rewrite with polished visuals and UX — v1.0
- ✓ Clean, minimal design with subtle quirky personality touches — v1.0
- ✓ View Transitions API for smooth page navigation with graceful degradation — v1.0
- ✓ Performance budget enforcement — 200KB per-page hard gate at build time — v1.0
- ✓ Lighthouse CI audit in deployment pipeline — v1.0
- ✓ Automated Playwright test suite covering all Phase 1 requirements — v1.0
- ✓ CI test gate — tests must pass before deployment — v1.0
- ✓ Dark mode via prefers-color-scheme with CSS custom properties — v1.0
- ✓ OG meta tags for social sharing previews — v1.0
- ✓ Share results (emoji score summary to clipboard) — v1.0
- ✓ All animations respect prefers-reduced-motion — v1.0

### Active

(None — fresh for next milestone)

### Out of Scope

- Remix 3 packages — research concluded fetch-router is server-side only, html-template is marginal
- Blog/writing features — not interested in writing-heavy content right now
- Backend/database — everything is client-side
- React or any virtual DOM framework — web standards only
- localStorage game persistence — game is ~5 min, starts fresh (descoped v1, revisit if needed)
- Loading indicator — scene transitions serve this purpose (descoped v1)
- Analytics — deferred to v2, no cookie-free provider selected yet

## Context

- **Shipped product:** Live personal site with one polished game (Super Word), dark mode, View Transitions, social previews, and automated test/deploy pipeline
- **Super Word game:** 8-module TypeScript architecture (types, puzzles, state, renderer, input, accessibility, animations, main). 5 puzzles, keyboard + pointer + touch input, aria-live announcements, CSS animations
- **Design system:** CSS custom properties for theming, responsive breakpoints, card hover effects, link transitions, playful 404 page with floating digits
- **Build pipeline:** esbuild (~50-line build.ts), build-time page budget assertion (200KB), raw PNG generation for icons/OG images via zlib (zero image deps)
- **CI/CD:** GitHub Actions → build → Lighthouse CI (performance, accessibility, best practices) → Playwright tests → deploy to GitHub Pages
- **Developer context:** Autism means sticking with things can be hard — the site and tooling need to be low-friction enough to return to after breaks. Minimizing setup/maintenance overhead is a real requirement, not a nice-to-have.

## Constraints

- **Stack**: TypeScript + esbuild + vanilla CSS + GitHub Pages. No React. No heavy frameworks.
- **Hosting**: GitHub Pages (static files). Cloudflare Pages as backup if perf is an issue.
- **Build**: Minimal esbuild build step — TypeScript → browser JS. Single ~50-line build script.
- **Design**: Must look good with minimal design effort. Clean typography, good spacing, a few intentional personality touches.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No Remix 3 packages at launch | Research: fetch-router is server-side only, html-template marginal | ✓ Good — no regrets, web standards worked fine |
| TypeScript over plain JS | Better DX for game logic, catches bugs early | ✓ Good — 8-module game architecture, type safety caught real issues |
| GitHub Pages hosting | Free, deploys from git, familiar workflow | ✓ Good — zero-cost, reliable, fast deploys |
| Full rewrite of Super Word (not cleanup) | AI prototype has useful concept but needs proper architecture | ✓ Good — 8 TS modules, proper state/render/input separation |
| No React / no virtual DOM | Web standards alignment, simpler mental model | ✓ Good — vanilla TS + DOM API was sufficient for everything |
| Raw PNG generation via zlib | Generates apple-touch-icon and og-image at build time with zero image deps | ✓ Good — no Sharp/Canvas deps to maintain |
| CSS-only View Transitions | @view-transition MPA approach — no JS needed, progressive enhancement | ✓ Good — works in Chrome/Edge, graceful fallback elsewhere |
| Analytics descoped from v1 | LOOK-08 removed — privacy-respecting analytics deferred to v2 | ✓ Good — reduced scope without losing core value |
| Build-time budget over runtime monitoring | statSync assertion is simpler and catches issues at CI, not in production | ✓ Good — caught budget issues early in pipeline |
| localStorage persistence descoped | Game is ~5 min, always starts fresh. JSON-serializable state if needed later | ✓ Good — simplified v1 scope |
| Playwright for automated testing | Lightweight, fast, browser-level verification of requirements | ✓ Good — catches regressions, CI-integrated |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after v1.0 milestone completion*
