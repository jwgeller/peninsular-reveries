import {
  LOOP_BARS,
  MAX_LAYERS,
  TEMPO_BPM,
  type LoopEvent,
  type BeatPadState,
  type PadId,
  type TempoPreset,
  type BeatPadBankId,
} from './types.js'

export function createInitialState(): BeatPadState {
  return {
    mode: 'free',
    tempo: 'medium',
    layers: [],
    activeLayer: 0,
    loopStartTime: 0,
    recordStartTime: 0,
    currentEvents: [],
    activeBank: 'kit',
  }
}

export function getLoopDurationMs(tempo: TempoPreset): number {
  return (LOOP_BARS * 4 * 60_000) / TEMPO_BPM[tempo]
}

export interface TriggerPadResult {
  readonly state: BeatPadState
  readonly event?: LoopEvent
}

export function triggerPad(
  state: BeatPadState,
  padId: PadId,
  currentTime: number,
): TriggerPadResult {
  if (state.mode !== 'recording') {
    return { state }
  }
  const event: LoopEvent = {
    padId,
    timeOffset: currentTime - state.recordStartTime,
  }
  return {
    state: {
      ...state,
      currentEvents: [...state.currentEvents, event],
    },
    event,
  }
}

export function startRecording(state: BeatPadState, currentTime: number): BeatPadState {
  return {
    ...state,
    mode: 'recording',
    recordStartTime: currentTime,
    currentEvents: [],
  }
}

export function stopRecording(state: BeatPadState): BeatPadState {
  if (state.layers.length >= MAX_LAYERS) {
    return {
      ...state,
      mode: 'playing',
      currentEvents: [],
    }
  }
  const layers = [...state.layers, state.currentEvents]
  return {
    ...state,
    mode: 'playing',
    layers,
    activeLayer: layers.length,
    currentEvents: [],
  }
}

export function togglePlayback(state: BeatPadState): BeatPadState {
  if (state.mode === 'playing') {
    return { ...state, mode: 'free' }
  }
  if (state.mode === 'free' && state.layers.length > 0) {
    return { ...state, mode: 'playing' }
  }
  return state
}

export function clearLoop(state: BeatPadState): BeatPadState {
  return {
    ...state,
    mode: 'free',
    layers: [],
    activeLayer: 0,
    currentEvents: [],
  }
}

export function cycleTempo(state: BeatPadState): BeatPadState {
  const order: TempoPreset[] = ['slow', 'medium', 'fast']
  const next = order[(order.indexOf(state.tempo) + 1) % order.length]
  return { ...state, tempo: next }
}

export function canRecord(state: BeatPadState): boolean {
  return state.layers.length < MAX_LAYERS && state.mode !== 'recording'
}

export function cycleBank(state: BeatPadState): BeatPadState {
  const banks: BeatPadBankId[] = ['kit', 'bass']
  const next = banks[(banks.indexOf(state.activeBank) + 1) % banks.length]
  return { ...state, activeBank: next }
}

export function getLoopPositionMs(state: BeatPadState, currentTime: number): number {
  const duration = getLoopDurationMs(state.tempo)
  if (duration <= 0) return 0
  const elapsed = currentTime - state.loopStartTime
  return ((elapsed % duration) + duration) % duration
}

export function getEventsInWindow(
  layers: readonly (readonly LoopEvent[])[],
  startMs: number,
  endMs: number,
  loopDuration: number,
): LoopEvent[] {
  const result: LoopEvent[] = []
  if (loopDuration <= 0 || endMs <= startMs) return result
  const wraps = endMs > loopDuration
  const wrapEnd = wraps ? endMs - loopDuration : 0
  for (const layer of layers) {
    for (const event of layer) {
      const offset = event.timeOffset
      if (wraps) {
        if (offset >= startMs || offset < wrapEnd) result.push(event)
      } else if (offset >= startMs && offset < endMs) {
        result.push(event)
      }
    }
  }
  return result
}