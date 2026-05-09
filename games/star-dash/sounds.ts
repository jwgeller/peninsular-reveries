import { getGameAudioBuses } from '../../client/game-audio.js'
let globalMuted = false
function getCtx(): AudioContext | null { try { return getGameAudioBuses('star-dash').ctx } catch { return null } }
function getSfxBus(): GainNode { return getGameAudioBuses('star-dash').sfx }
function createEnvelope(ctx: AudioContext, start: number, dur: number, vol: number, attack = 0.01, release = 0.2): GainNode {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, start)
  g.gain.linearRampToValueAtTime(vol, start + Math.max(attack, 0.008))
  g.gain.exponentialRampToValueAtTime(Math.max(vol * 0.82, 0.0002), start + dur - Math.max(release, 0.04))
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  return g
}
function playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.1, delay = 0): void {
  if (globalMuted) return; const ctx = getCtx(); if (!ctx) return
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator(); osc.type = type; osc.frequency.setValueAtTime(freq, start)
  osc.connect(createEnvelope(ctx, start, dur, vol)); osc.start(start); osc.stop(start + dur + 0.05)
}
export function sfxCatch(): void {
  // Bright star catch chime
  playTone(880, 0.1, 'sine', 0.1)
  playTone(1100, 0.08, 'sine', 0.08, 0.04)
  playTone(1320, 0.12, 'sine', 0.06, 0.08)
}
export function sfxMiss(): void {
  // Sad miss
  playTone(220, 0.2, 'sine', 0.06)
}
export function sfxSpawn(): void {
  playTone(440, 0.08, 'triangle', 0.04)
}
let ambOsc: OscillatorNode[] | null = null; let ambGain: GainNode | null = null
export function startAmbience(): void {
  if (globalMuted) return; const ctx = getCtx(); if (!ctx) return; stopAmbience()
  ambGain = ctx.createGain(); ambGain.gain.setValueAtTime(0.0001, ctx.currentTime)
  ambGain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 2); ambGain.connect(getSfxBus())
  ambOsc = [165, 220, 330].map(f => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime); o.connect(ambGain!); o.start(); return o })
}
export function stopAmbience(): void {
  if (ambOsc) { for (const o of ambOsc) try { o.stop() } catch {} ambOsc = null }
  if (ambGain) { try { ambGain.disconnect() } catch {} ambGain = null }
}
export function setMuted(m: boolean): void { globalMuted = m; if (m) stopAmbience() }