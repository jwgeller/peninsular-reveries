import { announce } from '../../client/game-accessibility.js'
import { getPadNames } from './sounds.js'
import { TEMPO_LABELS, BANK_LABELS } from './types.js'
import type { BeatPadMode, PadId, TempoPreset, BeatPadBankId } from './types.js'

const PAD_REPEAT_DEBOUNCE_MS = 200

let lastPadId: PadId | null = null
let lastPadAnnounceAt = 0

let currentBank: BeatPadBankId = 'kit'

export function setAccessibilityBank(bank: BeatPadBankId): void {
  currentBank = bank
}

export function announcePadHit(padId: PadId): void {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  if (lastPadId === padId && now - lastPadAnnounceAt < PAD_REPEAT_DEBOUNCE_MS) {
    lastPadAnnounceAt = now
    return
  }
  lastPadId = padId
  lastPadAnnounceAt = now
  const names = getPadNames(currentBank)
  const name = names[padId]
  if (name) announce(name, 'polite')
}

export function announceModeChange(mode: BeatPadMode): void {
  switch (mode) {
    case 'recording':
      announce('Recording started', 'assertive')
      return
    case 'playing':
      announce('Recording stopped, playing loop', 'assertive')
      return
    case 'free':
      announce('Playback stopped', 'assertive')
      return
  }
}

export function announceLoopCleared(): void {
  announce('Loop cleared', 'assertive')
}

export function announceTempoChange(tempo: TempoPreset): void {
  announce(`Tempo: ${TEMPO_LABELS[tempo]}`, 'polite')
}

export function announceLayerChange(layerCount: number, maxLayers: number): void {
  if (layerCount >= maxLayers) {
    announce('All layers full', 'polite')
    return
  }
  announce(`Layer ${layerCount} of ${maxLayers}`, 'polite')
}

export function announceBankChange(bank: BeatPadBankId): void {
  announce(`Bank: ${BANK_LABELS[bank]}`, 'assertive')
}