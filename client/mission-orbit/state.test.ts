import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advancePhase,
  endBriefing,
  getMissionStepLabel,
  isRecoveryActionReady,
  resolveHoldRelease,
  resolveNarrativePhase,
  setActionHeld,
  startMission,
  tickClock,
  updateCountdown,
  updateHoldProgress,
} from './state'

test('mission starts in countdown with the Artemis II crew and correct step label', () => {
  let state = startMission()
  assert.equal(state.phase, 'countdown')
  assert.equal(getMissionStepLabel(state), 'Step 1 / 10')
  assert.deepEqual(
    state.crew.map((crew) => crew.name),
    ['Reid Wiseman', 'Victor Glover', 'Christina Koch', 'Jeremy Hansen'],
  )

  state = tickClock(state, 1000)
  state = updateCountdown(state)
  assert.equal(state.countdownValue, 9)

  state = advancePhase(state)
  assert.equal(state.phase, 'launch')
  assert.equal(getMissionStepLabel(state), 'Step 2 / 10')
})

test('launch progress stays frozen during briefing and resolves after a full hold', () => {
  let state = advancePhase(startMission())
  assert.equal(state.phase, 'launch')
  assert.equal(state.briefingActive, true)

  const briefingClock = tickClock(state, 900)
  const frozenProgress = updateHoldProgress(briefingClock, 900)
  assert.equal(frozenProgress.holdProgress, 0)

  state = endBriefing(briefingClock)
  assert.equal(state.briefingActive, false)
  assert.equal(state.phaseElapsedMs, 0)

  state = setActionHeld(state, true)
  state = updateHoldProgress(state, 2600)
  assert.equal(state.holdProgress, 1)

  state = resolveHoldRelease(state)
  assert.equal(state.phaseResolved, true)
  assert.equal(state.burnResults.length, 0)
  assert.match(state.outcomeText, /Orbit reached/)
})

test('narrative phases resolve with mission-log outcomes instead of timing scores', () => {
  let state = startMission()
  state = advancePhase(state)
  state = endBriefing(state)
  state = setActionHeld(state, true)
  state = updateHoldProgress(state, 2600)
  state = resolveHoldRelease(state)

  state = advancePhase(state)
  assert.equal(state.phase, 'orbit-insertion')
  assert.equal(state.briefingActive, true)

  state = endBriefing(state)
  state = resolveNarrativePhase(state)

  assert.equal(state.phaseResolved, true)
  assert.equal(state.burnResults.length, 0)
  assert.match(state.outcomeText, /Orbit set/)
})

test('mid-mission hold phases resolve and set their completion flags', () => {
  let state = startMission()

  while (state.phase !== 'trans-lunar-injection') {
    state = advancePhase(state)
  }

  state = endBriefing(state)
  state = setActionHeld(state, true)
  state = updateHoldProgress(state, 2200)
  state = resolveHoldRelease(state)
  assert.match(state.outcomeText, /Transfer burn complete/)

  state = advancePhase(state)
  while (state.phase !== 'service-module-jettison') {
    state = advancePhase(state)
  }

  state = endBriefing(state)
  state = setActionHeld(state, true)
  state = updateHoldProgress(state, 1700)
  state = resolveHoldRelease(state)
  assert.equal(state.serviceModuleDetached, true)

  state = advancePhase(state)
  assert.equal(state.phase, 'parachute-deploy')
  state = endBriefing(state)
  state = setActionHeld(state, true)
  state = updateHoldProgress(state, 1800)
  state = resolveHoldRelease(state)
  assert.equal(state.parachuteDeployed, true)
})

test('recovery phase becomes manually completable only after the boat reaches the capsule', () => {
  let state = startMission()

  while (state.phase !== 'splashdown') {
    state = advancePhase(state)
  }

  state = endBriefing(state)
  assert.equal(isRecoveryActionReady(state), false)

  state = tickClock(state, 6499)
  assert.equal(isRecoveryActionReady(state), false)

  state = tickClock(state, 1)
  assert.equal(isRecoveryActionReady(state), true)
})

test('phase advancement can still reach the celebration screen', () => {
  let state = startMission()

  while (state.phase !== 'celebration') {
    state = advancePhase(state)
  }

  assert.equal(state.missionComplete, true)
})
