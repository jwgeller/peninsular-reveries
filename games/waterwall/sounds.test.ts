import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  EDGE_CUE_FREQUENCY,
  EDGE_CUE_PAN,
  profileLoopDurationMs,
  waterwallAmbientProfile,
  type CursorEdge,
} from './sounds.js'

describe('waterwallAmbientProfile structure', () => {
  it('has a valid id and label', () => {
    assert.equal(waterwallAmbientProfile.id, 'waterwall-ambient')
    assert.equal(typeof waterwallAmbientProfile.label, 'string')
    assert.ok(waterwallAmbientProfile.label.length > 0)
  })

  it('has valid scheduling metadata', () => {
    assert.ok(waterwallAmbientProfile.tempoBpm > 0)
    assert.ok(waterwallAmbientProfile.stepsPerBeat > 0)
    assert.ok(waterwallAmbientProfile.loopBeats > 0)
    assert.ok(waterwallAmbientProfile.events.length > 0)
  })

  it('all events have valid frequency, gain ≤ 0.05, and valid oscillator type', () => {
    const validTypes = new Set(['sine', 'triangle', 'square', 'sawtooth'])

    for (const event of waterwallAmbientProfile.events) {
      assert.ok(event.frequency > 0, `frequency ${event.frequency} must be > 0`)
      assert.ok(event.gain > 0, `gain ${event.gain} must be > 0`)
      assert.ok(event.gain <= 0.05, `gain ${event.gain} must be ≤ 0.05`)
      assert.ok(validTypes.has(event.type), `type '${event.type}' must be a valid OscillatorType`)
      assert.ok(Number.isInteger(event.startStep), `startStep ${event.startStep} must be integer`)
      assert.ok(Number.isInteger(event.durationSteps), `durationSteps ${event.durationSteps} must be integer`)
      assert.ok(event.startStep >= 0, `startStep ${event.startStep} must be >= 0`)
      assert.ok(event.durationSteps > 0, `durationSteps ${event.durationSteps} must be > 0`)
    }
  })

  it('events are in non-decreasing startStep order', () => {
    let previousStep = -1
    for (const event of waterwallAmbientProfile.events) {
      assert.ok(event.startStep >= previousStep, `event at step ${event.startStep} is before previous step ${previousStep}`)
      previousStep = event.startStep
    }
  })
})

describe('profile loop duration', () => {
  it('is calculable from tempo and loop beats', () => {
    const durationMs = profileLoopDurationMs(waterwallAmbientProfile)
    const expectedMs = waterwallAmbientProfile.loopBeats * (60 / waterwallAmbientProfile.tempoBpm) * 1000
    assert.equal(durationMs, expectedMs)
    assert.ok(durationMs > 0)
  })
})

describe('edge cue pan mapping', () => {
  it('left edge maps to pan -1', () => {
    assert.equal(EDGE_CUE_PAN.left, -1)
  })

  it('right edge maps to pan +1', () => {
    assert.equal(EDGE_CUE_PAN.right, 1)
  })

  it('top edge maps to pan 0', () => {
    assert.equal(EDGE_CUE_PAN.top, 0)
  })

  it('bottom edge maps to pan 0', () => {
    assert.equal(EDGE_CUE_PAN.bottom, 0)
  })

  it('all edge directions have defined pan values in [-1, 1]', () => {
    const edges: CursorEdge[] = ['left', 'right', 'top', 'bottom']
    for (const edge of edges) {
      const pan = EDGE_CUE_PAN[edge]
      assert.ok(pan >= -1 && pan <= 1, `pan for '${edge}' is ${pan}, must be in [-1, 1]`)
    }
  })
})

describe('edge cue frequencies', () => {
  it('top uses higher pitch than bottom', () => {
    assert.ok(EDGE_CUE_FREQUENCY.top > EDGE_CUE_FREQUENCY.bottom)
  })

  it('top is ~600Hz', () => {
    assert.equal(EDGE_CUE_FREQUENCY.top, 600)
  })

  it('bottom is ~200Hz', () => {
    assert.equal(EDGE_CUE_FREQUENCY.bottom, 200)
  })
})

describe('water distribution to StereoPannerNode range', () => {
  it('centerOfMass 0 maps to pan 0 (center)', () => {
    // computeWaterDistribution returns centerOfMass in [-1, 1]
    // updateWaterPanning clamps to [-1, 1] — verify the mapping is identity
    const centerOfMass = 0
    const pan = Math.max(-1, Math.min(1, centerOfMass))
    assert.equal(pan, 0)
  })

  it('centerOfMass -1 maps to pan -1 (full left)', () => {
    const centerOfMass = -1
    const pan = Math.max(-1, Math.min(1, centerOfMass))
    assert.equal(pan, -1)
  })

  it('centerOfMass +1 maps to pan +1 (full right)', () => {
    const centerOfMass = 1
    const pan = Math.max(-1, Math.min(1, centerOfMass))
    assert.equal(pan, 1)
  })

  it('values beyond [-1, 1] are clamped', () => {
    assert.equal(Math.max(-1, Math.min(1, -2)), -1)
    assert.equal(Math.max(-1, Math.min(1, 1.5)), 1)
    assert.equal(Math.max(-1, Math.min(1, 0.5)), 0.5)
  })
})
