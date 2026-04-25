#!/usr/bin/env tsx
// scripts/audio-loudness-probe.ts
//
// Audio loudness probe: decodes each .ogg sample for a game, applies the
// SFX bus processing chain (GainNode 0.12 → DynamicsCompressorNode), and
// reports post-chain peak / RMS levels. Any sample whose post-chain peak
// falls below −18 dB is flagged FAIL.
//
// Usage:
//   pnpm exec tsx scripts/audio-loudness-probe.ts --game train-sounds
//   pnpm exec tsx scripts/audio-loudness-probe.ts --all
//
// Exit code 0 if every sample passes, 1 if any sample fails.

import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
// ── SFX bus chain parameters (mirrors client/audio.ts createSfxBus) ───────────

const SFX_BUS_GAIN = 0.12
const COMPRESSOR_THRESHOLD_DB = -18
const COMPRESSOR_KNEE_DB = 10
const COMPRESSOR_RATIO = 6
const COMPRESSOR_ATTACK_SEC = 0.005
const COMPRESSOR_RELEASE_SEC = 0.1
const PASS_THRESHOLD_DB = -18

// ── Common sample shape every game manifest shares ───────────────────────────

interface ProbeSampleDefinition {
  readonly id: string
  readonly url: string
  readonly fileName: string
  readonly gain: number
  readonly loop: boolean
  readonly bundled: boolean
}

// ── Game registry ────────────────────────────────────────────────────────────

function slugToCamel(slug: string): string {
  return slug.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())
}

interface GameManifestInfo {
  readonly modulePath: string
  readonly exportName: string
}

function getGameManifestInfo(slug: string): GameManifestInfo {
  const camel = slugToCamel(slug)
  return {
    modulePath: `../games/${slug}/sample-manifest.ts`,
    exportName: `${camel}SampleManifest`,
  }
}

// ── Arg parsing ──────────────────────────────────────────────────────────────

interface CliOptions {
  gameSlug: string | null
  all: boolean
}

function parseArgs(argv: readonly string[]): CliOptions {
  let gameSlug: string | null = null
  let all = false

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--all') {
      all = true
    } else if (arg === '--game') {
      gameSlug = argv[i + 1] ?? null
      i += 1
    } else if (arg.startsWith('--game=')) {
      gameSlug = arg.slice('--game='.length)
    }
  }

  return { gameSlug, all }
}

// ── Discover game slugs with sample manifests ────────────────────────────────

import { readdirSync } from 'node:fs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const gamesDir = resolve(repoRoot, 'games')

function discoverGameSlugs(): string[] {
  try {
    const entries = readdirSync(gamesDir, { withFileTypes: true })
    return entries
      .filter((e) => e.isDirectory())
      .filter((e) => existsSync(resolve(gamesDir, e.name, 'sample-manifest.ts')))
      .map((e) => e.name)
      .sort()
  } catch {
    return []
  }
}

// ── OGG decoding via ffmpeg → Float32Array ────────────────────────────────────

function decodeOggToPcm(filePath: string): Float32Array {
  const buf = execFileSync('ffmpeg', [
    '-i', filePath,
    '-ar', '48000',
    '-ac', '1',
    '-f', 'f32le',
    '-loglevel', 'error',
    'pipe:1',
  ])
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
}

// ── Gain application ──────────────────────────────────────────────────────────

function applyGain(samples: Float32Array, gain: number): Float32Array {
  const out = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i += 1) {
    out[i] = samples[i] * gain
  }
  return out
}

// ── Dynamics compressor (Web Audio API DynamicsCompressorNode model) ─────────

function computeGainReductionDb(
  inputDb: number,
  thresholdDb: number,
  kneeDb: number,
  ratio: number,
): number {
  const halfKnee = kneeDb / 2
  if (inputDb < thresholdDb - halfKnee) {
    return 0
  }
  if (inputDb > thresholdDb + halfKnee) {
    return (inputDb - thresholdDb) * (1 - 1 / ratio)
  }
  // Quadratic soft-knee interpolation
  const x = inputDb - thresholdDb + halfKnee
  return (x * x) / (2 * kneeDb) * (1 - 1 / ratio)
}

function applyCompressor(samples: Float32Array, sampleRate: number): Float32Array {
  const attackCoeff = 1 - Math.exp(-1 / (COMPRESSOR_ATTACK_SEC * sampleRate))
  const releaseCoeff = 1 - Math.exp(-1 / (COMPRESSOR_RELEASE_SEC * sampleRate))

  let smoothedGainReductionDb = 0
  const out = new Float32Array(samples.length)

  for (let i = 0; i < samples.length; i += 1) {
    const inputAbs = Math.abs(samples[i])
    const inputDb = 20 * Math.log10(Math.max(inputAbs, 1e-10))

    const targetGainReduction = computeGainReductionDb(
      inputDb,
      COMPRESSOR_THRESHOLD_DB,
      COMPRESSOR_KNEE_DB,
      COMPRESSOR_RATIO,
    )

    // Smooth gain reduction: attack when reducing gain more, release when reducing less
    if (targetGainReduction > smoothedGainReductionDb) {
      smoothedGainReductionDb += attackCoeff * (targetGainReduction - smoothedGainReductionDb)
    } else {
      smoothedGainReductionDb += releaseCoeff * (targetGainReduction - smoothedGainReductionDb)
    }

    const gainLin = Math.pow(10, -smoothedGainReductionDb / 20)
    out[i] = samples[i] * gainLin
  }

  return out
}

// ── Level measurement ─────────────────────────────────────────────────────────

