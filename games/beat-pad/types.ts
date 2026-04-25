export type PadId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type BeatPadBankId = 'kit' | 'bass'

export type TempoPreset = 'slow' | 'medium' | 'fast'

export const TEMPO_BPM: Record<TempoPreset, number> = {
  slow: 80,
  medium: 110,
  fast: 140,
}

export const TEMPO_LABELS: Record<TempoPreset, string> = {
  slow: 'Slow',
  medium: 'Medium',
  fast: 'Fast',
}

export const LOOP_BARS = 2
export const MAX_LAYERS = 3

export const BANK_LABELS: Record<BeatPadBankId, string> = {
  kit: 'Kit',
  bass: 'Bass',
}

export interface LoopEvent {
  readonly padId: PadId
  /** ms from loop start */
  readonly timeOffset: number
}

export type BeatPadMode = 'free' | 'recording' | 'playing'

export interface BeatPadState {
  readonly mode: BeatPadMode
  readonly tempo: TempoPreset
  readonly layers: readonly (readonly LoopEvent[])[]
  readonly activeLayer: number
  readonly loopStartTime: number
  readonly recordStartTime: number
  readonly currentEvents: readonly LoopEvent[]
  readonly activeBank: BeatPadBankId
}