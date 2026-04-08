import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceTravelProgress,
  collectMemory,
  createInitialState,
  navigateGlobe,
  prepareTravel,
  returnToGlobe,
  startExploreMode,
} from './state'

test('initial state preserves saved memories', () => {
  const state = createInitialState({
    collectedMemories: ['paris', 'tokyo'],
  })

  assert.equal(state.phase, 'title')
  assert.deepEqual(state.collectedMemories, ['paris', 'tokyo'])
})

test('explore mode opens the globe', () => {
  const state = startExploreMode(createInitialState())
  assert.equal(state.phase, 'globe')
})

test('travel progress clamps and returning to the globe settles the current location', () => {
  const state = prepareTravel(startExploreMode(createInitialState()), 'rio', 'boat')
  const progressed = advanceTravelProgress(state, 999_999)
  assert.equal(progressed.travelProgress, 1)

  const returned = returnToGlobe({
    ...progressed,
    phase: 'memory-collect',
    memoryWasNew: true,
  })

  assert.equal(returned.phase, 'globe')
  assert.equal(returned.currentLocation, 'rio')
  assert.equal(returned.targetDestination, null)
})

test('collecting a memory records whether it was new', () => {
  const firstPass = collectMemory({
    ...prepareTravel(startExploreMode(createInitialState()), 'paris', 'plane'),
    phase: 'memory-collect',
  })

  assert.deepEqual(firstPass.collectedMemories, ['paris'])
  assert.equal(firstPass.memoryWasNew, true)

  const revisit = collectMemory({
    ...firstPass,
    targetDestination: 'paris',
    phase: 'memory-collect',
  })

  assert.deepEqual(revisit.collectedMemories, ['paris'])
  assert.equal(revisit.memoryWasNew, false)
})

test('globe navigation wraps at both ends', () => {
  const state = startExploreMode(createInitialState())
  const previous = navigateGlobe(state, 'previous')
  assert.equal(previous.globeSelectedIndex, 8)

  const wrapped = navigateGlobe(previous, 'next')
  assert.equal(wrapped.globeSelectedIndex, 0)
})