interface LevelMeasurement {
  readonly peakDb: number
  readonly rmsDb: number
}

function measureLevels(samples: Float32Array): LevelMeasurement {
  let peak = 0
  let sumSq = 0

  for (let i = 0; i < samples.length; i += 1) {
    const abs = Math.abs(samples[i])
    if (abs > peak) peak = abs
    sumSq += samples[i] * samples[i]
  }

  const peakDb = 20 * Math.log10(Math.max(peak, 1e-10))
  const rms = Math.sqrt(sumSq / Math.max(samples.length, 1))
  const rmsDb = 20 * Math.log10(Math.max(rms, 1e-10))

  return { peakDb, rmsDb }
}

// ── Single sample probe ──────────────────────────────────────────────────────

interface SampleProbeResult {
  readonly sampleId: string
  readonly gain: number
  readonly postChainPeakDb: number
  readonly postChainRmsDb: number
  readonly pass: boolean
}

function probeSample(oggPath: string, sample: ProbeSampleDefinition): SampleProbeResult {
  if (!existsSync(oggPath)) {
    return {
      sampleId: sample.id,
      gain: sample.gain,
      postChainPeakDb: -Infinity,
      postChainRmsDb: -Infinity,
      pass: false,
    }
  }

  const rawPcm = decodeOggToPcm(oggPath)

  // Chain: source → per-sample gain → SFX bus gain → compressor
  const combinedGain = sample.gain * SFX_BUS_GAIN
  const afterGain = applyGain(rawPcm, combinedGain)
  const afterCompressor = applyCompressor(afterGain, 48000)
  const levels = measureLevels(afterCompressor)

  return {
    sampleId: sample.id,
    gain: sample.gain,
    postChainPeakDb: levels.peakDb,
    postChainRmsDb: levels.rmsDb,
    pass: levels.peakDb >= PASS_THRESHOLD_DB,
  }
}

// ── Table output ─────────────────────────────────────────────────────────────

function formatDb(db: number): string {
  if (!Number.isFinite(db)) return '   -inf  '
  return db.toFixed(1).padStart(8)
}

function printProbeTable(results: SampleProbeResult[], gameSlug: string): void {
  console.log(`\nAudio loudness probe — ${gameSlug}`)
  console.log(`SFX bus: Gain(${SFX_BUS_GAIN}) → Compressor(threshold=${COMPRESSOR_THRESHOLD_DB}dB, knee=${COMPRESSOR_KNEE_DB}dB, ratio=${COMPRESSOR_RATIO}, attack=${COMPRESSOR_ATTACK_SEC}s, release=${COMPRESSOR_RELEASE_SEC}s)`)
  console.log(`Pass threshold: post-chain peak ≥ ${PASS_THRESHOLD_DB} dB\n`)

  const idWidth = Math.max(...results.map((r) => r.sampleId.length), 10)
  const header = [
    'Sample ID'.padEnd(idWidth),
    '  Gain',
    '  Peak(dB)',
    '  RMS(dB)',
    '  Flag',
  ].join('')
  console.log(header)
  console.log('-'.repeat(header.length))

  for (const r of results) {
    const flag = r.pass ? 'PASS' : 'FAIL'
    const line = [
      r.sampleId.padEnd(idWidth),
      r.gain.toFixed(1).padStart(6),
      formatDb(r.postChainPeakDb),
      formatDb(r.postChainRmsDb),
      `  ${flag}`,
    ].join('')
    console.log(line)
  }

  const passCount = results.filter((r) => r.pass).length
  console.log(`\n${passCount}/${results.length} samples PASS`)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function probeGame(gameSlug: string): Promise<boolean> {
  const info = getGameManifestInfo(gameSlug)
  const manifestPath = resolve(repoRoot, 'games', gameSlug, 'sample-manifest.ts')

  if (!existsSync(manifestPath)) {
    console.error(`No sample manifest found for game "${gameSlug}" at ${manifestPath}`)
    return false
  }

  let manifest: Record<string, ProbeSampleDefinition>
  try {
    const mod = await import(info.modulePath) as Record<string, unknown>
    manifest = mod[info.exportName] as Record<string, ProbeSampleDefinition>
    if (!manifest) {
      throw new Error(`Export "${info.exportName}" not found in ${info.modulePath}`)
    }
  } catch (err) {
    console.error(`Failed to import manifest for "${gameSlug}": ${err instanceof Error ? err.message : err}`)
    return false
  }

  const audioDir = resolve(repoRoot, 'public', gameSlug, 'audio')
  const samples = Object.values(manifest)
  const results: SampleProbeResult[] = []

  for (const sample of samples) {
    const oggPath = resolve(audioDir, sample.fileName)
    const result = probeSample(oggPath, sample)
    results.push(result)
  }

  printProbeTable(results, gameSlug)
  return results.every((r) => r.pass)
}

async function main(): Promise<void> {
  const { gameSlug, all } = parseArgs(process.argv.slice(2))

  let slugs: string[]
  if (all) {
    slugs = discoverGameSlugs()
    if (slugs.length === 0) {
      console.error('No games with sample manifests found.')
      process.exitCode = 1
      return
    }
    console.log(`Probing all games: ${slugs.join(', ')}`)
  } else if (gameSlug) {
    slugs = [gameSlug]
  } else {
    console.error('Usage: audio-loudness-probe --game <slug> | --all')
    process.exitCode = 1
    return
  }

  let allPass = true
  for (const slug of slugs) {
    const pass = await probeGame(slug)
    if (!pass) allPass = false
  }

  if (!allPass) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})