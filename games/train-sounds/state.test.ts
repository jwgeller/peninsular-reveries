import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_TRAIN_PRESET_ID,
  TRAIN_PRESET_IDS,
} from './catalog.js'
import {
  createInitialTrainSoundsState,
  resetTrainSoundsState,
  selectHotspot,
  selectNextTrain,
  selectPreviousTrain,
} from './state.js'
import type { TrainDirection, TrainSoundsState } from './types.js'

function assertInitialStateShape(state: TrainSoundsState): void {
  assert.equal(state.currentPresetId, DEFAULT_TRAIN_PRESET_ID)
  assert.equal(state.focusedHotspotId, null)
  assert.equal(state.pressedHotspotId, null)
  assert.ok(state.trainDirection === 'left' || state.trainDirection === 'right')
  assert.equal(typeof state.hasRainbow, 'boolean')
  assert.ok(state.cloudOffset >= 0 && state.cloudOffset <= 15)
  assert.equal(state.departing, false)
}

function makeState(overrides: Partial<TrainSoundsState> = {}): TrainSoundsState {
  return {
    currentPresetId: DEFAULT_TRAIN_PRESET_ID,
    focusedHotspotId: null,
    pressedHotspotId: null,
    trainDirection: 'left' as TrainDirection,
    hasRainbow: false,
    cloudOffset: 0,
    departing: false,
    ...overrides,
  }
}

test('createInitialTrainSoundsState starts on the default preset with no hotspot focus', () => {
  const state = createInitialTrainSoundsState()
  assertInitialStateShape(state)
})

test('selectNextTrain wraps from the last preset back to the default preset and clears hotspot state', () => {
  const state = makeState({
    currentPresetId: TRAIN_PRESET_IDS[TRAIN_PRESET_IDS.length - 1],
    focusedHotspotId: 'high-speed-brake',
    pressedHotspotId: 'high-speed-brake',
  })

  const result = selectNextTrain(state)
  assert.equal(result.currentPresetId, DEFAULT_TRAIN_PRESET_ID)
  assert.equal(result.focusedHotspotId, null)
  assert.equal(result.pressedHotspotId, null)
  assert.ok(result.trainDirection === 'left' || result.trainDirection === 'right')
  assert.equal(typeof result.hasRainbow, 'boolean')
  assert.ok(result.cloudOffset >= 0 && result.cloudOffset <= 15)
  assert.equal(result.departing, false)
})

test('selectPreviousTrain wraps from the default preset to the last preset and clears hotspot state', () => {
  const state = makeState({
    currentPresetId: DEFAULT_TRAIN_PRESET_ID,
    focusedHotspotId: 'steam-bell',
    pressedHotspotId: 'steam-bell',
  })

  const result = selectPreviousTrain(state)
  assert.equal(result.currentPresetId, TRAIN_PRESET_IDS[TRAIN_PRESET_IDS.length - 1])
  assert.equal(result.focusedHotspotId, null)
  assert.equal(result.pressedHotspotId, null)
  assert.ok(result.trainDirection === 'left' || result.trainDirection === 'right')
  assert.equal(typeof result.hasRainbow, 'boolean')
  assert.ok(result.cloudOffset >= 0 && result.cloudOffset <= 15)
  assert.equal(result.departing, false)
})

test('selectHotspot focuses and presses a hotspot on the active preset', () => {
  const initialState = createInitialTrainSoundsState()
  const nextState = selectHotspot(initialState, 'steam-whistle')

  assert.equal(nextState.currentPresetId, initialState.currentPresetId)
  assert.equal(nextState.focusedHotspotId, 'steam-whistle')
  assert.equal(nextState.pressedHotspotId, 'steam-whistle')
  assert.equal(nextState.trainDirection, initialState.trainDirection)
  assert.equal(nextState.hasRainbow, initialState.hasRainbow)
  assert.equal(nextState.cloudOffset, initialState.cloudOffset)
  assert.equal(nextState.departing, initialState.departing)
})

test('selectHotspot ignores hotspots that are not part of the active preset and repeated active selections', () => {
  const initialState = createInitialTrainSoundsState()
  const invalidHotspotState = selectHotspot(initialState, 'diesel-horn')
  const selectedState = selectHotspot(initialState, 'steam-whistle')

  assert.equal(invalidHotspotState, initialState)
  assert.equal(selectHotspot(selectedState, 'steam-whistle'), selectedState)
})

test('resetTrainSoundsState restores the initial preset and clears hotspot state', () => {
  const resetResult = resetTrainSoundsState()
  assertInitialStateShape(resetResult)
  assert.equal(resetResult.currentPresetId, DEFAULT_TRAIN_PRESET_ID)
  assert.equal(resetResult.focusedHotspotId, null)
  assert.equal(resetResult.pressedHotspotId, null)
  assert.equal(resetResult.departing, false)
})