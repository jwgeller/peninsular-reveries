import {
  LOOP_BARS,
  MAX_LAYERS,
  TEMPO_BPM,
  type LoopEvent,
  type DrumPadState,
  type PadId,
  type TempoPreset,
} from './types.js'

export function createInitialState(): DrumPadState {
  return {
    mode: 'free',
    tempo: 'medium',
    layers: [],
    activeLayer: 0,
    loopStartTime: 0,
    recordStartTime: 0,
    currentEvents: [],
  }
}

export function getLoopDurationMs(tempo: TempoPreset): number {
  return (LOOP_BARS * 4 * 60_000) / TEMPO_BPM[tempo]
}

export interface TriggerPadResult {
  readonly state: DrumPadState
  readonly event?: LoopEvent
}

export function triggerPad(
  state: DrumPadState,
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

export function startRecording(state: DrumPadState, currentTime: number): DrumPadState {
  return {
    ...state,
    mode: 'recording',
    recordStartTime: currentTime,
    currentEvents: [],
  }
}

export function stopRecording(state: DrumPadState): DrumPadState {
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

export function togglePlayback(state: DrumPadState): DrumPadState {
  if (state.mode === 'playing') {
    return { ...state, mode: 'free' }
  }
  if (state.mode === 'free' && state.layers.length > 0) {
    return { ...state, mode: 'playing' }
  }
  return state
}

export function clearLoop(state: DrumPadState): DrumPadState {
  return {
    ...state,
    mode: 'free',
    layers: [],
    activeLayer: 0,
    currentEvents: [],
  }
}

export function cycleTempo(state: DrumPadState): DrumPadState {
  const order: TempoPreset[] = ['slow', 'medium', 'fast']
  const next = order[(order.indexOf(state.tempo) + 1) % order.length]
  return { ...state, tempo: next }
}

export function canRecord(state: DrumPadState): boolean {
  return state.layers.length < MAX_LAYERS && state.mode !== 'recording'
}

export function getLoopPositionMs(state: DrumPadState, currentTime: number): number {
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