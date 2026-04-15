// ── Waterwall Audio System (Web Audio API — no external files) ────────────────

import {
  createMusicBus,
  createSfxBus,
  ensureAudioUnlocked,
  fadeBusGain,
  getAudioContext,
  playNotes,
  syncBusWithVisibility,
  type NoteSequence,
} from '../../client/audio.js'
import { getMusicEnabled, getSfxEnabled } from '../../client/preferences.js'

export { ensureAudioUnlocked }

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WaterwallMusicEvent {
  readonly startStep: number
  readonly durationSteps: number
  readonly frequency: number
  readonly gain: number
  readonly type: OscillatorType
}

export interface WaterwallMusicProfile {
  readonly id: string
  readonly label: string
  readonly tempoBpm: number
  readonly stepsPerBeat: number
  readonly loopBeats: number
  readonly events: readonly WaterwallMusicEvent[]
}

export type CursorEdge = 'left' | 'right' | 'top' | 'bottom'

// ── Edge cue pan mapping ──────────────────────────────────────────────────────

export const EDGE_CUE_PAN: Record<CursorEdge, number> = {
  left: -1,
  right: 1,
  top: 0,
  bottom: 0,
}

export const EDGE_CUE_FREQUENCY: Record<CursorEdge, number> = {
  left: 400,
  right: 400,
  top: 600,
  bottom: 200,
}

// ── Music profile ─────────────────────────────────────────────────────────────

export const waterwallAmbientProfile: WaterwallMusicProfile = {
  id: 'waterwall-ambient',
  label: 'Ambient',
  tempoBpm: 40,
  stepsPerBeat: 1,
  loopBeats: 8,
  events: [
    { startStep: 0, durationSteps: 3, frequency: 65, gain: 0.04, type: 'triangle' },
    { startStep: 1, durationSteps: 4, frequency: 98, gain: 0.03, type: 'sine' },
    { startStep: 3, durationSteps: 3, frequency: 130, gain: 0.035, type: 'triangle' },
    { startStep: 4, durationSteps: 4, frequency: 65, gain: 0.04, type: 'sine' },
    { startStep: 6, durationSteps: 2, frequency: 98, gain: 0.03, type: 'triangle' },
    { startStep: 7, durationSteps: 3, frequency: 130, gain: 0.035, type: 'sine' },
  ],
} as const

// ── Bus management ────────────────────────────────────────────────────────────

let musicBus: GainNode | null = null
let sfxBus: GainNode | null = null
let visibilitySynced = false

function getMusicBusNode(): GainNode {
  musicBus ??= createMusicBus('waterwall')

  if (!visibilitySynced) {
    syncBusWithVisibility(musicBus, 'waterwall', 'music')
    visibilitySynced = true
  }

  return musicBus
}

function getSfxBusNode(): GainNode {
  if (!sfxBus) {
    sfxBus = createSfxBus('waterwall')
    syncBusWithVisibility(sfxBus, 'waterwall', 'sfx')
  }
  return sfxBus
}

// ── Music scheduling ──────────────────────────────────────────────────────────

let musicLoopTimer: number | null = null
let musicRequested = false

function stepDurationSeconds(profile: WaterwallMusicProfile): number {
  return 60 / profile.tempoBpm / profile.stepsPerBeat
}

export function profileLoopDurationMs(profile: WaterwallMusicProfile): number {
  return profile.loopBeats * (60 / profile.tempoBpm) * 1000
}

function toNoteSequence(profile: WaterwallMusicProfile): NoteSequence {
  const secondsPerStep = stepDurationSeconds(profile)
  return profile.events.map((event) => ({
    frequency: event.frequency,
    gain: event.gain,
    type: event.type,
    startOffset: event.startStep * secondsPerStep,
    duration: Math.max(event.durationSteps * secondsPerStep, 0.08),
    attackTime: 0.3,
    releaseTime: 0.4,
  }))
}

function clearMusicLoop(): void {
  if (musicLoopTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(musicLoopTimer)
  }
  musicLoopTimer = null
}

function scheduleProfile(): void {
  playNotes(getMusicBusNode(), toNoteSequence(waterwallAmbientProfile))
}

function syncMusicRequest(): void {
  if (!musicRequested || !getMusicEnabled('waterwall') || typeof window === 'undefined') {
    clearMusicLoop()
    return
  }

  clearMusicLoop()
  scheduleProfile()
  musicLoopTimer = window.setInterval(
    () => scheduleProfile(),
    profileLoopDurationMs(waterwallAmbientProfile),
  )
}

export function startAmbientMusic(): void {
  musicRequested = true
  syncMusicRequest()
}

export function stopAmbientMusic(): void {
  musicRequested = false
  clearMusicLoop()
}

// ── Water texture (filtered noise loop) ───────────────────────────────────────

let noiseSource: AudioBufferSourceNode | null = null
let noiseGain: GainNode | null = null
let noisePanner: StereoPannerNode | null = null
let noiseRunning = false

