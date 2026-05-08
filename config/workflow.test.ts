import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const workflow = readFileSync('.github/workflows/deploy.yml', 'utf-8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8')) as {
  packageManager: string
  scripts: Record<string, string>
}
const preCommitHook = readFileSync('.githooks/pre-commit', 'utf-8')
const installScript = readFileSync('scripts/install-git-hooks.mjs', 'utf-8')

test('deploy workflow triggers on pushes to main and publishes Pages artifacts', () => {
  assert.match(workflow, /push:/)
  assert.match(workflow, /branches: \[main\]/)
  assert.match(workflow, /actions\/upload-pages-artifact/)
  assert.match(workflow, /actions\/deploy-pages/)
})

test('workflow keeps deploy verification fast and leaves browser checks local', () => {
  assert.match(workflow, /bun run check/)
  assert.match(workflow, /bun run test:unit/)
  assert.doesNotMatch(workflow, /playwright install --with-deps chromium/)
  assert.doesNotMatch(workflow, /setup-node/)
})

test('local git hooks install from prepare and run the full validation gate', () => {
  assert.equal(packageJson.packageManager, 'bun@1.3.13')
  assert.equal(packageJson.scripts.prepare, 'bun scripts/install-git-hooks.mjs')
  assert.equal(packageJson.scripts['test:local'], 'bun run check && bun test')
  assert.match(preCommitHook, /bun test:local/)
  assert.match(installScript, /core\.hooksPath', '\.githooks'/)
})

test('workflow keeps Pages URLs dynamic and repository-safe', () => {
  assert.match(workflow, /SITE_BASE_PATH: \/\$\{\{ github\.event\.repository\.name \}\}/)
  assert.match(workflow, /SITE_ORIGIN: https:\/\/\$\{\{ github\.repository_owner \}\}\.github\.io/)
})