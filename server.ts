/**
 * Peninsular Reveries — Runtime Server
 *
 * Works identically in development and production:
 *   - Dev:  `pnpm dev`  (watches files, live reload, unminified)
 *   - Prod: `pnpm start` (no watch, no live reload, optimized)
 *
 * No static site build step needed. The server renders every page on request.
 */

import * as http from 'node:http'
import * as esbuild from 'esbuild'
import { createRequestListener } from '@remix-run/node-fetch-server'
import { createAppRouter } from './app/router.js'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const IS_DEV = !process.env.NODE_ENV?.includes('production') && !process.argv.includes('--production')

// ── esbuild: bundle game code ─────────────────────────────────
const esbuildOutdir = '.dev-client'

const clientEntryPoints = [
  'client/shell.ts',
  'client/home.ts',
  'client/404.ts',
]

const gameEntryPoints = [
  'games/mission-orbit/main.ts',
  'games/super-word/main.ts',
  'games/chompers/main.ts',
  'games/pixel-passport/main.ts',
  'games/story-trail/main.ts',
  'games/squares/main.ts',
  'games/waterwall/main.ts',
  'games/beat-pad/main.ts',
  'games/train-sounds/main.ts',
  'games/peekaboo/main.ts',
  'games/spot-on/main.ts',
  'games/copycat/main.ts',
  'games/mudskipper/main.ts',
  'games/tuna-piano/main.ts',
  'games/grow-with-me/main.ts',
  'games/baking-simulator/main.ts',
  'games/all-aboard/main.ts',
  'games/breakers/main.ts',
  'games/dragons-crunch/main.ts',
  'games/bubble-pop/main.ts',
  'games/color-reach/main.ts',
  'games/jelly-wobble/main.ts',
  'games/leaf-swirl/main.ts',
  'games/star-dash/main.ts',
]




const clientEsbuildOptions: esbuild.BuildOptions = {
  bundle: true,
  outbase: 'client',
  outdir: esbuildOutdir,
  format: 'esm',
  target: 'es2022',
  sourcemap: IS_DEV,
  minify: !IS_DEV,
}

const gameEsbuildOptions: esbuild.BuildOptions = {
  bundle: true,
  outbase: 'games',
  outdir: esbuildOutdir,
  format: 'esm',
  target: 'es2022',
  sourcemap: IS_DEV,
  minify: !IS_DEV,
}



if (IS_DEV) {
  // Dev: watch mode — rebuild on changes, live reload SSE
  const ctx = await esbuild.context({
    ...clientEsbuildOptions,
    entryPoints: clientEntryPoints,
  })
  const gameCtx = await esbuild.context({
    ...gameEsbuildOptions,
    entryPoints: gameEntryPoints,
  })
  await ctx.watch()
  await gameCtx.watch()
  console.log('esbuild watching for changes...')
} else {
  // Prod: one-time build
  await esbuild.build({
    ...clientEsbuildOptions,
    entryPoints: clientEntryPoints,
  })
  await esbuild.build({
    ...gameEsbuildOptions,
    entryPoints: gameEntryPoints,
  })
  console.log('esbuild bundled production JS')
}

// ── MIME types ────────────────────────────────────────────────
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
}

function cacheControl(ext: string): string {
  if (IS_DEV) return 'no-cache'
  if (ext === '.js' || ext === '.css' || ext === '.woff2') return 'public, max-age=31536000, immutable'
  return 'public, max-age=600'
}

// ── Live reload (dev only) ─────────────────────────────────────
const sseClients = new Set<http.ServerResponse>()
const LIVE_RELOAD_SCRIPT = `<script>new EventSource('/__reload').addEventListener('message', () => location.reload());</script>`

if (IS_DEV) {
  const { watch } = await import('node:fs')
  for (const dir of ['app', 'client', 'games', 'public']) {
    watch(dir, { recursive: true }, () => {
      for (const client of sseClients) client.write('data: change\n\n')
    })
  }
}

// ── Request handler ────────────────────────────────────────────
const router = createAppRouter()

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)

  // SSE endpoint for live reload (dev only)
  if (IS_DEV && url.pathname === '/__reload') {
    return new Response(null, { status: 204 })
  }

  // Serve bundled JS
  if (url.pathname.startsWith('/client/')) {
    // In production, check .dev-client first (built JS), then dist fallback
    const devPath = join(esbuildOutdir, url.pathname.slice('/client/'.length))
    if (existsSync(devPath) && statSync(devPath).isFile()) {
      const ext = extname(devPath)
      return new Response(readFileSync(devPath), {
        headers: { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'Cache-Control': cacheControl(ext) },
      })
    }
  }

  // Serve static files from public/
  {
    const filePath = join('public', url.pathname)
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath)
      return new Response(readFileSync(filePath), {
        headers: { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'Cache-Control': cacheControl(ext) },
      })
    }
  }

  // Try the router (SSR)
  const response = await router.fetch(request)
  if (response.status !== 404 || url.pathname === '/404.html') {
    if (IS_DEV) {
      const contentType = response.headers.get('Content-Type') || ''
      if (contentType.includes('text/html')) {
        const body = await response.text()
        const injected = body.replace('</body>', `${LIVE_RELOAD_SCRIPT}\n</body>`)
        const headers = new Headers(response.headers)
        headers.set('Cache-Control', 'no-cache')
        return new Response(injected, { status: response.status, headers })
      }
    }
    return response
  }

  // 404
  const notFoundResponse = await router.fetch(new Request('http://localhost/404.html'))
  const body = await notFoundResponse.text()
  const html = IS_DEV ? body.replace('</body>', `${LIVE_RELOAD_SCRIPT}\n</body>`) : body
  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' },
  })
}

// ── HTTP server ─────────────────────────────────────────────────
const listener = createRequestListener(handler)
const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || (IS_DEV ? 'localhost' : '0.0.0.0')

const server = http.createServer((req, res) => {
  // SSE for live reload (dev only)
  if (IS_DEV && req.url === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
    sseClients.add(res)
    req.on('close', () => sseClients.delete(res))
    return
  }
  listener(req, res)
})

server.listen(PORT, HOST, () => {
  console.log(`Peninsular Reveries ${IS_DEV ? 'dev' : 'production'} server → http://${HOST}:${PORT}`)
})