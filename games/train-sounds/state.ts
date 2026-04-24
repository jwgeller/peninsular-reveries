import { DEFAULT_TRAIN_PRESET_ID, TRAIN_PRESET_IDS, getTrainPresetDefinition } from './catalog.js'
import type { TrainHotspotId, TrainPresetDefinition, TrainPresetId, TrainDirection, TrainSoundsState } from './types.js'

function getPresetIndex(presetId: TrainPresetId): number {
  const presetIndex = TRAIN_PRESET_IDS.indexOf(presetId)
  return presetIndex >= 0 ? presetIndex : 0
}

function clearTransientHotspotState(state: TrainSoundsState, presetId: TrainPresetId): TrainSoundsState {
  return {
    ...state,
    currentPresetId: presetId,
    focusedHotspotId: null,
    pressedHotspotId: null,
  }
}

function hasHotspot(preset: TrainPresetDefinition, hotspotId: TrainHotspotId): boolean {
  return preset.hotspots.some((hotspot) => hotspot.id === hotspotId)
}

function randomDirection(): TrainDirection {
  return Math.random() < 0.5 ? 'left' : 'right'
}

function randomHasRainbow(): boolean {
  return Math.random() < 0.3
}

function randomCloudOffset(): number {
  return Math.floor(Math.random() * 16)
}

function randomizeSceneParams(state: TrainSoundsState): TrainSoundsState {
  return {
    ...state,
    trainDirection: randomDirection(),
    hasRainbow: randomHasRainbow(),
    cloudOffset: randomCloudOffset(),
  }
}

export function createInitialTrainSoundsState(): TrainSoundsState {
  return randomizeSceneParams({
    currentPresetId: DEFAULT_TRAIN_PRESET_ID,
    focusedHotspotId: null,
    pressedHotspotId: null,
    trainDirection: 'left',
    hasRainbow: false,
    cloudOffset: 0,
    departing: false,
  })
}

export function getCurrentPreset(state: TrainSoundsState): TrainPresetDefinition {
  return getTrainPresetDefinition(state.currentPresetId)
}

export function selectNextTrain(state: TrainSoundsState): TrainSoundsState {
  const currentPresetIndex = getPresetIndex(state.currentPresetId)
  const nextPresetId = TRAIN_PRESET_IDS[(currentPresetIndex + 1) % TRAIN_PRESET_IDS.length]
  return randomizeSceneParams(clearTransientHotspotState(state, nextPresetId))
}

export function selectPreviousTrain(state: TrainSoundsState): TrainSoundsState {
  const currentPresetIndex = getPresetIndex(state.currentPresetId)
  const previousPresetId = TRAIN_PRESET_IDS[(currentPresetIndex - 1 + TRAIN_PRESET_IDS.length) % TRAIN_PRESET_IDS.length]
  return randomizeSceneParams(clearTransientHotspotState(state, previousPresetId))
}

export function allAboard(state: TrainSoundsState, direction: 'next' | 'previous' = 'next'): TrainSoundsState {
  const currentPresetIndex = getPresetIndex(state.currentPresetId)
  const nextPresetId = direction === 'next'
    ? TRAIN_PRESET_IDS[(currentPresetIndex + 1) % TRAIN_PRESET_IDS.length]
    : TRAIN_PRESET_IDS[(currentPresetIndex - 1 + TRAIN_PRESET_IDS.length) % TRAIN_PRESET_IDS.length]
  return randomizeSceneParams({
    ...state,
    currentPresetId: nextPresetId,
    focusedHotspotId: null,
    pressedHotspotId: null,
    departing: true,
  })
}

export function clearDeparting(state: TrainSoundsState): TrainSoundsState {
  if (!state.departing) return state
  return { ...state, departing: false }
}

export function selectHotspot(state: TrainSoundsState, hotspotId: TrainHotspotId): TrainSoundsState {
  const preset = getCurrentPreset(state)

  if (!hasHotspot(preset, hotspotId)) {
    return state
  }

  if (state.focusedHotspotId === hotspotId && state.pressedHotspotId === hotspotId) {
    return state
  }

  return {
    ...state,
    focusedHotspotId: hotspotId,
    pressedHotspotId: hotspotId,
  }
}

export function resetTrainSoundsState(): TrainSoundsState {
  return createInitialTrainSoundsState()
}