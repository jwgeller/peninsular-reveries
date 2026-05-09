import { getGameAudioBuses } from '../../client/game-audio.js'
let globalMuted = false
function getCtx(): AudioContext | null { try { return getGameAudioBuses('leaf-swirl').ctx } catch { return null } }
function getSfxBus(): GainNode { return getGameAudioBuses('leaf-swirl').sfx }
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
function playNoise(dur: number, vol = 0.1, freq = 800): void {
  if (globalMuted) return; const ctx = getCtx(); if (!ctx) return
  const sz = ctx.sampleRate * dur; const buf = ctx.createBuffer(1, sz, ctx.sampleRate); const data = buf.getChannelData(0)
  for (let i = 0; i < sz; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource(); src.buffer = buf
  const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = freq
  const g = createEnvelope(ctx, ctx.currentTime, dur, vol, 0.02, 0.15)
  src.connect(flt); flt.connect(g); g.connect(getSfxBus()); src.start()
}
export function sfxSwirl(): void { playTone(260, 0.15, 'sine', 0.06); playTone(390, 0.1, 'sine', 0.04, 0.05); playNoise(0.1, 0.04, 1200) }
export function sfxLeafLand(): void { playTone(180, 0.08, 'triangle', 0.04); playNoise(0.05, 0.03, 600) }
let ambOsc: OscillatorNode[] | null = null; let ambGain: GainNode | null = null
export function startAmbience(): void {
  if (globalMuted) return; const ctx = getCtx(); if (!ctx) return; stopAmbience()
  ambGain = ctx.createGain(); ambGain.gain.setValueAtTime(0.0001, ctx.currentTime)
  ambGain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 2); ambGain.connect(getSfxBus())
  ambOsc = [98, 147, 196].map(f => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime); o.connect(ambGain!); o.start(); return o })
}
export function stopAmbience(): void {
  if (ambOsc) { for (const o of ambOsc) try { o.stop() } catch {} ambOsc = null }
  if (ambGain) { try { ambGain.disconnect() } catch {} ambGain = null }
}
export function setMuted(m: boolean): void { globalMuted = m; if (m) stopAmbience() }