import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = '4173'
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = {
  ...process.env,
  SITE_BASE_PATH: '',
  SITE_ORIGIN: `http://127.0.0.1:${PORT}`,
}

function run(command, args, onExit) {
  const shellCommand = [command, ...args].join(' ')

  const child = spawn(shellCommand, {
    cwd: repoRoot,
    env,
    shell: true,
    stdio: 'inherit',
  })

  child.on('exit', (code) => {
    onExit(code ?? 0)
  })

  child.on('error', (error) => {
    console.error(error)
    process.exit(1)
  })

  return child
}

run('pnpm', ['build'], (code) => {
  if (code !== 0) {
    process.exit(code)
  }

  const serve = run('pnpm', ['exec', 'serve', 'dist', '-l', PORT], (serveCode) => {
    process.exit(serveCode)
  })

  const shutdown = () => {
    serve.kill('SIGTERM')
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
})