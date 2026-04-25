import {
  getBundledBeatPadSamples,
  beatPadSampleManifest,
  type BeatPadSampleDefinition,
  type BeatPadSampleId,
} from './sample-manifest.js'
import type { BeatPadBankId, PadId } from './types.js'
import { ensureAudioUnlocked as baseEnsureAudioUnlocked, resolveAssetUrl } from '../../client/audio.js'
import { getGameAudioBuses } from '../../client/game-audio.js'

let sampleLoadPromise: Promise<void> | null = null

const decodedSamples = new Map<BeatPadSampleId, AudioBuffer>()
const failedSamples = new Set<BeatPadSampleId>()

const KIT_SAMPLE_IDS: readonly BeatPadSampleId[] = [
  'drum-kick',
  'drum-snare',
  'drum-hihat-closed',
  'drum-hihat-open',
  'drum-clap',
  'drum-rimshot',
  'drum-tom',
  'drum-cymbal',
]

const BASS_SAMPLE_IDS: readonly BeatPadSampleId[] = [
  'bass-sub-hit',
  'bass-drone',
  'bass-saw-buzz',
  'bass-tonal-hit',
  'bass-chord-stab',
  'bass-filter-sweep',
  'bass-808',
  'bass-wobble',
]

const KIT_NAMES: readonly string[] = [
  'Kick',
  'Snare',
  'Hi-Hat',
  'Open Hat',
  'Clap',
  'Rim',
  'Tom',
  'Cymbal',
]

const BASS_NAMES: readonly string[] = [
  'Sub Bass',
  'Drone',
  'Saw Buzz',
  'Tonal Hit',
  'Chord Stab',
  'Sweep',
  '808',
  'Wobble',
]

export function getPadNames(bank: BeatPadBankId): readonly string[] {
  return bank === 'bass' ? BASS_NAMES : KIT_NAMES
}

export const PAD_NAMES: readonly string[] = KIT_NAMES

export function padIdToSampleId(padId: PadId, bank: BeatPadBankId): BeatPadSampleId {
  const ids = bank === 'bass' ? BASS_SAMPLE_IDS : KIT_SAMPLE_IDS
  return ids[padId]
}

/** Maximum play duration for looped/drone samples (ms). */
const DRONE_MAX_DURATION_MS = 3000

/** Release time for drone samples (seconds). */
const DRONE_RELEASE_SECONDS = 0.3

function getCtx(): AudioContext | null {
  try {
    return getGameAudioBuses('beat-pad').ctx
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('beat-pad').sfx
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

function createDroneEnvelope(
  context: AudioContext,
  startTime: number,
  volume: number,
  durationSeconds: number,
): GainNode {
  const attack = 0.05
  const release = DRONE_RELEASE_SECONDS
  const sustainEnd = startTime + durationSeconds - release

  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + attack)
  gain.gain.setValueAtTime(volume, startTime + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, sustainEnd > startTime + attack ? sustainEnd : startTime + attack + 0.01)

  return gain
}

async function decodeSample(sample: BeatPadSampleDefinition): Promise<void> {
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

function getBankSampleIds(bank: BeatPadBankId): readonly BeatPadSampleId[] {
  return bank === 'bass' ? BASS_SAMPLE_IDS : KIT_SAMPLE_IDS
}

export function preloadBeatPadSamples(bank?: BeatPadBankId): Promise<void> {
  const context = getCtx()
  if (!context) return Promise.resolve()
  if (sampleLoadPromise) return sampleLoadPromise

  const banks = bank ? [bank] : (['kit', 'bass'] as BeatPadBankId[])
  const idsToLoad: BeatPadSampleId[] = []
  for (const b of banks) {
    for (const id of getBankSampleIds(b)) {
      if (!decodedSamples.has(id) && !failedSamples.has(id)) {
        idsToLoad.push(id)
      }
    }
  }

  const bundled = getBundledBeatPadSamples()
  const samplesToLoad = idsToLoad.length > 0
    ? idsToLoad.map((id) => beatPadSampleManifest[id]).filter((s): s is BeatPadSampleDefinition => !!s)
    : bundled.filter((s) => !decodedSamples.has(s.id) && !failedSamples.has(s.id))

  if (samplesToLoad.length === 0) {
    return Promise.resolve()
  }

  sampleLoadPromise = Promise.all(
    samplesToLoad.map((sample) => decodeSample(sample)),
  )
    .then(() => undefined)
    .finally(() => {
      sampleLoadPromise = null
    })

  return sampleLoadPromise
}

function playSample(
  sampleId: BeatPadSampleId,
): { startTime: number; duration: number } | null {
  const context = getCtx()
  const sample = beatPadSampleManifest[sampleId]
  const buffer = decodedSamples.get(sampleId)

  if (!context || !sample) return null
  if (!buffer) {
    void decodeSample(sample)
    return null
  }

  const startTime = context.currentTime
  const isLooped = sample.loop
  const source = context.createBufferSource()
  source.buffer = buffer

  const sfxBus = getSfxBusNode()

  if (isLooped) {
    // Drone/sustained samples: loop with finite play duration and longer release
    source.loop = true
    const durationSeconds = Math.min(buffer.duration, DRONE_MAX_DURATION_MS / 1000)
    const gain = createDroneEnvelope(context, startTime, sample.gain, durationSeconds + DRONE_RELEASE_SECONDS)

    source.connect(gain)
    gain.connect(sfxBus)

    source.start(startTime)
    source.stop(startTime + durationSeconds + DRONE_RELEASE_SECONDS)

    return { startTime, duration: durationSeconds * 1000 }
  }

  // One-shot samples: standard envelope
  const duration = buffer.duration
  const gain = createEnvelope(
    context,
    startTime,
    duration,
    sample.gain,
  )

  source.connect(gain)
  gain.connect(sfxBus)

  source.start(startTime)
  source.stop(startTime + duration)

  return { startTime, duration }
}

export function playBeatPadSample(sampleId: BeatPadSampleId): boolean {
  const result = playSample(sampleId)
  if (!result) {
    void preloadBeatPadSamples()
    return false
  }
  return true
}

export function ensureBeatPadAudioUnlocked(): void {
  baseEnsureAudioUnlocked()
  void preloadBeatPadSamples()
}