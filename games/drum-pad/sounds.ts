import {
  getBundledDrumPadSamples,
  drumPadSampleManifest,
  type DrumPadSampleDefinition,
  type DrumPadSampleId,
} from './sample-manifest.js'
import type { PadId } from './types.js'
import { ensureAudioUnlocked as baseEnsureAudioUnlocked, resolveAssetUrl } from '../../client/audio.js'
import { getGameAudioBuses } from '../../client/game-audio.js'

let sampleLoadPromise: Promise<void> | null = null

const decodedSamples = new Map<DrumPadSampleId, AudioBuffer>()
const failedSamples = new Set<DrumPadSampleId>()

export const PAD_NAMES: readonly string[] = [
  'Kick',
  'Snare',
  'Hi-Hat',
  'Open Hat',
  'Clap',
  'Rim',
  'Tom',
  'Cymbal',
]

const PAD_SAMPLE_IDS: readonly DrumPadSampleId[] = [
  'drum-kick',
  'drum-snare',
  'drum-hihat-closed',
  'drum-hihat-open',
  'drum-clap',
  'drum-rimshot',
  'drum-tom',
  'drum-cymbal',
]

export function padIdToSampleId(padId: PadId): DrumPadSampleId {
  return PAD_SAMPLE_IDS[padId]
}

function getCtx(): AudioContext | null {
  try {
    return getGameAudioBuses('drum-pad').ctx
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('drum-pad').sfx
}

function createEnvelope(
  context: AudioContext,
  startTime: number,
  duration: number,
  volume: number,
  attack: number = 0.005,
  release: number = Math.min(0.12, duration * 0.4),
): GainNode {
  const gain = context.createGain()
  const peakTime = startTime + Math.max(attack, 0.003)
  const releaseStart = Math.max(
    peakTime + 0.005,
    startTime + duration - Math.max(release, 0.02),
  )

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, peakTime)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(volume * 0.6, 0.0002),
    releaseStart,
  )
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  return gain
}

async function decodeSample(sample: DrumPadSampleDefinition): Promise<void> {
  const context = getCtx()
  if (!context || decodedSamples.has(sample.id) || failedSamples.has(sample.id)) return

  try {
    const response = await fetch(resolveAssetUrl(sample.url), { cache: 'force-cache' })
    if (!response.ok) {
      failedSamples.add(sample.id)
      return
    }

    const audioData = await response.arrayBuffer()
    const buffer = await context.decodeAudioData(audioData.slice(0))
    decodedSamples.set(sample.id, buffer)
  } catch {
    failedSamples.add(sample.id)
  }
}

export function preloadDrumPadSamples(): Promise<void> {
  const context = getCtx()
  if (!context) return Promise.resolve()
  if (sampleLoadPromise) return sampleLoadPromise

  const bundledSamples = getBundledDrumPadSamples().filter(
    (sample) => !decodedSamples.has(sample.id) && !failedSamples.has(sample.id),
  )
  if (bundledSamples.length === 0) {
    return Promise.resolve()
  }

  sampleLoadPromise = Promise.all(
    bundledSamples.map((sample) => decodeSample(sample)),
  )
    .then(() => undefined)
    .finally(() => {
      sampleLoadPromise = null
    })

  return sampleLoadPromise
}

function playSample(
  sampleId: DrumPadSampleId,
): { startTime: number; duration: number } | null {
  const context = getCtx()
  const sample = drumPadSampleManifest[sampleId]
  const buffer = decodedSamples.get(sampleId)

  if (!context || !sample) return null
  if (!buffer) {
    void decodeSample(sample)
    return null
  }

  const startTime = context.currentTime
  const duration = buffer.duration
  const source = context.createBufferSource()
  const gain = createEnvelope(
    context,
    startTime,
    duration,
    sample.gain,
  )

  source.buffer = buffer
  source.connect(gain)
  gain.connect(getSfxBusNode())

  source.start(startTime)
  source.stop(startTime + duration)

  return { startTime, duration }
}

export function playDrumPadSample(sampleId: DrumPadSampleId): boolean {
  const result = playSample(sampleId)
  if (!result) {
    void preloadDrumPadSamples()
    return false
  }
  return true
}

export function ensureDrumPadAudioUnlocked(): void {
  baseEnsureAudioUnlocked()
  void preloadDrumPadSamples()
}