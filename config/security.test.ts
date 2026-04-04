import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const gitignore = readFileSync('.gitignore', 'utf-8')

test('.env stays ignored and untracked', () => {
  assert.match(gitignore, /^\.env$/m)

  const trackedEnvFiles = execFileSync('git', ['ls-files', '.env', '.env.*'], {
    encoding: 'utf-8',
  }).trim()

  assert.equal(trackedEnvFiles, '')
})

test('git history does not contain a committed Freesound key assignment', () => {
  const committedAssignments = execFileSync('git', ['log', '--all', '-G', '^FREESOUND_API_KEY=', '--oneline'], {
    encoding: 'utf-8',
  }).trim()

  assert.equal(committedAssignments, '')
})