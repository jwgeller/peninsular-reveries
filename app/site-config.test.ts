import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { getSiteBasePath, getSiteUrl } from './site-config'
import { normalizeBasePath, resolveSiteUrl, withBasePath } from './site-paths'

test('site path helpers produce GitHub Pages-safe URLs', () => {
  assert.equal(normalizeBasePath('/peninsular-reveries/'), '/peninsular-reveries')
  assert.equal(withBasePath('/', '/peninsular-reveries'), '/peninsular-reveries/')
  assert.equal(withBasePath('/styles/main.css', '/peninsular-reveries'), '/peninsular-reveries/styles/main.css')
  assert.equal(resolveSiteUrl('https://ironloon.github.io/peninsular-reveries', '/og-image.png'), 'https://ironloon.github.io/peninsular-reveries/og-image.png')
})

test('site config reads environment overrides correctly', () => {
  const previousBasePath = process.env.SITE_BASE_PATH
  const previousSiteOrigin = process.env.SITE_ORIGIN

  process.env.SITE_BASE_PATH = '/peninsular-reveries'
  process.env.SITE_ORIGIN = 'https://ironloon.github.io'

  try {
    assert.equal(getSiteBasePath(), '/peninsular-reveries')
    assert.equal(getSiteUrl(), 'https://ironloon.github.io/peninsular-reveries')
  } finally {
    if (previousBasePath === undefined) {
      delete process.env.SITE_BASE_PATH
    } else {
      process.env.SITE_BASE_PATH = previousBasePath
    }

    if (previousSiteOrigin === undefined) {
      delete process.env.SITE_ORIGIN
    } else {
      process.env.SITE_ORIGIN = previousSiteOrigin
    }
  }
})

test('game registry stays aligned with project-site deployment', () => {
  const gameRegistry = readFileSync('app/data/game-registry.ts', 'utf-8')

  assert.match(gameRegistry, /Mission: Orbit/)
  assert.match(gameRegistry, /Chompers/)
  assert.match(gameRegistry, /Pixel Passport/)
  assert.match(gameRegistry, /Squares/)
})

test('all manifests use relative paths for GitHub Pages compatibility', () => {
  const gamesDir = 'public'
  const dirs = readdirSync(gamesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  let checkedCount = 0
  for (const dir of dirs) {
    const manifestPath = join(gamesDir, dir, 'manifest.json')
    let manifest: string
    try {
      manifest = readFileSync(manifestPath, 'utf-8')
    } catch {
      continue
    }
    checkedCount++
    // start_url must use relative path (not absolute)
    assert.match(manifest, /"start_url": "\.\/"/, `${dir}: start_url should be "./", got: ${manifest.match(/"start_url": "[^"]*"/)?.[0]}`)
    // scope must use relative path (not absolute)
    assert.match(manifest, /"scope": "\.\/"/, `${dir}: scope should be "./", got: ${manifest.match(/"scope": "[^"]*"/)?.[0]}`)
    // icon src must use relative path (not absolute starting with /)
    const iconSrcMatch = manifest.match(/"src": "[^"]*"/g)
    if (iconSrcMatch) {
      for (const src of iconSrcMatch) {
        const value = src.match(/"src": "(.*)"/)?.[1]
        assert.ok(!value?.startsWith('/'), `${dir}: icon src should not start with "/", got: ${value}`)
      }
    }
  }
  assert.ok(checkedCount > 0, 'Expected at least one manifest to be checked')
})