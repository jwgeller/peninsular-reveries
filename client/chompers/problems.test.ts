import assert from 'node:assert/strict'
import test from 'node:test'
import { generateProblem, buildSceneItems, selectProblems } from './problems'
import { SCENE_ITEM_COUNTS } from './types'
import type { Difficulty } from './types'

const SEED = 0xc0ffee

test('addition problems always produce sums <= 20', () => {
  let rng = SEED
  for (let i = 0; i < 100; i++) {
    const result = generateProblem('addition', rng)
    assert.ok(
      result.problem.correctAnswer <= 20,
      `Expected answer <= 20, got ${result.problem.correctAnswer} (round ${i})`,
    )
    rng = result.rng
  }
})

test('subtraction problems always produce non-negative results', () => {
  let rng = SEED
  for (let i = 0; i < 100; i++) {
    const result = generateProblem('subtraction', rng)
    assert.ok(
      result.problem.correctAnswer >= 0,
      `Expected answer >= 0, got ${result.problem.correctAnswer} (round ${i})`,
    )
    rng = result.rng
  }
})

test('division problems always produce whole-number quotients', () => {
  let rng = SEED
  for (let i = 0; i < 100; i++) {
    const result = generateProblem('division', rng)
    assert.equal(
      result.problem.correctAnswer,
      Math.floor(result.problem.correctAnswer),
      `Expected whole-number quotient, got ${result.problem.correctAnswer} (round ${i})`,
    )
    rng = result.rng
  }
})

test('multiplication problems produce valid products', () => {
  let rng = SEED
  for (let i = 0; i < 100; i++) {
    const result = generateProblem('multiplication', rng)
    assert.ok(result.problem.correctAnswer >= 4, `Expected product >= 4, got ${result.problem.correctAnswer} (round ${i})`)
    assert.ok(result.problem.correctAnswer <= 81, `Expected product <= 81, got ${result.problem.correctAnswer} (round ${i})`)
    rng = result.rng
  }
})

test('buildSceneItems: no duplicate values in scene items', () => {
  const difficulties: Difficulty[] = ['counting', 'addition', 'subtraction', 'multiplication', 'division']
  let rng = SEED

  for (const difficulty of difficulties) {
    for (let i = 0; i < 20; i++) {
      const pResult = generateProblem(difficulty, rng)
      rng = pResult.rng
      const sResult = buildSceneItems(pResult.problem, difficulty, rng)
      rng = sResult.rng

      const values = sResult.items.map((item) => item.value)
      const unique = new Set(values)
      assert.equal(
        unique.size,
        values.length,
        `Duplicate values found for ${difficulty} round ${i}: ${values.join(', ')}`,
      )
    }
  }
})

test('buildSceneItems: correct answer present exactly once', () => {
  const difficulties: Difficulty[] = ['counting', 'addition', 'subtraction', 'multiplication', 'division']
  let rng = SEED

  for (const difficulty of difficulties) {
    for (let i = 0; i < 20; i++) {
      const pResult = generateProblem(difficulty, rng)
      rng = pResult.rng
      const sResult = buildSceneItems(pResult.problem, difficulty, rng)
      rng = sResult.rng

      const correctItems = sResult.items.filter((item) => item.isCorrect)
      assert.equal(
        correctItems.length,
        1,
        `Expected exactly 1 correct item for ${difficulty} round ${i}, got ${correctItems.length}`,
      )
      assert.equal(
        correctItems[0].value,
        pResult.problem.correctAnswer,
        `Correct item value mismatch for ${difficulty} round ${i}`,
      )
    }
  }
})

test('buildSceneItems: item count matches SCENE_ITEM_COUNTS for each difficulty', () => {
  const difficulties: Difficulty[] = ['counting', 'addition', 'subtraction', 'multiplication', 'division']
  let rng = SEED

  for (const difficulty of difficulties) {
    const pResult = generateProblem(difficulty, rng)
    rng = pResult.rng
    const sResult = buildSceneItems(pResult.problem, difficulty, rng)
    rng = sResult.rng

    assert.equal(
      sResult.items.length,
      SCENE_ITEM_COUNTS[difficulty],
      `Expected ${SCENE_ITEM_COUNTS[difficulty]} items for ${difficulty}, got ${sResult.items.length}`,
    )
  }
})

test('buildSceneItems: all positions within 5–95% bounds', () => {
  const difficulties: Difficulty[] = ['counting', 'addition', 'subtraction', 'multiplication', 'division']
  let rng = SEED

  for (const difficulty of difficulties) {
    for (let i = 0; i < 10; i++) {
      const pResult = generateProblem(difficulty, rng)
      rng = pResult.rng
      const sResult = buildSceneItems(pResult.problem, difficulty, rng)
      rng = sResult.rng

      for (const item of sResult.items) {
        assert.ok(item.x >= 5 && item.x <= 95, `x=${item.x} out of bounds for ${difficulty} item ${item.id}`)
        assert.ok(item.y >= 5 && item.y <= 95, `y=${item.y} out of bounds for ${difficulty} item ${item.id}`)
      }
    }
  }
})

test('selectProblems: returns the requested number of problems', () => {
  const problems = selectProblems('addition', 10, SEED)
  assert.equal(problems.length, 10)

  const single = selectProblems('multiplication', 1, SEED)
  assert.equal(single.length, 1)

  const empty = selectProblems('division', 0, SEED)
  assert.equal(empty.length, 0)
})
