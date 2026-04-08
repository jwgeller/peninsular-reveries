import type { Area, AreaLevel, Problem, SceneItem } from './types.js'
import { AREA_LEVEL_RANGES, BASE_LAYOUTS, FRUIT_POOL, SCENE_ITEM_COUNTS } from './types.js'

const COUNTING_SYMBOLS = ['●', '■', '▲', '★', '♦', '♥', '⬟', '⬡'] as const

function randInt(rng: () => number, min: number, max: number): number {
  return Math.min(max, min + Math.floor(rng() * (max - min + 1)))
}

function generateDistractors(correctAnswer: number, count: number, rng: () => number): number[] {
  const used = new Set([correctAnswer])
  const distractors: number[] = []

  // Produce nearby (off-by-one to off-by-five) candidates
  const nearby: number[] = []
  for (let offset = 1; offset <= 5; offset++) {
    const above = correctAnswer + offset
    const below = correctAnswer - offset
    if (above > 0) nearby.push(above)
    if (below > 0) nearby.push(below)
  }

  // Shuffle nearby with rng
  for (let i = nearby.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i)
    ;[nearby[i], nearby[j]] = [nearby[j], nearby[i]]
  }

  for (const candidate of nearby) {
    if (distractors.length >= count) break
    if (!used.has(candidate)) {
      used.add(candidate)
      distractors.push(candidate)
    }
  }

  // Fill remaining slots with random values near the correct answer
  let attempts = 0
  while (distractors.length < count && attempts < 100) {
    attempts++
    const lo = Math.max(1, correctAnswer - 10)
    const hi = correctAnswer + 10
    const candidate = randInt(rng, lo, hi)
    if (!used.has(candidate)) {
      used.add(candidate)
      distractors.push(candidate)
    }
  }

  return distractors
}

export function generateProblem(area: Area, level: AreaLevel, rng: () => number): Problem {
  const range = AREA_LEVEL_RANGES[area][level]
  let prompt: string
  let correctAnswer: number
  let countingObjects: readonly string[] | undefined

  if (area === 'matching') {
    const n = randInt(rng, range.min, range.max)
    prompt = `Find ${n}`
    correctAnswer = n
  } else if (area === 'counting') {
    const n = randInt(rng, range.min, range.max)
    const symbols: string[] = []
    for (let i = 0; i < n; i++) {
      symbols.push(COUNTING_SYMBOLS[randInt(rng, 0, COUNTING_SYMBOLS.length - 1)])
    }
    countingObjects = symbols
    prompt = 'Count the objects'
    correctAnswer = n
  } else if (area === 'addition') {
    let a: number, b: number
    if (level === 1) {
      a = randInt(rng, 1, range.max)
      b = randInt(rng, 1, Math.min(range.max, 5 - a))
    } else if (level === 2) {
      a = randInt(rng, 1, range.max)
      b = randInt(rng, 1, Math.min(range.max, 10 - a))
    } else {
      a = randInt(rng, 1, 10)
      b = randInt(rng, 1, Math.min(10, 20 - a))
    }
    prompt = `${a} + ${b}`
    correctAnswer = a + b
  } else if (area === 'subtraction') {
    const a = randInt(rng, range.min, range.max)
    const b = randInt(rng, 1, a - 1)
    prompt = `${a} \u2212 ${b}`
    correctAnswer = a - b
  } else if (area === 'multiplication') {
    const a = randInt(rng, range.min, range.max)
    const b = randInt(rng, range.min, range.max)
    prompt = `${a} \u00d7 ${b}`
    correctAnswer = a * b
  } else {
    // division
    const b = randInt(rng, range.min, range.max)
    const c = randInt(rng, range.min, range.max)
    const dividend = b * c
    prompt = `${dividend} \u00f7 ${b}`
    correctAnswer = c
  }

  if (countingObjects !== undefined) {
    return { prompt, correctAnswer, operation: area, area, countingObjects }
  }
  return { prompt, correctAnswer, operation: area, area }
}

export function buildSceneItems(problem: Problem, area: Area, rng: () => number): SceneItem[] {
  const itemCount = SCENE_ITEM_COUNTS[area]
  const distractorCount = itemCount - 1
  const distractors = generateDistractors(problem.correctAnswer, distractorCount, rng)

  // Merge correct answer + distractors into a value array
  const values = [problem.correctAnswer, ...distractors]

  // Shuffle values (Fisher-Yates)
  for (let i = values.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i)
    ;[values[i], values[j]] = [values[j], values[i]]
  }

  // Shuffle base layout positions
  const basePositions = [...(BASE_LAYOUTS[itemCount] ?? BASE_LAYOUTS[6])]
  for (let i = basePositions.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i)
    ;[basePositions[i], basePositions[j]] = [basePositions[j], basePositions[i]]
  }

  return values.map((value, index) => {
    const base = basePositions[index] ?? { x: 50, y: 50 }
    const jx = randInt(rng, -5, 5)
    const jy = randInt(rng, -4, 4)
    const emIdx = randInt(rng, 0, FRUIT_POOL.length - 1)
    const x = Math.min(95, Math.max(5, base.x + jx))
    const y = Math.min(95, Math.max(5, base.y + jy))
    return {
      id: `item-${index}`,
      value,
      emoji: FRUIT_POOL[emIdx],
      x,
      y,
      isCorrect: value === problem.correctAnswer,
    }
  })
}