export function createWaterTexture(): void {
  if (noiseSource) return

  try {
    const context = getAudioContext()
    const bus = getSfxBusNode()

    const sampleRate = context.sampleRate
    const bufferLength = Math.ceil(sampleRate * 2)
    const buffer = context.createBuffer(1, bufferLength, sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < bufferLength; i++) {
      channel[i] = Math.random() * 2 - 1
    }

    const source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 1.5

    const panner = context.createStereoPanner()
    panner.pan.value = 0

    const gain = context.createGain()
    gain.gain.value = 0.0001

    source.connect(filter)
    filter.connect(panner)
    panner.connect(gain)
    gain.connect(bus)

    source.start()

    noiseSource = source
    noiseGain = gain
    noisePanner = panner
  } catch {
    // Audio is non-critical.
  }
}

export function startWaterTexture(): void {
  if (!getSfxEnabled('waterwall')) return

  try {
    createWaterTexture()
    if (noiseGain) {
      fadeBusGain(noiseGain, 0.06, 300)
    }
    noiseRunning = true
  } catch {
    // Audio is non-critical.
  }
}

export function stopWaterTexture(): void {
  noiseRunning = false
  try {
    if (noiseGain) {
      fadeBusGain(noiseGain, 0.0001, 300)
    }
  } catch {
    // Audio is non-critical.
  }
}

export function updateWaterPanning(pan: number): void {
  if (!noisePanner) return

  try {
    const context = getAudioContext()
    const clamped = Math.max(-1, Math.min(1, pan))
    const now = context.currentTime
    noisePanner.pan.cancelScheduledValues(now)
    noisePanner.pan.setValueAtTime(noisePanner.pan.value, now)
    noisePanner.pan.linearRampToValueAtTime(clamped, now + 0.05)
  } catch {
    // Audio is non-critical.
  }
}

// ── Cursor edge cues ──────────────────────────────────────────────────────────

let lastEdgeCue: CursorEdge | null = null

export function playCursorEdgeCue(edge: CursorEdge): void {
  if (!getSfxEnabled('waterwall')) return
  if (edge === lastEdgeCue) return

  lastEdgeCue = edge

  try {
    const context = getAudioContext()
    const bus = getSfxBusNode()
    const now = context.currentTime

    const osc = context.createOscillator()
    const envGain = context.createGain()
    const panner = context.createStereoPanner()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(EDGE_CUE_FREQUENCY[edge], now)

    panner.pan.setValueAtTime(EDGE_CUE_PAN[edge], now)

    envGain.gain.setValueAtTime(0.0001, now)
    envGain.gain.linearRampToValueAtTime(0.03, now + 0.005)
    envGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)

    osc.connect(panner)
    panner.connect(envGain)
    envGain.connect(bus)

    osc.start(now)
    osc.stop(now + 0.08)
  } catch {
    // Audio is non-critical.
  }
}

export function resetEdgeCue(): void {
  lastEdgeCue = null
}

// ── Barrier SFX ───────────────────────────────────────────────────────────────

export function playBarrierPlaceSound(): void {
  if (!getSfxEnabled('waterwall')) return

  try {
    const context = getAudioContext()
    const bus = getSfxBusNode()
    const now = context.currentTime

    const bufferSize = Math.ceil(context.sampleRate * 0.04)
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      channel[i] = Math.random() * 2 - 1
    }

    const source = context.createBufferSource()
    source.buffer = buffer

    const filter = context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2000

    const gain = context.createGain()
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(bus)

    source.start(now)
    source.stop(now + 0.04)
  } catch {
    // Audio is non-critical.
  }
}

export function playBarrierRemoveSound(): void {
  if (!getSfxEnabled('waterwall')) return

  try {
    const context = getAudioContext()
    const bus = getSfxBusNode()
    const now = context.currentTime

    const bufferSize = Math.ceil(context.sampleRate * 0.06)
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      channel[i] = Math.random() * 2 - 1
    }

    const source = context.createBufferSource()
    source.buffer = buffer

    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1500

    const gain = context.createGain()
    // Slow attack, fast release
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.06, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(bus)

    source.start(now)
    source.stop(now + 0.06)
  } catch {
    // Audio is non-critical.
  }
}

// ── Preference sync ───────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('reveries:music-change', (event) => {
    const detail = (event as CustomEvent<{ gameSlug: string; enabled: boolean }>).detail
    if (detail.gameSlug === 'waterwall') {
      syncMusicRequest()
    }
  })

  window.addEventListener('reveries:sfx-change', (event) => {
    const detail = (event as CustomEvent<{ gameSlug: string; enabled: boolean }>).detail
    if (detail.gameSlug === 'waterwall') {
      if (!detail.enabled) {
        stopWaterTexture()
      } else if (noiseRunning || noiseSource) {
        startWaterTexture()
      }
    }
  })
}
