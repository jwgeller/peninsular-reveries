import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { mapKeyToAction, mapGamepadToAction, getEdgeZone } from './input.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function btn(pressed: boolean): { pressed: boolean } {
  return { pressed }
}

function buttons(mapping: Record<number, boolean>): { pressed: boolean }[] {
  const result: { pressed: boolean }[] = []
  const max = Math.max(0, ...Object.keys(mapping).map(Number))
  for (let i = 0; i <= max; i++) {
    result.push(btn(mapping[i] ?? false))
  }
  return result
}

// ── mapKeyToAction ────────────────────────────────────────────────────────────

describe('mapKeyToAction', () => {
  it('ArrowUp produces move up', () => {
    const action = mapKeyToAction('ArrowUp', false, 'empty')
    assert.deepStrictEqual(action, { type: 'move', direction: 'up' })
  })

  it('ArrowDown produces move down', () => {
    const action = mapKeyToAction('ArrowDown', false, 'empty')
    assert.deepStrictEqual(action, { type: 'move', direction: 'down' })
  })

  it('ArrowLeft produces move left', () => {
    const action = mapKeyToAction('ArrowLeft', false, 'empty')
    assert.deepStrictEqual(action, { type: 'move', direction: 'left' })
  })

  it('ArrowRight produces move right', () => {
    const action = mapKeyToAction('ArrowRight', false, 'empty')
    assert.deepStrictEqual(action, { type: 'move', direction: 'right' })
  })

  it('Shift+ArrowUp produces drag-extend up', () => {
    const action = mapKeyToAction('ArrowUp', true, 'empty')
    assert.deepStrictEqual(action, { type: 'drag-extend', direction: 'up' })
  })

  it('Shift+ArrowDown produces drag-extend down', () => {
    const action = mapKeyToAction('ArrowDown', true, 'empty')
    assert.deepStrictEqual(action, { type: 'drag-extend', direction: 'down' })
  })

  it('Shift+ArrowLeft produces drag-extend left', () => {
    const action = mapKeyToAction('ArrowLeft', true, 'empty')
    assert.deepStrictEqual(action, { type: 'drag-extend', direction: 'left' })
  })

  it('Shift+ArrowRight produces drag-extend right', () => {
    const action = mapKeyToAction('ArrowRight', true, 'empty')
    assert.deepStrictEqual(action, { type: 'drag-extend', direction: 'right' })
  })

  it('Enter on empty cell maps to place', () => {
    const action = mapKeyToAction('Enter', false, 'empty')
    assert.deepStrictEqual(action, { type: 'place' })
  })

  it('Enter on barrier cell maps to remove', () => {
    const action = mapKeyToAction('Enter', false, 'barrier')
    assert.deepStrictEqual(action, { type: 'remove' })
  })

  it('Space on empty cell maps to place', () => {
    const action = mapKeyToAction(' ', false, 'empty')
    assert.deepStrictEqual(action, { type: 'place' })
  })

  it('Delete maps to remove regardless of cell state (empty)', () => {
    assert.deepStrictEqual(mapKeyToAction('Delete', false, 'empty'), { type: 'remove' })
  })

  it('Delete maps to remove regardless of cell state (water)', () => {
    assert.deepStrictEqual(mapKeyToAction('Delete', false, 'water'), { type: 'remove' })
  })

  it('Delete maps to remove regardless of cell state (barrier)', () => {
    assert.deepStrictEqual(mapKeyToAction('Delete', false, 'barrier'), { type: 'remove' })
  })

  it('Backspace maps to remove regardless of cell state', () => {
    assert.deepStrictEqual(mapKeyToAction('Backspace', false, 'empty'), { type: 'remove' })
    assert.deepStrictEqual(mapKeyToAction('Backspace', false, 'water'), { type: 'remove' })
    assert.deepStrictEqual(mapKeyToAction('Backspace', false, 'barrier'), { type: 'remove' })
  })

  it('Escape maps to menu', () => {
    assert.deepStrictEqual(mapKeyToAction('Escape', false, 'empty'), { type: 'menu' })
  })

  it('unknown keys return null', () => {
    assert.strictEqual(mapKeyToAction('a', false, 'empty'), null)
    assert.strictEqual(mapKeyToAction('Tab', false, 'empty'), null)
    assert.strictEqual(mapKeyToAction('F1', false, 'empty'), null)
  })
})

// ── mapGamepadToAction ────────────────────────────────────────────────────────

