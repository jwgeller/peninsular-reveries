/**
 * Shared PixiJS vendor entry point.
 * Immersive games all need PixiJS (~500KB). Instead of bundling it
 * into every game, this file creates a single shared chunk that all
 * immersive games reference via an import map. This cuts total
 * deployed JS from ~5.5MB (11 × 500KB) down to ~540KB (1 × 500KB + 11 × ~4KB).
 */
export * from 'pixi.js'