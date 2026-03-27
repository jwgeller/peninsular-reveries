<!-- GSD:project-start source:PROJECT.md -->
## Project

**Peninsular Reveries**

A lo-fi personal website for hosting self-contained web games, puzzles, and code experiments. Built with web standards — TypeScript, vanilla CSS, esbuild, no framework. Clean, minimal aesthetic with subtle personality — the kind of site that makes you pause and think "oh, this is nice." Deployed as a static site on GitHub Pages.

**Core Value:** A frictionless home for creative projects — dead simple to add new games and experiments, beautiful to look at, zero maintenance overhead.

### Constraints

- **Stack**: TypeScript + esbuild + vanilla CSS + GitHub Pages. No React. No heavy frameworks.
- **Hosting**: GitHub Pages (static files). Cloudflare Pages as backup if perf is an issue.
- **Build**: Minimal esbuild build step — TypeScript → browser JS. Single ~50-line build script.
- **Design**: Must look good with minimal design effort. Clean typography, good spacing, a few intentional personality touches.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Runtime & Language
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TypeScript | ^5.9 | All source code | Type safety for game logic, catches bugs early, Remix 3 monorepo uses 5.9.3 | HIGH |
| Node.js | ≥22.6 | Build-time execution | Required runtime for build script, native TS type stripping available | HIGH |
| tsx | ^4.21.0 | TypeScript execution | Runs build scripts directly without pre-compilation. 33M weekly downloads, mature tooling. Preferred over Node's `--experimental-strip-types` because it handles JSX, decorators, and edge cases that Node's native strip-types doesn't yet. | HIGH |
### Remix 3 Packages (à la carte)
| Package | Import Path | Version (in monorepo) | Purpose | Why | Confidence |
|---------|-------------|----------------------|---------|-----|------------|
| remix | `remix@next` | 3.0.0-alpha.4 | Umbrella package | Single install, all sub-packages available via `remix/*` imports | HIGH |
| html-template | `remix/html-template` | 0.3.0 | Safe HTML generation | Tagged template literal with auto-XSS-escaping. Zero dependencies. Works at build time AND client-side. Composable fragments, array interpolation, conditional rendering. | HIGH |
| response | `remix/response/html` | — | HTML response helper | `createHtmlResponse()` for build-time page generation. Pairs with html-template. | MEDIUM |
#### Packages to NOT use
| Package | Why Not |
|---------|---------|
| `remix/fetch-router` | **Server-side router** — maps `Request` → `Response` via Fetch API. Designed for live servers (Node, Bun, Deno, Cloudflare Workers). For a static site with ~5-10 pages pre-rendered to HTML files, a typed route map object is simpler and doesn't pull in routing middleware overhead. If the site grows to 20+ pages, revisit. |
| `remix/component` | **JSX component system** with SSR + hydration. PROJECT.md explicitly says "No React / no virtual DOM" and this is a Preact-fork-based component model with its own JSX runtime, `handle.update()`, mixins, etc. It's a framework in itself. For self-contained games written in TypeScript with direct DOM manipulation, this adds unnecessary abstraction. **Revisit if/when** game UI complexity justifies a component model. |
| `remix/auth*`, `remix/session*`, `remix/data-table*` | Server-only packages. No backend, no auth, no database in this project. |
#### Key Insight: fetch-router vs. Simple Build Script
- fetch-router is a **runtime HTTP router** (`createRouter()` → `router.get(route, handler)` → `router.fetch(request)`)
- For a static site deployed to GitHub Pages, there is no server to route requests
- Using it at build-time to "pre-render routes" means writing Request objects, calling `router.fetch()`, extracting Response bodies — when you could just call `html\`...\`` directly
- The type-safe route map (`route({ home: '/', games: '/games/:slug' })`) IS useful, but you get that same benefit from a plain TypeScript object
### Build Tooling
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| esbuild | ^0.25 | Bundle game TS → browser JS | Sub-second builds. Handles TypeScript + modern JS output. No config file needed — single CLI command per entry point. Remix 3 itself uses esbuild for its own bundling. | HIGH |
| tsc | (via TypeScript) | Type checking only | `tsc --noEmit` for CI/pre-commit validation. Don't use tsc for emit — esbuild is faster for that. | HIGH |
#### Why esbuild over alternatives
| Alternative | Why Not |
|-------------|---------|
| Vite | Overkill for static HTML + game bundles. Brings dev server, HMR, plugin system — complexity that conflicts with "minimal build" philosophy. |
| Webpack | Legacy. Slow. Complex config. No. |
| Rollup | Good but slower than esbuild. No meaningful advantage for this project's needs. |
| tsc emit only | Works but produces unbundled ES modules. Browser would need import maps or many network requests. esbuild produces a single file per entry. |
| No build at all | Browsers cannot execute TypeScript. The "religiously runtime" Remix 3 principle uses `--import` loaders for **server-side** TS execution. For **client-side** code sent to browsers, a compile step is unavoidable. |
#### Build Architecture
### CSS
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Modern CSS (vanilla) | — | All styling | CSS nesting, custom properties, `:has()`, container queries are widely supported in 2026. No preprocessor or framework needed. Aligns with web standards philosophy. | HIGH |
#### CSS Approach
- **Single `style.css`** for site-level design tokens and layout
- **Per-game CSS files** co-located with game code (e.g., `super-word/style.css`)
- CSS custom properties for theming (colors, spacing, fonts)
- CSS nesting (native, not Sass) for component-scoped styles
- No utility frameworks (Tailwind, UnoCSS) — the site is small enough that hand-written CSS is maintainable and produces exactly what's needed
#### Why not Tailwind / utility CSS
- Requires build tooling (PostCSS, CLI)
- Adds dependency management overhead
- For ~10 pages and a few games, custom CSS is faster to write AND produces less code
- The design goal is "minimal effort to maintain" — hand-written CSS with custom properties achieves this better than class-name soup
### Games: DOM vs. Canvas
| Approach | Recommendation | Why | Confidence |
|----------|----------------|-----|------------|
| **DOM-based rendering** | **USE THIS** | The existing Super Word game is DOM-based (emoji elements, CSS positioning, click/drag). This game type (UI-heavy, text/emoji, needs accessibility) is a perfect DOM use case. DOM gives you: free accessibility, CSS animations, responsive layout, text rendering, event handling, easy debugging in DevTools. | HIGH |
| HTML5 Canvas | Don't use (for now) | Canvas is for pixel-level rendering: physics simulations, particle effects, custom sprite rendering. Super Word has none of these. Canvas breaks accessibility (no screen reader support for game elements), requires manual hit testing, and means reimplementing layout. | HIGH |
### Hosting & Deployment
| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| GitHub Pages | Static hosting | Free, deploys from git (Actions workflow or branch), familiar. No server needed. | HIGH |
| GitHub Actions | CI/CD | Run build, deploy to Pages. Single workflow file. | HIGH |
#### Deployment Flow
#### Cloudflare Pages (backup)
### Testing
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Node.js test runner | built-in | Unit tests | `node --test` is built into Node 22+. Zero dependencies. Remix 3 uses it for html-template. | MEDIUM |
| Vitest | ^3.2 | If tests outgrow node:test | Only escalate if test complexity requires mocking, coverage, or watch mode beyond what node:test provides. | LOW (contingency) |
### Dev Experience
| Technology | Purpose | Why |
|------------|---------|-----|
| `tsx watch build.ts` | Auto-rebuild on changes | tsx has built-in watch mode. No separate dev server needed initially. |
| Local HTTP server | Preview static output | `npx serve dist/` or Python's `http.server`. Don't build a dev server framework. |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| TS Execution | tsx | Node.js `--experimental-strip-types` | Still experimental in Node 22, doesn't handle JSX, limited enum support. tsx is battle-tested with wider TS coverage. |
| TS Execution | tsx | ts-node | Heavier setup, slower startup, less reliable with ESM. tsx surpassed it. |
| Build | esbuild | Vite | Overkill. Vite is a dev server + build tool. We need a build tool only. |
| Build | esbuild | swc | Good but esbuild has wider ecosystem adoption and Remix 3 uses it. |
| CSS | Vanilla CSS | Tailwind CSS | Unnecessary build step, class-name noise, dependency management for a small site. |
| CSS | Vanilla CSS | Sass/SCSS | CSS nesting is native now. Custom properties replace most variable use cases. Sass adds a preprocessor dependency for diminishing returns. |
| CSS | Vanilla CSS | CSS Modules | Requires bundler integration. For a few CSS files, BEM-lite naming or CSS nesting scoping is sufficient. |
| Components | None (vanilla TS + DOM) | Remix component | Too much abstraction for self-contained games. Over-engineers the problem. |
| Components | None (vanilla TS + DOM) | Lit / Web Components | Interesting but adds learning curve and import overhead. Games are self-contained — they don't need a reusable component registry. |
| Routing | Plain TS route object | remix/fetch-router | Server-side router with no server to route on. Overhead without payoff. |
| Hosting | GitHub Pages | Cloudflare Pages | Backup option. GH Pages is simpler for a git-centric workflow. |
| Hosting | GitHub Pages | Netlify | More features than needed. Free tier has limits not relevant here. |
## Installation
# Core — the Remix 3 umbrella package (alpha)
# Build tooling (dev only)
# That's it. Three dev dependencies + one runtime dependency.
### package.json Scripts
### tsconfig.json (Key Settings)
## Sources
- Remix 3 monorepo README: https://github.com/remix-run/remix (verified 2026-03-27, active development, last commit 2 days ago)
- fetch-router README: https://github.com/remix-run/remix/tree/main/packages/fetch-router (v0.18.0, documented for server-side routing)
- html-template README: https://github.com/remix-run/remix/tree/main/packages/html-template (v0.3.0, zero-dependency tagged template)
- component README: https://github.com/remix-run/remix/tree/main/packages/component (v0.6.0, JSX component system with SSR + hydration)
- remix package.json: version 3.0.0-alpha.4 (umbrella)
- tsx: https://github.com/privatenumber/tsx (v4.21.0, 11.9k stars, 33M weekly npm downloads)
- esbuild: used by Remix 3 monorepo itself for bundling (see component/package.json devDependencies)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
