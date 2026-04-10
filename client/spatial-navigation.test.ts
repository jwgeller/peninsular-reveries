import assert from 'node:assert/strict'
import test from 'node:test'

import { findNearestDirectionalTarget } from './spatial-navigation'

test('spatial navigation prefers a nearer slightly off-axis target over a far aligned target', () => {
  const current = { id: 'current', x: 0, y: 0 }
  const farAligned = { id: 'far-aligned', x: 180, y: 0 }
  const nearerOffAxis = { id: 'nearer-off-axis', x: 96, y: 28 }

  const target = findNearestDirectionalTarget(current, [farAligned, nearerOffAxis], 'ArrowRight')

  assert.equal(target?.id, 'nearer-off-axis')
})

test('spatial navigation still rejects a steep diagonal when a cleaner directional target exists', () => {
  const current = { id: 'current', x: 0, y: 0 }
  const steepDiagonal = { id: 'steep-diagonal', x: 72, y: 68 }
  const cleanerLane = { id: 'cleaner-lane', x: 122, y: 6 }

  const target = findNearestDirectionalTarget(current, [steepDiagonal, cleanerLane], 'ArrowRight')

  assert.equal(target?.id, 'cleaner-lane')
})

test('spatial navigation ignores candidates that do not advance in the requested direction', () => {
  const current = { id: 'current', x: 120, y: 120 }
  const behind = { id: 'behind', x: 60, y: 118 }
  const ahead = { id: 'ahead', x: 168, y: 138 }

  const target = findNearestDirectionalTarget(current, [behind, ahead], 'ArrowRight')

  assert.equal(target?.id, 'ahead')
})