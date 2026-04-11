import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const workflow = readFileSync('.github/workflows/deploy.yml', 'utf-8')
const pnpmWorkspace = readFileSync('pnpm-workspace.yaml', 'utf-8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8')) as {
  packageManager: string
  engines: {
    node: string
  }
  scripts: Record<string, string>
}
const preCommitHook = readFileSync('.githooks/pre-commit', 'utf-8')
const installScript = readFileSync('scripts/install-git-hooks.mjs', 'utf-8')

test('deploy workflow still triggers on pushes to main and publishes Pages artifacts', () => {
  assert.match(workflow, /push:/)
  assert.match(workflow, /branches: \[main\]/)
  assert.match(workflow, /actions\/upload-pages-artifact/)
  assert.match(workflow, /actions\/deploy-pages/)
})

test('workflow keeps deploy verification fast and leaves browser checks local', () => {
  assert.match(workflow, /pnpm check/)
  assert.match(workflow, /pnpm test:unit/)
  assert.doesNotMatch(workflow, /pnpm test:e2e/)
  assert.doesNotMatch(workflow, /playwright install --with-deps chromium/)
})

test('local git hooks install from prepare and run the full validation gate', () => {
  assert.equal(packageJson.packageManager, 'pnpm@10.33.0')
  assert.equal(packageJson.engines.node, '>=24.14.1 <25')
  assert.equal(packageJson.scripts.prepare, 'node scripts/install-git-hooks.mjs')
  assert.equal(packageJson.scripts['test:local'], 'pnpm check && pnpm test')
  assert.match(preCommitHook, /pnpm test:local/)
  assert.match(installScript, /core\.hooksPath', '\.githooks'/)
})

test('workflow keeps Pages URLs dynamic and repository-safe', () => {
  assert.match(workflow, /SITE_BASE_PATH: \/\$\{\{ github\.event\.repository\.name \}\}/)
  assert.match(workflow, /SITE_ORIGIN: https:\/\/\$\{\{ github\.repository_owner \}\}\.github\.io/)
})

test('pnpm workspace pins Node 24 and enables supply-chain safeguards', () => {
  assert.match(pnpmWorkspace, /useNodeVersion: 24\.14\.1/)
  assert.match(pnpmWorkspace, /nodeVersion: 24\.14\.1/)
  assert.match(pnpmWorkspace, /engineStrict: true/)
  assert.match(pnpmWorkspace, /verifyDepsBeforeRun: error/)
  assert.match(pnpmWorkspace, /resolutionMode: time-based/)
  assert.match(pnpmWorkspace, /minimumReleaseAge: 1440/)
  assert.match(pnpmWorkspace, /blockExoticSubdeps: true/)
  assert.match(pnpmWorkspace, /strictDepBuilds: true/)
  assert.match(pnpmWorkspace, /onlyBuiltDependencies:/)
  assert.match(pnpmWorkspace, /- esbuild/)
  assert.match(pnpmWorkspace, /- playwright/)
})