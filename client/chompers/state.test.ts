import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState, selectAnswer, resolveChomp, advanceRound, resetGame } from './state'
import { SCENE_ITEM_COUNTS, START_LIVES, TOTAL_ROUNDS } from './types'

const SEED = 0xc0ffee

test('createInitialState produces valid initial state', () => {
  const state = createInitialState('classic', 'addition', SEED)

  assert.equal(state.phase, 'playing')
  assert.equal(state.round, 1)
  assert.equal(state.totalRounds, TOTAL_ROUNDS)
  assert.equal(state.lives, START_LIVES)
  assert.equal(state.score, 0)
  assert.equal(state.streak, 0)
  assert.equal(state.bestStreak, 0)
  assert.equal(state.correctCount, 0)
  assert.equal(state.mode, 'classic')
  assert.equal(state.difficulty, 'addition')
  assert.equal(state.sceneItems.length, SCENE_ITEM_COUNTS['addition'])
  assert.ok(state.sceneItems.some((item) => item.isCorrect), 'Expected at least one correct item')
})

test('correct answer flow: score increases, streak increments, advances to round 2', () => {
  const state = createInitialState('classic', 'addition', SEED)
  const correctItem = state.sceneItems.find((item) => item.isCorrect)
  assert.ok(correctItem, 'Expected a correct item in scene')

  const chomping = selectAnswer(state, correctItem.id)
  assert.equal(chomping.phase, 'chomping')
  assert.equal(chomping.hippo.targetItemId, correctItem.id)

  const feedback = resolveChomp(chomping)
  assert.equal(feedback.phase, 'feedback')
  assert.ok(feedback.score > 0, 'Expected score to increase')
  assert.equal(feedback.streak, 1)
  assert.equal(feedback.bestStreak, 1)
  assert.equal(feedback.correctCount, 1)
  assert.equal(feedback.lives, START_LIVES)

  const next = advanceRound(feedback)
  assert.equal(next.phase, 'playing')
  assert.equal(next.round, 2)
})

test('wrong answer flow: lives decrease, streak resets', () => {
  const state = createInitialState('classic', 'addition', SEED)
  const wrongItem = state.sceneItems.find((item) => !item.isCorrect)
  assert.ok(wrongItem, 'Expected a wrong item in scene')

  const chomping = selectAnswer(state, wrongItem.id)
  const feedback = resolveChomp(chomping)

  assert.equal(feedback.phase, 'feedback')
  assert.equal(feedback.lives, START_LIVES - 1)
  assert.equal(feedback.streak, 0)
  assert.equal(feedback.score, 0)
})

test('game over after totalRounds', () => {
  let state = createInitialState('classic', 'addition', SEED)
  assert.equal(state.totalRounds, TOTAL_ROUNDS)

  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    state = advanceRound({ ...state, phase: 'feedback' })
  }

  assert.equal(state.phase, 'gameover')
})

test('game over early when lives reach 0', () => {
  const state = createInitialState('classic', 'addition', SEED)
  const depleted = { ...state, lives: 0, phase: 'feedback' as const }
  const result = advanceRound(depleted)
  assert.equal(result.phase, 'gameover')
})

test('streak increments on consecutive correct answers and bestStreak tracks the max', () => {
  let state = createInitialState('classic', 'multiplication', SEED)

  for (let round = 0; round < 4; round++) {
    const correctItem = state.sceneItems.find((item) => item.isCorrect)
    assert.ok(correctItem, `Expected correct item in round ${round + 1}`)
    state = resolveChomp(selectAnswer(state, correctItem.id))
    assert.equal(state.streak, round + 1, `Streak should be ${round + 1} after ${round + 1} correct answers`)
    assert.equal(state.bestStreak, round + 1)
    state = advanceRound(state)
    if (state.phase === 'gameover') break
  }
})

test('wrong answer after a streak resets streak but preserves bestStreak', () => {
  let state = createInitialState('classic', 'subtraction', SEED)

  // Get two correct answers to build a streak
  for (let round = 0; round < 2; round++) {
    const correctItem = state.sceneItems.find((item) => item.isCorrect)!
    state = resolveChomp(selectAnswer(state, correctItem.id))
    state = advanceRound(state)
  }

  const streakBeforeWrong = state.bestStreak

  // Now answer wrong
  const wrongItem = state.sceneItems.find((item) => !item.isCorrect)!
  state = resolveChomp(selectAnswer(state, wrongItem.id))

  assert.equal(state.streak, 0)
  assert.equal(state.bestStreak, streakBeforeWrong)
})

test('score accumulation matches pointsForDifficulty per tier', () => {
  const expectations: Array<[Parameters<typeof createInitialState>[1], number]> = [
    ['counting', 5],
    ['addition', 10],
    ['subtraction', 10],
    ['multiplication', 15],
    ['division', 20],
  ]

  for (const [difficulty, expectedPoints] of expectations) {
    const state = createInitialState('classic', difficulty, SEED)
    const correctItem = state.sceneItems.find((item) => item.isCorrect)!
    const result = resolveChomp(selectAnswer(state, correctItem.id))
    assert.equal(result.score, expectedPoints, `Expected ${expectedPoints} points for ${difficulty}`)
  }
})

test('resetGame returns to round 1 with same mode and difficulty', () => {
  let state = createInitialState('frenzy', 'division', SEED)
  state = advanceRound({ ...state, phase: 'feedback' })
  state = advanceRound({ ...state, phase: 'feedback' })
  assert.equal(state.round, 3)

  const reset = resetGame(state)
  assert.equal(reset.round, 1)
  assert.equal(reset.mode, 'frenzy')
  assert.equal(reset.difficulty, 'division')
  assert.equal(reset.phase, 'playing')
  assert.equal(reset.score, 0)
})

