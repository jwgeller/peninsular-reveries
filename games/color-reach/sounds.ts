import { getGameAudioBuses } from '../../client/game-audio.js'

let globalMuted = false

function getCtx(): AudioContext | null {
  try { return getGameAudioBuses('color-reach').ctx } catch { return null }
}
function getSfxBus(): GainNode {
  return getGameAudioBuses('color-reach').sfx
}

function createEnvelope(ctx: AudioContext, start: number, dur: number, vol: number, attack = 0.01, release = 0.2): GainNode {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, start)
  g.gain.linearRampToValueAtTime(vol, start + Math.max(attack, 0.008))
  g.gain.exponentialRampToValueAtTime(Math.max(vol * 0.82, 0.0002), start + dur - Math.max(release, 0.04))
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  return g
}

function playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.1, delay = 0): void {
  if (globalMuted) return
  const ctx = getCtx(); if (!ctx) return
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  osc.type = type; osc.frequency.setValueAtTime(freq, start)
  osc.connect(createEnvelope(ctx, start, dur, vol))
  osc.start(start); osc.stop(start + dur + 0.05)
}

export function sfxReach(): void {
  // Bright chime — reaching the target
  playTone(523, 0.12, 'sine', 0.1)
  playTone(659, 0.1, 'sine', 0.08, 0.06)
  playTone(784, 0.15, 'sine', 0.07, 0.12)
}

export function sfxSpawn(): void {
  // Gentle target appear
  playTone(262, 0.15, 'triangle', 0.05)
}

let ambienceOsc: OscillatorNode[] | null = null
let ambienceGain: GainNode | null = null

export function startAmbience(): void {
  if (globalMuted) return
  const ctx = getCtx(); if (!ctx) return
  stopAmbience()
  ambienceGain = ctx.createGain()
  ambienceGain.gain.setValueAtTime(0.0001, ctx.currentTime)
  ambienceGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 2)
  ambienceGain.connect(getSfxBus())
  ambienceOsc = [196, 262, 330].map(f => {
    const o = ctx.createOscillator()
    o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime)
    o.connect(ambienceGain!); o.start(); return o
  })
}

export function stopAmbience(): void {
  if (ambienceOsc) { for (const o of ambienceOsc) try { o.stop() } catch {} ambienceOsc = null }
  if (ambienceGain) { try { ambienceGain.disconnect() } catch {} ambienceGain = null }
}

export function setMuted(m: boolean): void { globalMuted = m; if (m) stopAmbience() }