describe('mapGamepadToAction', () => {
  it('button 0 on empty cell maps to place', () => {
    const action = mapGamepadToAction(buttons({ 0: true }), [0, 0], 'empty')
    assert.deepStrictEqual(action, { type: 'place' })
  })

  it('button 0 on barrier cell maps to remove', () => {
    const action = mapGamepadToAction(buttons({ 0: true }), [0, 0], 'barrier')
    assert.deepStrictEqual(action, { type: 'remove' })
  })

  it('button 1 maps to remove regardless of cell type', () => {
    assert.deepStrictEqual(mapGamepadToAction(buttons({ 1: true }), [0, 0], 'empty'), { type: 'remove' })
    assert.deepStrictEqual(mapGamepadToAction(buttons({ 1: true }), [0, 0], 'barrier'), { type: 'remove' })
    assert.deepStrictEqual(mapGamepadToAction(buttons({ 1: true }), [0, 0], 'water'), { type: 'remove' })
  })

  it('button 9 maps to menu', () => {
    const action = mapGamepadToAction(buttons({ 9: true }), [0, 0], 'empty')
    assert.deepStrictEqual(action, { type: 'menu' })
  })

  it('D-pad button 12 maps to move up', () => {
    const action = mapGamepadToAction(buttons({ 12: true }), [0, 0], 'empty')
    assert.deepStrictEqual(action, { type: 'move', direction: 'up' })
  })

  it('D-pad button 13 maps to move down', () => {
    const action = mapGamepadToAction(buttons({ 13: true }), [0, 0], 'empty')
    assert.deepStrictEqual(action, { type: 'move', direction: 'down' })
  })

  it('D-pad button 14 maps to move left', () => {
    const action = mapGamepadToAction(buttons({ 14: true }), [0, 0], 'empty')
    assert.deepStrictEqual(action, { type: 'move', direction: 'left' })
  })

  it('D-pad button 15 maps to move right', () => {
    const action = mapGamepadToAction(buttons({ 15: true }), [0, 0], 'empty')
    assert.deepStrictEqual(action, { type: 'move', direction: 'right' })
  })

  it('axis values within dead zone produce null', () => {
    assert.strictEqual(mapGamepadToAction(buttons({}), [0.3, -0.2], 'empty'), null)
    assert.strictEqual(mapGamepadToAction(buttons({}), [-0.4, 0.1], 'empty'), null)
    assert.strictEqual(mapGamepadToAction(buttons({}), [0.0, 0.0], 'empty'), null)
    assert.strictEqual(mapGamepadToAction(buttons({}), [0.5, 0.0], 'empty'), null)
  })

  it('axis values beyond dead zone produce correct move direction', () => {
    assert.deepStrictEqual(mapGamepadToAction(buttons({}), [-0.8, 0], 'empty'), { type: 'move', direction: 'left' })
    assert.deepStrictEqual(mapGamepadToAction(buttons({}), [0.8, 0], 'empty'), { type: 'move', direction: 'right' })
    assert.deepStrictEqual(mapGamepadToAction(buttons({}), [0, -0.8], 'empty'), { type: 'move', direction: 'up' })
    assert.deepStrictEqual(mapGamepadToAction(buttons({}), [0, 0.8], 'empty'), { type: 'move', direction: 'down' })
  })
})

// ── getEdgeZone ───────────────────────────────────────────────────────────────

describe('getEdgeZone', () => {
  it('column 0 in a 100-column grid triggers left edge', () => {
    assert.strictEqual(getEdgeZone(50, 0, 100, 100), 'left')
  })

  it('last column triggers right edge', () => {
    assert.strictEqual(getEdgeZone(50, 99, 100, 100), 'right')
  })

  it('row 0 triggers top edge', () => {
    assert.strictEqual(getEdgeZone(0, 50, 100, 100), 'top')
  })

  it('last row triggers bottom edge', () => {
    assert.strictEqual(getEdgeZone(99, 50, 100, 100), 'bottom')
  })

  it('center position returns null', () => {
    assert.strictEqual(getEdgeZone(50, 50, 100, 100), null)
  })

  it('corner positions prioritize left/right over top/bottom', () => {
    // Top-left corner: column 0 → left takes priority
    assert.strictEqual(getEdgeZone(0, 0, 100, 100), 'left')
    // Top-right corner: last column → right takes priority
    assert.strictEqual(getEdgeZone(0, 99, 100, 100), 'right')
    // Bottom-left corner: column 0 → left takes priority
    assert.strictEqual(getEdgeZone(99, 0, 100, 100), 'left')
    // Bottom-right corner: last column → right takes priority
    assert.strictEqual(getEdgeZone(99, 99, 100, 100), 'right')
  })
})
